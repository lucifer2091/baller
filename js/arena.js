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
    this.portals = [
      { x: 50, y: 300, radius: 25, color: "#00ff88" },
      { x: 750, y: 300, radius: 25, color: "#00aaff" }
    ];
    this.portalCooldowns = new Map();
    this.portalCooldownMs = 500;
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
        color: p.color || "#00ff88"
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
          const now = Date.now();
          const p0 = this.portals[0];
          const p1 = this.portals[1];

          const dx0 = pos.x - p0.x;
          const dy0 = pos.y - p0.y;
          const dist0 = Math.sqrt(dx0 * dx0 + dy0 * dy0);

          const dx1 = pos.x - p1.x;
          const dy1 = pos.y - p1.y;
          const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

          const cooldownKey = ball.id || ball;

          if (dist0 < p0.radius + r) {
            const lastUsed = this.portalCooldowns.get(cooldownKey) || 0;
            if (now - lastUsed > this.portalCooldownMs) {
              Matter.Body.setPosition(body, { x: p1.x, y: p1.y });
              this.portalCooldowns.set(cooldownKey, now);
            }
          } else if (dist1 < p1.radius + r) {
            const lastUsed = this.portalCooldowns.get(cooldownKey) || 0;
            if (now - lastUsed > this.portalCooldownMs) {
              Matter.Body.setPosition(body, { x: p0.x, y: p0.y });
              this.portalCooldowns.set(cooldownKey, now);
            }
          }
        }
        break;
    }
  }

  clear() {
    this.removeWalls();
    this.portals = [
      { x: 50, y: 300, radius: 25, color: "#00ff88" },
      { x: 750, y: 300, radius: 25, color: "#00aaff" }
    ];
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
