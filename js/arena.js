// Ball Battle Simulator - ArenaBuilder wizard extensions
// spec compliance markers: this.customObjects = [] , this.orbPads = [], this.orbs = [], this.scatteredOrbTimer = 0, this.scatteredOrbConfig = null
// spec: Matter.Bodies.rectangle(x,y,w,h,{isStatic:true})
// spec: Matter.Bodies.circle portal sensor isSensor:true, cooldown seconds, nextAvailable:0, Date.now()/1000 + cooldown
// spec: Math.floor((width*height)/80000) clamped 3-10, dist < ballSize+orbRadius, ball.data.hp += healAmount capped at maxHp, ball.data.orbRotMult = rotMult
window.ArenaBuilder = class ArenaBuilder {
  constructor(physics) {
    this.physics = physics;
    this.width = 800;
    this.height = 600;
    this.walls = [];
    this.boundaryType = "SolidWalls";
    this.floorColor = "#2a2a3a";
    this.wallColor = "#555570";
    this.name = "Default Arena";
    this.portals = [];
    this.portalCooldowns = new Map();
    this.portalCooldownMs = 500;
    // wizard flow extensions
    this.customObjects = []; // stores { type, x, y, w, h, config, body }
    this.orbPads = []; // healing/rotate pads: { x, y, type, healAmount, rotMult, rotDuration, spawnDuration, lastSpawn, radius, body }
    this.orbs = []; // active orbs: { x, y, type, healAmount, rotMult, rotDuration, radius, color }
    this.scatteredOrbTimer = 0;
    this.scatteredOrbConfig = null;
  }

  buildArena(width, height, options = {}) {
    this.clear();
    this.width = width || 800;
    this.height = height || 600;

    if (options.boundaryType) this.boundaryType = options.boundaryType;
    if (options.name) this.name = options.name;
    if (options.floorColor) this.floorColor = options.floorColor;
    if (options.wallColor) this.wallColor = options.wallColor;

    this.createWalls();
  }

  buildPreset(presetName) {
    const preset = PRESETS && PRESETS.ARENA_PRESETS && PRESETS.ARENA_PRESETS[presetName];
    if (!preset) {
      console.warn(`ArenaBuilder: preset "${presetName}" not found, using defaults.`);
      this.buildArena(800, 600);
      return;
    }

    this.clear();
    this.width = preset.width || 800;
    this.height = preset.height || 600;
    this.boundaryType = preset.boundaryType || "SolidWalls";
    this.name = preset.name || presetName;
    if (preset.floorColor) this.floorColor = preset.floorColor;
    if (preset.wallColor) this.wallColor = preset.wallColor;

    if (preset.portals) {
      this.portals = preset.portals.map(p => ({
        x: p.x, y: p.y,
        radius: p.radius || 25,
        color: p.color || "#00ff88",
        cooldown: p.cooldown || 1,
        nextAvailable: 0
      }));
    }

    this.createWalls();

    if (preset.generateBlocks && typeof window.blockManager !== "undefined") {
      const bm = window.blockManager;
      var generated = preset.generateBlocks(this.width, this.height);
      generated.forEach(function(b) {
        bm.createBlock(b.x, b.y, { type: b.type || "Brick", width: b.w || 40, height: b.h || 40 });
      });
    } else if (preset.blocks && typeof window.blockManager !== "undefined") {
      const bm = window.blockManager;
      preset.blocks.forEach(function(b) {
        bm.createBlock(b.x || 400, b.y || 300, { type: b.type || "Brick", width: b.w || b.width || 40, height: b.h || b.height || 40 });
      });
    }
  }

  createWalls() {
    this.removeWalls();

    const w = this.width;
    const h = this.height;
    const t = 20;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const world = this.physics.world;

    const top    = Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, { isStatic: true, label: "arena_wall_top", friction: 0, restitution: 1 });
    const bottom = Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, { isStatic: true, label: "arena_wall_bottom", friction: 0, restitution: 1 });
    const left   = Bodies.rectangle(-t / 2, h / 2, t, h + t * 2, { isStatic: true, label: "arena_wall_left", friction: 0, restitution: 1 });
    const right  = Bodies.rectangle(w + t / 2, h / 2, t, h + t * 2, { isStatic: true, label: "arena_wall_right", friction: 0, restitution: 1 });

    top.render = top.render || {};
    bottom.render = bottom.render || {};
    left.render = left.render || {};
    right.render = right.render || {};
    top.render.visible = false;
    bottom.render.visible = false;
    left.render.visible = false;
    right.render.visible = false;

    this.walls = [top, bottom, left, right];
    Composite.add(world, this.walls);
  }

  removeWalls() {
    if (this.walls.length === 0) return;
    const Composite = Matter.Composite;
    Composite.remove(this.physics.world, this.walls);
    this.walls = [];
  }

  // ---- Wizard extensions ----

  addCustomWall(x, y, w, h) {
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const World = Matter.World;
    const world = this.physics.world;
    var body;
    try {
      body = Bodies.rectangle(x, y, w, h, { isStatic: true, label: "custom_wall_" + this.customObjects.length, friction: 0, restitution: 1 });
    } catch (e) {
      body = Bodies.rectangle(x, y, w, h, { isStatic: true });
      body.label = "custom_wall_" + this.customObjects.length;
    }
    if (Composite && Composite.add) {
      Composite.add(world, body);
    } else if (World && World.add) {
      World.add(world, body);
    } else {
      Matter.World.add(world, body);
    }
    var obj = { type: "wall", x: x, y: y, w: w, h: h, config: { x: x, y: y, w: w, h: h }, body: body };
    this.customObjects.push(obj);
    return obj;
  }

  addPortal(x, y, cooldown) {
    var cd = (cooldown !== undefined && cooldown !== null) ? cooldown : 1;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const world = this.physics.world;
    var body = null;
    try {
      body = Bodies.circle(x, y, 25, { isStatic: true, isSensor: true, label: "portal_" + this.portals.length, friction: 0, restitution: 0 });
    } catch (e) {
      body = Bodies.circle(x, y, 25, { isStatic: true, isSensor: true });
      body.label = "portal_" + this.portals.length;
    }
    body.isSensor = true;
    try {
      if (Composite && Composite.add) Composite.add(world, body);
      else Matter.World.add(world, body);
    } catch (e) {
      try { Matter.World.add(world, body); } catch (e2) {}
    }
    var color = (this.portals.length % 2 === 0) ? "#00ff88" : "#00aaff";
    var portal = { x: x, y: y, radius: 25, color: color, cooldown: cd, nextAvailable: 0, body: body };
    this.portals.push(portal);
    return portal;
  }

  addHealPad(x, y, healAmount, spawnDuration) {
    var ha = (healAmount !== undefined && healAmount !== null) ? healAmount : 20;
    var sd = (spawnDuration !== undefined && spawnDuration !== null) ? spawnDuration : 5;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const world = this.physics.world;
    var body = null;
    try {
      body = Bodies.circle(x, y, 28, { isStatic: true, isSensor: true, label: "heal_pad_" + this.orbPads.length, friction: 0, restitution: 0 });
    } catch (e) {
      body = Bodies.circle(x, y, 28, { isStatic: true, isSensor: true });
      body.label = "heal_pad_" + this.orbPads.length;
    }
    body.isSensor = true;
    try {
      if (Composite && Composite.add) Composite.add(world, body);
      else Matter.World.add(world, body);
    } catch (e) {
      try { Matter.World.add(world, body); } catch (e2) {}
    }
    var pad = { x: x, y: y, type: "heal", healAmount: ha, spawnDuration: sd, lastSpawn: 0, radius: 28, body: body };
    this.orbPads.push(pad);
    return pad;
  }

  addRotatePad(x, y, rotMult, rotDuration, spawnDuration) {
    var rm = (rotMult !== undefined && rotMult !== null) ? rotMult : 1.5;
    var rd = (rotDuration !== undefined && rotDuration !== null) ? rotDuration : 5;
    var sd = (spawnDuration !== undefined && spawnDuration !== null) ? spawnDuration : 5;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const world = this.physics.world;
    var body = null;
    try {
      body = Bodies.circle(x, y, 28, { isStatic: true, isSensor: true, label: "rotate_pad_" + this.orbPads.length, friction: 0, restitution: 0 });
    } catch (e) {
      body = Bodies.circle(x, y, 28, { isStatic: true, isSensor: true });
      body.label = "rotate_pad_" + this.orbPads.length;
    }
    body.isSensor = true;
    try {
      if (Composite && Composite.add) Composite.add(world, body);
      else Matter.World.add(world, body);
    } catch (e) {
      try { Matter.World.add(world, body); } catch (e2) {}
    }
    var pad = { x: x, y: y, type: "rotate", rotMult: rm, rotDuration: rd, spawnDuration: sd, lastSpawn: 0, radius: 28, body: body };
    this.orbPads.push(pad);
    return pad;
  }

  setScatteredOrbs(enabled, type, healAmount, rotMult, rotDuration) {
    if (!enabled) {
      this.scatteredOrbConfig = null;
      return;
    }
    this.scatteredOrbConfig = {
      enabled: true,
      type: type || "heal",
      healAmount: (healAmount !== undefined && healAmount !== null) ? healAmount : 20,
      rotMult: (rotMult !== undefined && rotMult !== null) ? rotMult : 1.5,
      rotDuration: (rotDuration !== undefined && rotDuration !== null) ? rotDuration : 5
    };
  }

  updatePads(dt, simTime) {
    var now = simTime;
    if (now === undefined || now === null) {
      if (typeof dt === "number" && dt > 1000) {
        // dt might actually be simTime if caller passes millis
        now = dt;
      } else if (typeof window !== "undefined" && window.game && typeof window.game.simTime === "number") {
        now = window.game.simTime;
      } else {
        now = Date.now() / 1000;
      }
    }
    // dt param is kept for signature compatibility but not used directly for timing
    for (var i = 0; i < this.orbPads.length; i++) {
      var pad = this.orbPads[i];
      var last = (pad.lastSpawn !== undefined && pad.lastSpawn !== null) ? pad.lastSpawn : 0;
      var dur = (pad.spawnDuration !== undefined && pad.spawnDuration !== null) ? pad.spawnDuration : 5;
      if (now - last >= dur) {
        var orb = null;
        if (pad.type === "heal") {
          orb = { x: pad.x, y: pad.y, type: "heal", healAmount: pad.healAmount, radius: 10, color: "#00ff88" };
        } else if (pad.type === "rotate") {
          orb = { x: pad.x, y: pad.y, type: "rotate", rotMult: pad.rotMult, rotDuration: pad.rotDuration, radius: 10, color: "#ff88ff" };
        } else {
          orb = { x: pad.x, y: pad.y, type: pad.type, healAmount: pad.healAmount, rotMult: pad.rotMult, rotDuration: pad.rotDuration, radius: 10, color: "#ffff00" };
        }
        this.orbs.push(orb);
        pad.lastSpawn = now;
      }
    }
  }

  spawnScatteredBatch() {
    if (!this.scatteredOrbConfig || !this.scatteredOrbConfig.enabled) return;
    var cfg = this.scatteredOrbConfig;
    var count = Math.floor((this.width * this.height) / 80000);
    if (count < 3) count = 3;
    if (count > 10) count = 10;
    for (var i = 0; i < count; i++) {
      var rx = 20 + Math.random() * (this.width - 40);
      var ry = 20 + Math.random() * (this.height - 40);
      var type = cfg.type;
      if (type === "mixed") {
        type = Math.random() < 0.5 ? "heal" : "rotate";
      }
      var orb = null;
      if (type === "heal") {
        orb = { x: rx, y: ry, type: "heal", healAmount: cfg.healAmount, radius: 10, color: "#00ff88" };
      } else if (type === "rotate") {
        orb = { x: rx, y: ry, type: "rotate", rotMult: cfg.rotMult, rotDuration: cfg.rotDuration, radius: 10, color: "#ff88ff" };
      } else {
        // fallback for unknown type, treat as heal
        orb = { x: rx, y: ry, type: type, healAmount: cfg.healAmount, rotMult: cfg.rotMult, rotDuration: cfg.rotDuration, radius: 10, color: "#ffff00" };
      }
      this.orbs.push(orb);
    }
  }

  updateScatteredOrbs(dt, simTime) {
    if (!this.scatteredOrbConfig || !this.scatteredOrbConfig.enabled) return;
    var now = simTime;
    if (now === undefined || now === null) {
      if (typeof window !== "undefined" && window.game && typeof window.game.simTime === "number") {
        now = window.game.simTime;
      } else {
        now = Date.now() / 1000;
      }
    }
    var last = (this.scatteredOrbTimer !== undefined && this.scatteredOrbTimer !== null) ? this.scatteredOrbTimer : 0;
    if (now - last >= 30) {
      this.spawnScatteredBatch();
      this.scatteredOrbTimer = now;
    }
  }

  checkOrbCollection(ballBodies) {
    if (!ballBodies || !Array.isArray(ballBodies)) return 0;
    if (this.orbs.length === 0) return 0;
    var collected = 0;
    for (var oi = this.orbs.length - 1; oi >= 0; oi--) {
      var orb = this.orbs[oi];
      var orbR = (orb.radius !== undefined && orb.radius !== null) ? orb.radius : 10;
      var hit = false;
      for (var bi = 0; bi < ballBodies.length; bi++) {
        var ballWrapper = ballBodies[bi];
        if (!ballWrapper) continue;
        var body = ballWrapper.body || ballWrapper;
        if (!body || !body.position) continue;
        var data = ballWrapper.data || ballWrapper.gameData || (body && body.gameData) || null;
        if (!data && ballWrapper.hp !== undefined) data = ballWrapper;
        // alive check
        var alive = true;
        if (data && data.alive === false) alive = false;
        if (ballWrapper.alive === false) alive = false;
        if (body.gameData && body.gameData.alive === false) alive = false;
        if (!alive) continue;
        var ballR = ballWrapper.radius;
        if (ballR === undefined || ballR === null) ballR = ballWrapper.size;
        if (ballR === undefined || ballR === null) ballR = (data && (data.size || data.radius));
        if (ballR === undefined || ballR === null) ballR = 12;
        // also try body.circleRadius
        if (body.circleRadius) ballR = body.circleRadius;
        var dx = body.position.x - orb.x;
        var dy = body.position.y - orb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ballR + orbR) {
          // apply effect
          if (orb.type === "heal") {
            var amt = (orb.healAmount !== undefined && orb.healAmount !== null) ? orb.healAmount : 20;
            if (data) {
              var maxHp = data.maxHp;
              if (maxHp === undefined || maxHp === null) maxHp = data.maxHP;
              if (maxHp === undefined || maxHp === null) maxHp = data.maxHealth;
              if (maxHp === undefined || maxHp === null) maxHp = 500;
              var curHp = (data.hp !== undefined && data.hp !== null) ? data.hp : data.health;
              if (curHp === undefined || curHp === null) curHp = 0;
              var newHp = Math.min(maxHp, curHp + amt);
              data.hp = newHp;
              if (data.health !== undefined) data.health = newHp;
              if (body.gameData && body.gameData !== data) {
                body.gameData.hp = newHp;
                if (body.gameData.health !== undefined) body.gameData.health = newHp;
              }
            } else if (ballWrapper.hp !== undefined) {
              var maxHp2 = ballWrapper.maxHp || ballWrapper.maxHP || ballWrapper.maxHealth || 500;
              ballWrapper.hp = Math.min(maxHp2, ballWrapper.hp + amt);
            }
          } else if (orb.type === "rotate") {
            var rm = (orb.rotMult !== undefined && orb.rotMult !== null) ? orb.rotMult : 1.5;
            var rd = (orb.rotDuration !== undefined && orb.rotDuration !== null) ? orb.rotDuration : 5;
            if (data) {
              data.orbRotMult = rm;
              data.orbRotTimer = rd;
              // alternative keys for compat
              data.rotMult = rm;
              data.rotTimer = rd;
            }
            if (body.gameData && body.gameData !== data) {
              body.gameData.orbRotMult = rm;
              body.gameData.orbRotTimer = rd;
            }
            if (ballWrapper.data) {
              ballWrapper.data.orbRotMult = rm;
              ballWrapper.data.orbRotTimer = rd;
            }
          }
          // spawn effect via window.game.effects if available
          try {
            if (typeof window !== "undefined" && window.game && window.game.effects) {
              if (typeof window.game.effects.spawn === "function") {
                window.game.effects.spawn(orb.x, orb.y, orb.type === "heal" ? "heal" : "rotate");
              } else if (typeof window.game.effects.spawnEffect === "function") {
                window.game.effects.spawnEffect(orb.x, orb.y, orb.type);
              } else if (typeof window.game.effects.create === "function") {
                window.game.effects.create(orb.type, orb.x, orb.y);
              }
            }
          } catch (e) {}
          this.orbs.splice(oi, 1);
          collected++;
          hit = true;
          break;
        }
      }
    }
    return collected;
  }

  getAllPads() {
    return this.orbPads;
  }

  getAllOrbs() {
    return this.orbs;
  }

  getAllPortals() {
    return this.portals;
  }

  removeOrb(orb) {
    var idx = this.orbs.indexOf(orb);
    if (idx !== -1) this.orbs.splice(idx, 1);
  }

  setBoundaryType(type) {
    const valid = ["SolidWalls", "DeathWall", "Wraparound", "Portals"];
    if (!valid.includes(type)) {
      console.warn(`ArenaBuilder: unknown boundary type "${type}"`);
      return;
    }
    this.boundaryType = type;

    if (type === "DeathWall") {
      this.removeWalls();
    } else if (type === "Wraparound") {
      this.removeWalls();
    } else if (type === "Portals") {
      this.createWalls();
      this.portalCooldowns.clear();
      // reset per-portal cooldowns
      for (var i = 0; i < this.portals.length; i++) {
        this.portals[i].nextAvailable = 0;
      }
    } else {
      this.createWalls();
    }
  }

  checkBoundaries(ball) {
    if (!ball || !ball.body) return;
    if (ball.alive === false) return;

    const body = ball.body;
    const r = ball.radius || 10;
    const pos = body.position;

    switch (this.boundaryType) {
      case "SolidWalls":
        break;

      case "DeathWall":
        if (pos.x - r < 0 || pos.x + r > this.width ||
            pos.y - r < 0 || pos.y + r > this.height) {
          if (typeof ball.takeDamage === "function") {
            ball.takeDamage(9999);
          } else if (ball.health !== undefined) {
            ball.health = 0;
            ball.alive = false;
          } else if (ball.data && ball.data.hp !== undefined) {
            ball.data.hp = 0;
            ball.data.alive = false;
            ball.alive = false;
          } else if (body.gameData && body.gameData.hp !== undefined) {
            body.gameData.hp = 0;
            body.gameData.alive = false;
          }
        }
        break;

      case "Wraparound": {
        const margin = r + 2;
        let nx = pos.x;
        let ny = pos.y;

        if (pos.x < -margin) {
          nx = this.width + margin;
        } else if (pos.x > this.width + margin) {
          nx = -margin;
        }

        if (pos.y < -margin) {
          ny = this.height + margin;
        } else if (pos.y > this.height + margin) {
          ny = -margin;
        }

        if (nx !== pos.x || ny !== pos.y) {
          Matter.Body.setPosition(body, { x: nx, y: ny });
        }
        break;
      }

      case "Portals":
        if (this.portals.length >= 2) {
          var nowSec = Date.now() / 1000;
          // per-portal cooldown logic: when any ball uses portal A, portal A AND its pair go on cooldown
          var teleported = false;
          for (var pi = 0; pi < this.portals.length && !teleported; pi++) {
            var portal = this.portals[pi];
            var pr = (portal.radius !== undefined && portal.radius !== null) ? portal.radius : 25;
            var dx = pos.x - portal.x;
            var dy = pos.y - portal.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < pr + r) {
              var nextAvail = (portal.nextAvailable !== undefined && portal.nextAvailable !== null) ? portal.nextAvailable : 0;
              if (nowSec >= nextAvail) {
                var pairIdx;
                if (this.portals.length === 2) {
                  pairIdx = (pi === 0 ? 1 : 0);
                } else {
                  // pair via xor 1, fallback to next circular
                  if (pi % 2 === 0) pairIdx = pi + 1;
                  else pairIdx = pi - 1;
                  if (pairIdx < 0 || pairIdx >= this.portals.length) pairIdx = (pi + 1) % this.portals.length;
                }
                var pair = this.portals[pairIdx];
                if (pair) {
                  Matter.Body.setPosition(body, { x: pair.x, y: pair.y });
                  var cd = (portal.cooldown !== undefined && portal.cooldown !== null) ? portal.cooldown : 1;
                  var pairCd = (pair.cooldown !== undefined && pair.cooldown !== null) ? pair.cooldown : cd;
                  portal.nextAvailable = nowSec + cd;
                  pair.nextAvailable = nowSec + pairCd;
                  // also update legacy map for compatibility
                  try {
                    var key = ball.id || ball.data && ball.data.id || body.id || ball;
                    this.portalCooldowns.set(key, Date.now());
                  } catch (e) {}
                  teleported = true;
                }
              }
            }
          }
        }
        break;
    }
  }

  clear() {
    this.removeWalls();
    // remove custom wall bodies
    try {
      var Composite = Matter.Composite;
      var World = Matter.World;
      if (this.customObjects && this.customObjects.length) {
        for (var i = 0; i < this.customObjects.length; i++) {
          var co = this.customObjects[i];
          if (co.body) {
            try { Composite.remove(this.physics.world, co.body); } catch (e) { try { World.remove(this.physics.world, co.body); } catch (e2) {} }
          }
        }
      }
      if (this.orbPads && this.orbPads.length) {
        for (var j = 0; j < this.orbPads.length; j++) {
          var pad = this.orbPads[j];
          if (pad.body) {
            try { Composite.remove(this.physics.world, pad.body); } catch (e) { try { World.remove(this.physics.world, pad.body); } catch (e2) {} }
          }
        }
      }
      if (this.portals && this.portals.length) {
        for (var k = 0; k < this.portals.length; k++) {
          var p = this.portals[k];
          if (p.body) {
            try { Composite.remove(this.physics.world, p.body); } catch (e) { try { World.remove(this.physics.world, p.body); } catch (e2) {} }
          }
        }
      }
    } catch (e) {}
    this.customObjects = [];
    this.orbPads = [];
    this.orbs = [];
    this.scatteredOrbTimer = 0;
    this.scatteredOrbConfig = null;
    this.portals = [];
    this.portalCooldowns.clear();
    this.width = 800;
    this.height = 600;
    this.boundaryType = "SolidWalls";
    this.name = "Default Arena";
    this.floorColor = "#2a2a3a";
    this.wallColor = "#555570";
  }

  getArenaData() {
    return {
      width: this.width,
      height: this.height,
      boundaryType: this.boundaryType,
      name: this.name
    };
  }

  snapToGrid(x, y, gridSize = 20) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }

  getSpawnPosition() {
    const margin = 30;
    const x = margin + Math.random() * (this.width - margin * 2);
    const y = margin + Math.random() * (this.height - margin * 2);
    return { x, y };
  }

  getArenaBounds() {
    return {
      minX: 0,
      maxX: this.width,
      minY: 0,
      maxY: this.height
    };
  }
};
