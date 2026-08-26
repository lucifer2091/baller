window.Game = class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.physics = new PhysicsEngine();
    this.camera = new GameCamera(this.canvas);
    this.renderer = new GameRenderer(this.canvas, this.camera);
    this.ballManager = new BallManager(this.physics);
    this.blockManager = new BlockManager(this.physics);
    this.arena = new ArenaBuilder(this.physics);
    this.specialObjects = new SpecialObjectManager(this.physics);
    this.effects = new EffectsManager();
    this.saves = new SaveManager();
    this.ui = new UIManager(this);

    this.state = "Stopped";
    this.timeScale = 1;
    this.isBuildMode = true;
    this.winCondition = "LastBallStanding";
    this.roundTimer = 0;
    this.elapsedTime = 0;
    this.battleLog = [];
    this.fps = 0;
    this.simTime = 0;

    this._savedPositions = null;
    this._lastFrameTime = 0;
    this._frameCount = 0;
    this._fpsTimer = 0;
    this._animFrameId = null;

    // Wizard / match state
    this.matchModifiers = null;
    this.countdownValue = 0;
    this.countdownTimer = 0;
    this._customDragging = null;

    this.setupInput();
    this.ui.init();
    this.arena.buildArena(800, 600);
    this.camera.goTo(400, 300, 0.9);
    this.ui.showMainMenu();

    window.ballManager = this.ballManager;
    window.blockManager = this.blockManager;

    // Wire up effect spawning on damage/death
    var origDamageBall = this.ballManager.damageBall.bind(this.ballManager);
    var self = this;
    this.ballManager.damageBall = function(ball, amount, source) {
      var hpBefore = ball.data.hp;
      origDamageBall(ball, amount, source);
      var dmg = hpBefore - ball.data.hp;
      if (dmg > 0 && ball.body) {
        self.effects.spawnDamageNumber(ball.body.position.x, ball.body.position.y, dmg, dmg > amount);
        self.effects.spawnHitEffect(ball.body.position.x, ball.body.position.y, ball.data.color || "#ff4444");
        if (!ball.data.alive) {
          self.effects.spawnDeathEffect(ball.body.position.x, ball.body.position.y, ball.data.color || "#ff4444", ball.data.size || 20);
          var attacker = source ? (source.data ? source.data.name : "unknown") : "unknown";
          self.log(ball.data.name + " eliminated by " + attacker, "#ff6666");
        }
      }
    };

    this.startGameLoop();
  }

  startGameLoop() {
    var self = this;
    this._lastFrameTime = performance.now();

    function loop(now) {
      var rawDt = (now - self._lastFrameTime) / 1000;
      self._lastFrameTime = now;
      var dt = Math.min(rawDt, 0.05);

      self._frameCount++;
      self._fpsTimer += rawDt;
      if (self._fpsTimer >= 1) {
        self.fps = self._frameCount;
        self._frameCount = 0;
        self._fpsTimer = 0;
      }

      self.update(dt);
      self.render();
      self._animFrameId = requestAnimationFrame(loop);
    }
    this._animFrameId = requestAnimationFrame(loop);
  }

  // ─────────────────── UPDATE ───────────────────
  update(dt) {
    this.camera.update(dt);

    if (this.ui && typeof this.ui.updateHUD === "function") {
      this.ui.updateHUD(this.state, this.camera);
    }

    if (this.state === "Countdown") {
      this.countdownTimer -= dt;
      var overlay = document.getElementById("countdownOverlay");
      var numEl = document.getElementById("countdownNumber");
      var labelEl = document.getElementById("countdownLabel");
      if (this.countdownTimer <= 0) {
        // Advance countdown
        this.countdownValue--;
        if (this.countdownValue > 0) {
          this.countdownTimer = 1.0;
          if (numEl) { numEl.textContent = this.countdownValue; numEl.style.animation = "none"; void numEl.offsetHeight; numEl.style.animation = "popIn 0.4s ease"; }
          if (labelEl) labelEl.textContent = "Get Ready";
          this.effects.spawnCountdownEffect(this.arena.width/2, this.arena.height/2, this.countdownValue);
        } else if (this.countdownValue === 0) {
          this.countdownTimer = 0.6;
          if (numEl) { numEl.textContent = "GO!"; numEl.style.animation = "none"; void numEl.offsetHeight; numEl.style.animation = "popIn 0.4s ease"; }
          if (labelEl) labelEl.textContent = "FIGHT!";
        } else {
          // Done
          if (overlay) overlay.classList.add("hidden");
          // Unfreeze balls
          var allBalls = this.ballManager.getAllBalls();
          for (var i=0;i<allBalls.length;i++) {
            if (allBalls[i].body) {
              Matter.Body.setStatic(allBalls[i].body, false);
            }
          }
          this.state = "Running";
          this.simTime = 0;
          this.ui.showPanel("simControls");
          this.ui.showPanel("battleLog");
          this.ui.showPanel("hud");
          this.ui.updateSimControls("Playing");
          this.log("FIGHT!", "#ff4444");
        }
      }
      this.effects.update(dt);
      return;
    }

    if (this.state === "Running") {
      var scaledDt = dt * this.timeScale;

      // Snapshot HP before physics step to detect collision damage
      var allBallsBefore = this.ballManager.getAllBalls();
      for (var bi = 0; bi < allBallsBefore.length; bi++) {
        if (allBallsBefore[bi].data) allBallsBefore[bi].data._prevHp = allBallsBefore[bi].data.hp;
      }

      this.physics.step(scaledDt * 16.666);
      this.simTime += scaledDt;
      this.roundTimer += scaledDt;

      this.ballManager.updateAI(scaledDt);
      this.ballManager.updateWeapons(scaledDt);
      this.ballManager.checkWeaponCollisions();
      this.ballManager.updateOrbTimers(scaledDt);
      this.blockManager.checkBallBlockCollisions();
      this.blockManager.update(scaledDt);
      this.specialObjects.update(scaledDt);
      this.physics.updateSpecialObjects(scaledDt);

      // Arena pads & scattered orbs
      if (this.arena.updatePads) this.arena.updatePads(scaledDt, this.simTime);
      if (this.arena.updateScatteredOrbs) this.arena.updateScatteredOrbs(scaledDt, this.simTime);
      if (this.arena.checkOrbCollection) {
        var collected = this.arena.checkOrbCollection(this.ballManager.getAllBalls());
        // checkOrbCollection already handles heal/rotate and effects
      }

      if (this.arena.boundaryType === "Wraparound") {
        this.physics.handleWraparound(this.arena.width, this.arena.height);
      } else if (this.arena.boundaryType === "DeathWall") {
        var aliveBalls = this.ballManager.getAliveBalls();
        for (var i = 0; i < aliveBalls.length; i++) {
          var ab = aliveBalls[i];
          this.arena.checkBoundaries({ body: ab.body, radius: ab.data.size, alive: ab.data.alive, health: ab.data.hp, takeDamage: (function(b) { return function(d) { b.data.hp -= d; if (b.data.hp <= 0) { b.data.hp = 0; b.data.alive = false; } }; })(ab) });
        }
      }

      // Detect physics collision damage not caught by damageBall wrapper
      var allBallsAfter = this.ballManager.getAllBalls();
      for (var ai = 0; ai < allBallsAfter.length; ai++) {
        var b2 = allBallsAfter[ai];
        if (!b2.data || !b2.body) continue;
        var prevHp = b2.data._prevHp;
        if (prevHp !== undefined && b2.data.hp < prevHp) {
          var lost = prevHp - b2.data.hp;
          this.effects.spawnDamageNumber(b2.body.position.x, b2.body.position.y, lost, false);
          if (b2.data.hp <= 0 && b2.data.alive !== false) {
            b2.data.alive = false;
            this.effects.spawnDeathEffect(b2.body.position.x, b2.body.position.y, b2.data.color || "#ff4444", b2.data.size || 20);
          } else if (lost > 5) {
            this.effects.spawnHitEffect(b2.body.position.x, b2.body.position.y, b2.data.color || "#ff4444");
          }
        }
        if (b2.data.hp <= 0) b2.data.alive = false;
      }

      // Detect block breakage
      var prevBlockCount = this._prevBlockCount || this.blockManager.getAllBlocks().length;
      var curBlockCount = this.blockManager.getAllBlocks().length;
      if (curBlockCount < prevBlockCount) {
        this.effects.spawnBlockBreakEffect(this.arena.width / 2, this.arena.height / 2, "#aa8844");
      }
      this._prevBlockCount = curBlockCount;

      this.effects.update(scaledDt);
      this.checkWinCondition();
    } else if (this.state === "Paused") {
      this.effects.update(dt);
    }
  }

  // ─────────────────── RENDER ───────────────────
  render() {
    var arenaData = this.arena.getArenaData();
    arenaData.wallColor = this.arena.wallColor;

    var specialsArr = [];
    var specialObjs = this.specialObjects.getAllObjects();
    for (var i = 0; i < specialObjs.length; i++) {
      var sp = specialObjs[i];
      specialsArr.push({ body: sp.body, data: { radius: sp.data.radius, color: sp.data.color, specialType: sp.type } });
    }

    var blocksArr = [];
    var blocks = this.blockManager.getAllBlocks();
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var bw = b.body.bounds ? (b.body.bounds.max.x - b.body.bounds.min.x) : (b.data.size || 40);
      var bh = b.body.bounds ? (b.body.bounds.max.y - b.body.bounds.min.y) : (b.data.size || 40);
      blocksArr.push({ body: b.body, data: { hp: b.data.hp, maxHp: b.data.maxHp, color: b.data.color, width: bw, height: bh } });
    }

    var ballsArr = [];
    var allBalls = this.ballManager.getAllBalls();
    var teams = this.ballManager.teams;
    for (var i = 0; i < allBalls.length; i++) {
      var ball = allBalls[i];
      if (!ball.data.alive) continue;
      var teamInfo = teams[ball.data.team];
      var teamColor = (teamInfo && teamInfo.color) ? teamInfo.color : ball.data.color;
      ballsArr.push({
        body: ball.body,
        data: {
          hp: ball.data.hp,
          maxHp: ball.data.maxHp,
          name: ball.data.name,
          team: ball.data.team,
          color: teamColor,
          teamColor: teamColor,
          radius: ball.data.size
        }
      });
    }

    var weaponsArr = [];
    var projectilesArr = [];
    for (var i = 0; i < allBalls.length; i++) {
      var ball = allBalls[i];
      if (!ball.data.alive || !ball._weapons) continue;
      for (var w = 0; w < ball._weapons.length; w++) {
        var weapon = ball._weapons[w];
        var weaponPreset = (window.PRESETS && window.PRESETS.WEAPON_TYPES && window.PRESETS.WEAPON_TYPES[weapon.type]) || {};
        var wx = ball.body.position.x + Math.cos(weapon.data.angle) * weapon.data.orbitRadius;
        var wy = ball.body.position.y + Math.sin(weapon.data.angle) * weapon.data.orbitRadius;
        weaponsArr.push({
          body: { position: { x: wx, y: wy }, angle: weapon.data.angle },
          data: {
            type: weapon.type,
            weaponType: weapon.type,
            color: weaponPreset.color || '#c0c0c0',
            length: weaponPreset.range || 30,
            width: 8,
            radius: (weaponPreset.size || 15) / 2
          }
        });
        if (weapon.data.projectiles) {
          for (var p = 0; p < weapon.data.projectiles.length; p++) {
            var proj = weapon.data.projectiles[p];
            projectilesArr.push({
              body: { position: { x: proj.x, y: proj.y }, velocity: { x: proj.vx, y: proj.vy } },
              data: { radius: 5, color: weaponPreset.color || '#ff6b35' }
            });
          }
        }
      }
    }

    // Collect pads, orbs, portals, walls for renderer
    var padsArr = [];
    if (this.arena.orbPads) {
      for (var pi=0; pi<this.arena.orbPads.length; pi++) {
        var pad = this.arena.orbPads[pi];
        padsArr.push({ x: pad.x, y: pad.y, type: pad.type, healAmount: pad.healAmount, rotMult: pad.rotMult, rotDuration: pad.rotDuration, radius: pad.radius, color: pad.color });
      }
    }
    var orbsArr = [];
    if (this.arena.orbs) {
      for (var oi=0; oi<this.arena.orbs.length; oi++) {
        var orb = this.arena.orbs[oi];
        orbsArr.push({ x: orb.x, y: orb.y, type: orb.type, healAmount: orb.healAmount, rotMult: orb.rotMult, rotDuration: orb.rotDuration, radius: orb.radius, color: orb.color });
      }
    }
    var portalsArr = [];
    if (this.arena.portals) {
      for (var po=0; po<this.arena.portals.length; po++) {
        var portal = this.arena.portals[po];
        var isOnCd = false, cdRem = 0;
        if (portal.nextAvailable) {
          var now = Date.now()/1000;
          if (now < portal.nextAvailable) { isOnCd = true; cdRem = portal.nextAvailable - now; }
        }
        portalsArr.push({ x: portal.x, y: portal.y, radius: portal.radius, color: portal.color, isOnCooldown: isOnCd, cooldownRemaining: cdRem });
      }
    }
    var wallsArr = [];
    if (this.arena.customObjects) {
      for (var wi=0; wi<this.arena.customObjects.length; wi++) {
        var co = this.arena.customObjects[wi];
        if (co.type === "wall" && co.body) {
          wallsArr.push({ body: co.body, data: { width: co.w, height: co.h, color: "#555570" } });
        }
      }
    }

    this.renderer.render({
      arena: arenaData,
      specials: specialsArr,
      blocks: blocksArr,
      balls: ballsArr,
      weapons: weaponsArr,
      projectiles: projectilesArr,
      pads: padsArr,
      orbs: orbsArr,
      portals: portalsArr,
      walls: wallsArr
    });

    this._renderEffectsOverlay();
    this._renderFragments();
  }

  _renderEffectsOverlay() {
    var effs = this.effects.getEffects();
    var ctx = this.renderer.ctx;
    var cam = this.camera;
    for (var ei = 0; ei < effs.length; ei++) {
      var e = effs[ei];
      var s = cam.worldToScreen(e.x, e.y);
      var alpha = e.alpha !== undefined ? e.alpha : Math.max(0, e.life / e.maxLife);

      if (e.type === "damageNumber") {
        var fs = Math.max(10, Math.round(e.size * cam.zoom));
        ctx.font = "bold " + fs + "px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(0,0,0," + (alpha * 0.6) + ")";
        ctx.fillText(e.text, s.x + 1, s.y + 1);
        if (e.color.indexOf('rgba') === -1 && e.color.indexOf('rgb') === -1) {
          var hex = e.color.replace('#','');
          if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
          var num = parseInt(hex, 16);
          var r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
          ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
        } else {
          ctx.fillStyle = e.color.replace(')', ',' + alpha + ')').replace('rgb', 'rgba');
        }
        ctx.fillText(e.text, s.x, s.y);
      } else if (e.type === "healNumber") {
        var hfs = Math.max(10, Math.round(e.size * cam.zoom));
        ctx.font = "bold " + hfs + "px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(68,255,68," + alpha + ")";
        ctx.fillText(e.text, s.x, s.y);
      } else if (e.type === "ring") {
        var rr = e.size * cam.zoom;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rr, 0, Math.PI * 2);
        ctx.strokeStyle = this.renderer._withAlpha ? this.renderer._withAlpha(e.color, alpha * 0.8) : "rgba(255,80,80," + alpha + ")";
        ctx.lineWidth = Math.max(2, 3 * cam.zoom);
        ctx.stroke();
      } else if (e.type === "flash") {
        var fr = e.size * cam.zoom;
        ctx.beginPath();
        ctx.arc(s.x, s.y, fr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,200," + (alpha * 0.5) + ")";
        ctx.fill();
      } else if (e.type === "countdown") {
        var cfs = Math.max(20, Math.round(48 * cam.zoom));
        ctx.font = "bold " + cfs + "px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
        ctx.fillText(e.text, s.x, s.y);
      } else if (e.type === "particle" || e.type === "fragment") {
        var pr = e.size * cam.zoom;
        ctx.save();
        ctx.translate(s.x, s.y);
        if (e.rotation) ctx.rotate(e.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = e.color;
        if (e.type === "fragment") {
          ctx.fillRect(-pr/2, -pr/2, pr, pr);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, pr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  _renderFragments() {
    var frags = this.blockManager.fragments || [];
    var ctx = this.renderer.ctx;
    var cam = this.camera;
    for (var fi = 0; fi < frags.length; fi++) {
      var f = frags[fi];
      var s = cam.worldToScreen(f.x, f.y);
      var fa = Math.max(0, f.life / f.maxLife);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(f.rotation || 0);
      ctx.globalAlpha = fa;
      ctx.fillStyle = f.color || "#888888";
      var sz = (f.size || 4) * cam.zoom;
      ctx.fillRect(-sz/2, -sz/2, sz, sz);
      ctx.restore();
    }
  }

  enterBuildMode() {
    this.isBuildMode = true;
  }

  enterSimMode() {
    this.isBuildMode = false;
  }

  // ─────────────────── WIZARD BATTLE ───────────────────
  startWizardBattle(fighters, mapData, modifiers) {
    this.clearAll();
    this.matchModifiers = modifiers;

    // Arena
    var arenaW = 1200, arenaH = 800;
    if (mapData.isCustom) {
      // Custom arena already has objects; just ensure size
      arenaW = this.arena.width;
      arenaH = this.arena.height;
    } else {
      var preset = window.PRESETS.ARENA_PRESETS[mapData.preset];
      if (preset) {
        arenaW = preset.width || 1200;
        arenaH = preset.height || 800;
        this.arena.buildArena(arenaW, arenaH);
        if (preset.generateBlocks) {
          var genBlocks = preset.generateBlocks(arenaW, arenaH);
          for (var bi=0; bi<genBlocks.length; bi++) {
            var gb = genBlocks[bi];
            this.blockManager.createBlock(gb.x, gb.y, { type: gb.type || "Brick", width: gb.w || 40, height: gb.h || 40 });
          }
        }
      } else {
        this.arena.buildArena(arenaW, arenaH);
      }
    }

    // Gravity from modifiers
    var grav = 1;
    if (modifiers && modifiers.base && modifiers.base.gravity !== undefined) grav = modifiers.base.gravity;
    this.physics.setGravity(grav);

    // Scattered orbs config
    if (modifiers && modifiers.base && modifiers.base.scatteredOrbs && modifiers.base.scatteredOrbs.enabled) {
      var sc = modifiers.base.scatteredOrbs;
      this.arena.setScatteredOrbs(true, sc.type, sc.healAmount, sc.rotMult, sc.rotDuration);
    }

    // Spawn fighters on circle with separation
    var cx = arenaW / 2, cy = arenaH / 2;
    var radius = Math.min(arenaW, arenaH) / 3;
    radius = Math.min(radius, 280);
    for (var i=0; i<fighters.length; i++) {
      var f = fighters[i];
      var angle = (i / fighters.length) * Math.PI * 2 - Math.PI/2;
      var x = cx + Math.cos(angle) * radius;
      var y = cy + Math.sin(angle) * radius;
      var teamInfo = window.PRESETS.TEAMS[f.team] || window.PRESETS.TEAMS.Red;
      if (!this.ballManager.teams[f.team]) {
        this.ballManager.createTeam(f.team, teamInfo.color);
      }
      var ballConfig = {
        name: f.name,
        hp: f.hp, maxHp: f.hp,
        damage: f.damage,
        speed: f.speed,
        size: f.size,
        mass: f.mass,
        team: f.team,
        ai: f.ai,
        weaponType: f.weaponType === "None" ? null : f.weaponType,
        color: teamInfo.color
      };
      var ball = this.ballManager.createBall(x, y, ballConfig);
      // Freeze for countdown
      if (ball && ball.body) Matter.Body.setStatic(ball.body, true);
    }

    // Apply ball modifiers (damage2x, lifesteal, speed2x, rotSpeed, randomSize)
    if (modifiers && modifiers.ball) {
      // Need to apply before unfreezing, but after creation
      // For randomSize we need to handle static bodies specially - temporarily unfreeze, resize, refreeze
      var needUnfreeze = modifiers.ball.randomSize;
      if (needUnfreeze) {
        var allB = this.ballManager.getAllBalls();
        for (var ui=0; ui<allB.length; ui++) if(allB[ui].body) Matter.Body.setStatic(allB[ui].body, false);
      }
      this.ballManager.applyMatchModifiers(modifiers);
      if (needUnfreeze) {
        var allB2 = this.ballManager.getAllBalls();
        for (var vi=0; vi<allB2.length; vi++) {
          if(allB2[vi].body) {
            // Re-freeze at new positions (keep same position)
            Matter.Body.setVelocity(allB2[vi].body, {x:0,y:0});
            Matter.Body.setStatic(allB2[vi].body, true);
            if (modifiers.ball.randomSize) {
              var fromSz = allB2[vi].data.baseSize || 25;
              var toSz = allB2[vi].data.size;
              this.effects.spawnSizeChangeEffect(allB2[vi].body.position.x, allB2[vi].body.position.y, fromSz, toSz, allB2[vi].data.color);
            }
          }
        }
      } else {
        // For non-size mods, just update frozen bodies' data already done
      }
    }

    this.winCondition = "LastTeamStanding";
    if (fighters.length === 2 || this.ballManager.teams && Object.keys(this.ballManager.teams).length <= 2) {
      // Use team standing for wizard battles
      this.winCondition = "LastTeamStanding";
    }

    this.isBuildMode = false;
    this.simTime = 0;
    this.roundTimer = 0;
    this._prevBlockCount = this.blockManager.getAllBlocks().length;

    // Center camera
    this.camera.goTo(cx, cy, 0.85);

    // Start countdown
    this.state = "Countdown";
    this.countdownValue = 3;
    this.countdownTimer = 1.0;
    var overlay = document.getElementById("countdownOverlay");
    var numEl = document.getElementById("countdownNumber");
    var labelEl = document.getElementById("countdownLabel");
    if (overlay) overlay.classList.remove("hidden");
    if (numEl) { numEl.textContent = "3"; numEl.style.animation = "none"; void numEl.offsetHeight; numEl.style.animation = "popIn 0.4s ease"; }
    if (labelEl) labelEl.textContent = "Get Ready";

    this.log("Match starting: " + fighters.length + " fighters", "#ffcc44");
  }

  startSimulation() {
    if (this.state === "Running") return;
    this.storeOriginalPositions();
    this.state = "Running";
    this.simTime = 0;
    this.ui.showPanel("simControls");
    this.ui.showPanel("battleLog");
    this.ui.showPanel("hud");
    this.ui.updateSimControls("Playing");
    this.log("Simulation started", "#44ff44");
  }

  pauseSimulation() {
    if (this.state !== "Running") return;
    this.state = "Paused";
    this.ui.updateSimControls("Paused");
    this.log("Simulation paused", "#ffcc44");
  }

  resumeSimulation() {
    if (this.state !== "Paused") return;
    this.state = "Running";
    this.ui.updateSimControls("Playing");
    this.log("Simulation resumed", "#44ff44");
  }

  stopSimulation() {
    if (this.state === "Stopped" || this.state === "Countdown") return;
    this.state = "Stopped";
    // Unfreeze if was counting down
    var allB = this.ballManager.getAllBalls();
    for (var i=0;i<allB.length;i++) if(allB[i].body) Matter.Body.setStatic(allB[i].body, false);
    var overlay = document.getElementById("countdownOverlay");
    if (overlay) overlay.classList.add("hidden");
    this.ui.updateSimControls("Stopped");
    this.log("Simulation stopped", "#ff6666");
  }

  resetSimulation() {
    this.state = "Stopped";
    this.simTime = 0;
    this.roundTimer = 0;
    var allB = this.ballManager.getAllBalls();
    for (var i=0;i<allB.length;i++) if(allB[i].body) Matter.Body.setStatic(allB[i].body, false);
    var overlay = document.getElementById("countdownOverlay");
    if (overlay) overlay.classList.add("hidden");
    this.effects.clear();
    this.restoreOriginalPositions();
    this.ui.updateSimControls("Stopped");
    this.log("Simulation reset", "#88aaff");
  }

  stepSimulation() {
    if (this.state !== "Paused") {
      if (this.state === "Running") {
        this.pauseSimulation();
      } else {
        this.storeOriginalPositions();
        this.state = "Paused";
      }
    }
    var scaledDt = this.timeScale;
    this.physics.step(scaledDt * 16.666);
    this.simTime += scaledDt;
    this.ballManager.updateAI(scaledDt);
    this.ballManager.updateWeapons(scaledDt);
    this.ballManager.checkWeaponCollisions();
    this.ballManager.updateOrbTimers(scaledDt);
    this.blockManager.checkBallBlockCollisions();
    this.blockManager.update(scaledDt);
    this.specialObjects.update(scaledDt);
    this.physics.updateSpecialObjects(scaledDt);
    if (this.arena.updatePads) this.arena.updatePads(scaledDt, this.simTime);
    if (this.arena.updateScatteredOrbs) this.arena.updateScatteredOrbs(scaledDt, this.simTime);
    this.effects.update(scaledDt);
  }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  spawnBall(config) {
    var pos;
    if (config && config.position) {
      pos = config.position;
    } else {
      var bounds = this.arena.getArenaBounds();
      var margin = 40;
      pos = {
        x: bounds.minX + margin + Math.random() * (bounds.maxX - bounds.minX - margin * 2),
        y: bounds.minY + margin + Math.random() * (bounds.maxY - bounds.minY - margin * 2)
      };
    }
    var merged = Object.assign({}, window.PRESETS.BALL_DEFAULTS, config || {});
    var ball = this.ballManager.createBall(pos.x, pos.y, merged);
    if (ball) {
      this.log("Spawned ball: " + (merged.name || "Ball") + " (" + (merged.team || "neutral") + ")", teamColorFor(merged.team));
    }
    return ball;
  }

  spawnBlock(config) {
    var pos;
    if (config && config.position) {
      pos = config.position;
    } else {
      var bounds = this.arena.getArenaBounds();
      var margin = 40;
      pos = {
        x: bounds.minX + margin + Math.random() * (bounds.maxX - bounds.minX - margin * 2),
        y: bounds.minY + margin + Math.random() * (bounds.maxY - bounds.minY - margin * 2)
      };
    }
    var merged = Object.assign({}, config || {});
    var block = this.blockManager.createBlock(pos.x, pos.y, merged);
    if (block) {
      this.log("Spawned block: " + (merged.type || "Brick"), "#aa8844");
    }
    return block;
  }

  spawnSpecial(type, x, y) {
    var obj = this.specialObjects.createObject(x, y, type);
    if (obj) {
      this.log("Spawned special: " + type, "#ff88cc");
    }
    return obj;
  }

  setArena(width, height) {
    this.arena.buildArena(width, height);
    this.camera.goTo(width/2, height/2, 0.9);
    this.log("Arena resized to " + width + "x" + height, "#88aa88");
  }

  loadArenaPreset(name) {
    this.arena.buildPreset(name);
    this.camera.goTo(this.arena.width/2, this.arena.height/2, 0.9);
    this.log("Loaded arena preset: " + name, "#88aa88");
  }

  startRandomBattle(settings) {
    this.clearAll();

    var s = settings || {};
    var numBallsPerTeam = s.numBallsPerTeam || (5 + Math.floor(Math.random() * 6));
    var numTeams = s.numTeams || 2;
    var arenaWidth = s.width || 1200;
    var arenaHeight = s.height || 800;
    var gravity = s.gravity !== undefined ? s.gravity : 1;
    var presetKeys = Object.keys(window.PRESETS.BALL_PRESETS);
    var teamNames = Object.keys(window.PRESETS.TEAMS);
    var usedTeams = teamNames.slice(0, numTeams);

    this.physics.setGravity(gravity);
    this.arena.buildArena(arenaWidth, arenaHeight);
    this.camera.goTo(arenaWidth/2, arenaHeight/2, 0.9);

    if (s.boundaryType) {
      this.arena.setBoundaryType(s.boundaryType);
    }

    for (var t = 0; t < usedTeams.length; t++) {
      var teamName = usedTeams[t];
      var teamColor = window.PRESETS.TEAMS[teamName].color;
      this.ballManager.createTeam(teamName, teamColor);

      for (var i = 0; i < numBallsPerTeam; i++) {
        var presetName = presetKeys[Math.floor(Math.random() * presetKeys.length)];
        var preset = window.PRESETS.BALL_PRESETS[presetName];
        var x = 100 + Math.random() * (arenaWidth - 200);
        var y = 100 + Math.random() * (arenaHeight - 200);

        var ballConfig = Object.assign({}, preset, {
          team: teamName,
          color: teamColor
        });
        this.ballManager.createBall(x, y, ballConfig);
      }
    }

    if (s.blocks && Array.isArray(s.blocks)) {
      for (var b = 0; b < s.blocks.length; b++) {
        var bd = s.blocks[b];
        this.blockManager.createBlock(bd.x, bd.y, bd);
      }
    } else if (!s.blocks) {
      var blockTypes = Object.keys(window.PRESETS.BLOCK_TYPES);
      var numBlocks = 5 + Math.floor(Math.random() * 10);
      for (var i = 0; i < numBlocks; i++) {
        var bType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
        var bx = 100 + Math.random() * (arenaWidth - 200);
        var by = 100 + Math.random() * (arenaHeight - 200);
        this.blockManager.createBlock(bx, by, { type: bType });
      }
    }

    if (s.specials && Array.isArray(s.specials)) {
      for (var sp = 0; sp < s.specials.length; sp++) {
        var sd = s.specials[sp];
        this.specialObjects.createObject(sd.x, sd.y, sd.type, sd);
      }
    }

    if (s.physicsPreset) {
      this.physics.applyPhysicsPreset(s.physicsPreset);
    }

    this.winCondition = s.winCondition || "LastBallStanding";
    this.isBuildMode = false;

    this.storeOriginalPositions();
    this.state = "Running";
    this.simTime = 0;
    this.roundTimer = 0;

    var totalBalls = this.ballManager.getAllBalls().length;
    this.log("Random battle started: " + totalBalls + " balls across " + usedTeams.length + " teams", "#44ff44");
    this.ui.showPanel("simControls");
    this.ui.showPanel("battleLog");
    this.ui.showPanel("hud");
    this.ui.updateSimControls("Playing");
  }

  launchExample(index) {
    var simKeys = Object.keys(window.PRESETS.SIMULATIONS);
    if (index < 0 || index >= simKeys.length) {
      this.log("Invalid example index: " + index, "#ff4444");
      return;
    }
    var simName = simKeys[index];
    var sim = window.PRESETS.SIMULATIONS[simName];
    this.loadSimulation(sim);
  }

  loadSimulation(sim) {
    this.clearAll();

    var arenaWidth = sim.width || 1200;
    var arenaHeight = sim.height || 800;
    var gravity = sim.gravity !== undefined ? sim.gravity : 1;

    this.physics.setGravity(gravity);
    this.arena.buildArena(arenaWidth, arenaHeight);
    this.camera.goTo(arenaWidth/2, arenaHeight/2, 0.9);

    if (sim.boundaryType) {
      this.arena.setBoundaryType(sim.boundaryType);
    }

    this.winCondition = sim.winCondition || "LastBallStanding";

    if (sim.balls && Array.isArray(sim.balls)) {
      for (var i = 0; i < sim.balls.length; i++) {
        var bd = sim.balls[i];
        var presetName = bd.preset || "Basic";
        var preset = window.PRESETS.BALL_PRESETS[presetName] || window.PRESETS.BALL_PRESETS.Basic;
        var teamName = bd.team || "Red";
        var teamInfo = window.PRESETS.TEAMS[teamName] || window.PRESETS.TEAMS.Red;

        if (!this.ballManager.teams[teamName]) {
          this.ballManager.createTeam(teamName, teamInfo.color);
        }

        var ballConfig = Object.assign({}, preset, {
          team: teamName,
          color: teamInfo.color
        });
        if (bd.overrides) {
          Object.assign(ballConfig, bd.overrides);
        }

        this.ballManager.createBall(bd.x, bd.y, ballConfig);
      }
    }

    if (sim.blocks && Array.isArray(sim.blocks)) {
      for (var i = 0; i < sim.blocks.length; i++) {
        var bl = sim.blocks[i];
        var bw = bl.w || bl.width || 40;
        var bh = bl.h || bl.height || 40;
        this.blockManager.createBlock(bl.x, bl.y, { type: bl.type || "Brick", size: Math.max(bw, bh) });
      }
    }

    this.isBuildMode = false;
    this.storeOriginalPositions();
    this.state = "Running";
    this.simTime = 0;
    this.roundTimer = 0;

    var totalBalls = this.ballManager.getAllBalls().length;
    var teamCount = Object.keys(this.ballManager.teams).length;
    this.log("Loaded simulation: " + (sim.name || "Custom") + " (" + totalBalls + " balls, " + teamCount + " teams)", "#ffcc44");
    this.ui.showPanel("simControls");
    this.ui.showPanel("battleLog");
    this.ui.showPanel("hud");
    this.ui.updateSimControls("Playing");
  }

  checkWinCondition() {
    if (this.winCondition === "LastBallStanding") {
      var alive = this.ballManager.getAliveBalls();
      if (alive.length <= 1) {
        var winner = alive.length === 1 ? alive[0] : null;
        var reason = winner ? "Last ball standing" : "All balls eliminated";
        this.endRound(winner ? winner.data.team : null, reason);
      }
    } else if (this.winCondition === "LastTeamStanding") {
      var winningTeam = this.ballManager.checkWinCondition();
      if (winningTeam) {
        this.endRound(winningTeam, "Last team standing");
      } else {
        // Also check if only one ball left across all teams
        var alive2 = this.ballManager.getAliveBalls();
        if (alive2.length <= 1 && alive2.length > 0) {
          this.endRound(alive2[0].data.team, "Last ball standing");
        } else if (alive2.length === 0) {
          this.endRound(null, "All eliminated");
        }
      }
    }
  }

  endRound(winner, reason) {
    this.state = "Ended";
    var overlay = document.getElementById("countdownOverlay");
    if (overlay) overlay.classList.add("hidden");
    var duration = this.simTime;
    var teamStats = this.ballManager.getTeamStats();
    var teams = this.ballManager.teams;

    var resultsTeams = {};
    var teamKeys = Object.keys(teams);
    for (var i = 0; i < teamKeys.length; i++) {
      var tName = teamKeys[i];
      var t = teams[tName];
      var stats = teamStats[tName] || {};
      var aliveCount = 0;
      var aliveBalls = this.ballManager.getBallsByTeam(tName);
      aliveCount = aliveBalls.length;
      resultsTeams[tName] = {
        survivors: aliveCount,
        damageDealt: stats.damageDealt || 0,
        kills: stats.kills || 0,
        color: t.color
      };
    }

    var winnerColor = null;
    if (winner && window.PRESETS.TEAMS[winner]) {
      winnerColor = window.PRESETS.TEAMS[winner].color;
    }

    this.ui.showResults({
      winner: winner || "Draw",
      winnerColor: winnerColor,
      reason: reason,
      teams: resultsTeams,
      duration: duration
    });

    var logMsg = winner ? ("Winner: " + winner + " - " + reason) : ("Draw - " + reason);
    var logColor = winner ? (winnerColor || "#ffcc44") : "#aaaaaa";
    this.log(logMsg, logColor);
  }

  log(text, color) {
    this.battleLog.push({ text: text, color: color, time: Date.now() });
    this.ui.addBattleLogEntry(text, color);
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupInput() {
    var self = this;

    window.addEventListener('resize', function () {
      self.handleResize();
    });

    this.canvas.addEventListener('mousedown', function (e) {
      var rect = self.canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      // Wizard custom builder handling
      var customBuilderVisible = document.getElementById("customMapBuilder") && !document.getElementById("customMapBuilder").classList.contains("hidden");
      if (customBuilderVisible && e.button === 0) {
        var worldPos = self.camera.screenToWorld(x, y);
        var tool = self.ui.buildTool;
        if (tool === "wall") {
          self._customDragging = { startX: worldPos.x, startY: worldPos.y, preview: null };
          // Create preview rect
          return;
        } else if (tool === "portal") {
          var cdInput = document.getElementById("portalCooldown");
          var cd = cdInput ? parseFloat(cdInput.value) : 3;
          self.arena.addPortal(worldPos.x, worldPos.y, cd);
          self.ui.updateBuildCounts();
          self.log("Portal placed (" + cd + "s cooldown)", "#00ff88");
          return;
        } else if (tool === "healPad") {
          self.ui.openBuildConfig("healPad", worldPos.x, worldPos.y);
          return;
        } else if (tool === "rotatePad") {
          self.ui.openBuildConfig("rotatePad", worldPos.x, worldPos.y);
          return;
        } else if (tool === "delete") {
          // Delete nearest custom object / pad / portal within 40 world units
          var best = null, bestDist = 40, bestType = null, bestIdx = -1;
          // Check walls
          for (var wi=0; wi<self.arena.customObjects.length; wi++) {
            var co = self.arena.customObjects[wi];
            if (co.type !== "wall") continue;
            var d = Math.sqrt(Math.pow(worldPos.x - co.x,2)+Math.pow(worldPos.y - co.y,2));
            if (d < bestDist) { bestDist = d; best = co; bestType="wall"; bestIdx=wi; }
          }
          for (var pi=0; pi<self.arena.orbPads.length; pi++) {
            var pad = self.arena.orbPads[pi];
            var d2 = Math.sqrt(Math.pow(worldPos.x - pad.x,2)+Math.pow(worldPos.y - pad.y,2));
            if (d2 < bestDist) { bestDist = d2; best = pad; bestType="pad"; bestIdx=pi; }
          }
          for (var poi=0; poi<self.arena.portals.length; poi++) {
            var por = self.arena.portals[poi];
            var d3 = Math.sqrt(Math.pow(worldPos.x - por.x,2)+Math.pow(worldPos.y - por.y,2));
            if (d3 < 30 && d3 < bestDist) { bestDist = d3; best = por; bestType="portal"; bestIdx=poi; }
          }
          if (best) {
            if (bestType==="wall") { if(best.body) Matter.Composite.remove(self.arena.physics.world, best.body); self.arena.customObjects.splice(bestIdx,1); }
            else if (bestType==="pad") { if(best.body) Matter.Composite.remove(self.arena.physics.world, best.body); self.arena.orbPads.splice(bestIdx,1); }
            else if (bestType==="portal") { if(best.body) Matter.Composite.remove(self.arena.physics.world, best.body); self.arena.portals.splice(bestIdx,1); }
            self.ui.updateBuildCounts();
            self.log("Deleted " + bestType, "#ff6666");
          }
          return;
        }
      }

      self.camera.onMouseDown(x, y, e.button);

      if (self.isBuildMode && e.button === 0 && !customBuilderVisible) {
        var worldPos2 = self.camera.screenToWorld(x, y);
        var tool = self.ui.currentTool;
        var objType = self.ui.currentObjectType;

        var toolLower = (tool || "").toLowerCase();
        var objLower = (objType || "").toLowerCase();
        if (toolLower === "ball" || objLower === "ball") {
          var ballData = self.ui.getFormData("ballEditor") || {};
          ballData.team = ballData.team || "Red";
          ballData.ai = ballData.ai || "Aggressive";
          ballData.weaponType = ballData.weaponType || ballData.weapon || "Sword";
          var sp = self.camera.screenToWorld(x, y);
          ballData.position = { x: sp.x, y: sp.y };
          self.spawnBall(ballData);
        } else if (toolLower === "block" || objLower === "block") {
          var blockData = self.ui.getFormData("blockEditor") || {};
          blockData.type = blockData.material || blockData.type || "Brick";
          var sp2 = self.camera.screenToWorld(x, y);
          blockData.position = { x: sp2.x, y: sp2.y };
          self.spawnBlock(blockData);
        } else if (tool === "wall") {
          self.blockManager.createBlock(worldPos2.x, worldPos2.y, { type: "Indestructible", size: 40 });
        } else if (tool === "delete") {
          var allBalls = self.ballManager.getAllBalls();
          for (var i = allBalls.length - 1; i >= 0; i--) {
            var ball = allBalls[i];
            var dx = worldPos2.x - ball.body.position.x;
            var dy = worldPos2.y - ball.body.position.y;
            if (Math.sqrt(dx * dx + dy * dy) < ball.data.size + 10) {
              self.ballManager.removeBall(ball.id);
              self.log("Deleted ball: " + ball.data.name, "#ff6666");
              break;
            }
          }
          var allBlocks = self.blockManager.getAllBlocks();
          for (var i = allBlocks.length - 1; i >= 0; i--) {
            var block = allBlocks[i];
            var dx = worldPos2.x - block.body.position.x;
            var dy = worldPos2.y - block.body.position.y;
            if (Math.sqrt(dx * dx + dy * dy) < block.data.size) {
              self.blockManager.removeBlock(block.id);
              self.log("Deleted block", "#ff6666");
              break;
            }
          }
        }
      }
    });

    this.canvas.addEventListener('mousemove', function (e) {
      var rect = self.canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      if (self._customDragging) {
        // Wall drag preview could be drawn via renderer - for now just track
        var worldPos = self.camera.screenToWorld(x, y);
        self._customDragging.endX = worldPos.x;
        self._customDragging.endY = worldPos.y;
        return;
      }
      self.camera.onMouseMove(x, y);
    });

    this.canvas.addEventListener('mouseup', function (e) {
      if (self._customDragging) {
        var rect = self.canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var worldPos = self.camera.screenToWorld(x, y);
        var start = self._customDragging;
        var w = Math.abs(worldPos.x - start.startX);
        var h = Math.abs(worldPos.y - start.startY);
        var cx = (worldPos.x + start.startX)/2;
        var cy = (worldPos.y + start.startY)/2;
        if (w < 20) w = 40;
        if (h < 20) h = 20;
        self.arena.addCustomWall(cx, cy, w, h);
        self.ui.updateBuildCounts();
        self.log("Wall placed " + Math.round(w) + "x" + Math.round(h), "#8888ff");
        self._customDragging = null;
        return;
      }
      self.camera.onMouseUp();
    });

    this.canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  }

  storeOriginalPositions() {
    this._savedPositions = { balls: [], blocks: [] };

    var allBalls = this.ballManager.getAllBalls();
    for (var i = 0; i < allBalls.length; i++) {
      var ball = allBalls[i];
      this._savedPositions.balls.push({
        id: ball.id,
        x: ball.body.position.x,
        y: ball.body.position.y,
        hp: ball.data.hp,
        alive: ball.data.alive
      });
    }

    var allBlocks = this.blockManager.getAllBlocks();
    for (var i = 0; i < allBlocks.length; i++) {
      var block = allBlocks[i];
      this._savedPositions.blocks.push({
        id: block.id,
        x: block.body.position.x,
        y: block.body.position.y,
        hp: block.data.hp
      });
    }
  }

  restoreOriginalPositions() {
    if (!this._savedPositions) return;

    var savedBalls = this._savedPositions.balls;
    for (var i = 0; i < savedBalls.length; i++) {
      var saved = savedBalls[i];
      var ball = this.ballManager.getBall(saved.id);
      if (ball && ball.body) {
        Matter.Body.setPosition(ball.body, { x: saved.x, y: saved.y });
        Matter.Body.setVelocity(ball.body, { x: 0, y: 0 });
        ball.data.hp = saved.hp;
        ball.data.alive = saved.alive;
      }
    }

    var savedBlocks = this._savedPositions.blocks;
    for (var i = 0; i < savedBlocks.length; i++) {
      var saved = savedBlocks[i];
      var block = this.blockManager.getBlock(saved.id);
      if (block && block.body) {
        Matter.Body.setPosition(block.body, { x: saved.x, y: saved.y });
        block.data.hp = saved.hp;
      }
    }

    this.effects.clear();
  }

  clearAll() {
    this.ballManager.reset();
    this.blockManager.reset();
    this.specialObjects.clear();
    this.effects.clear();
    this.arena.clear();
    this.physics.clear();
    this.matchModifiers = null;
    this.state = "Stopped";
    this.countdownValue = 0;
    this.countdownTimer = 0;
    var overlay = document.getElementById("countdownOverlay");
    if (overlay) overlay.classList.add("hidden");
    this._savedPositions = null;
  }

  play() {
    if (this.state === "Paused") {
      this.resumeSimulation();
    } else if (this.state === "Stopped" || this.state === "Ended") {
      this.startSimulation();
    }
  }

  pause() {
    this.pauseSimulation();
  }

  stop() {
    this.stopSimulation();
  }

  reset() {
    this.resetSimulation();
  }

  step() {
    this.stepSimulation();
  }

  loadExample(data) {
    if (data && data.balls) {
      this.loadSimulation(data);
    } else {
      this.startRandomBattle(data);
    }
  }

  loadSaveData(data) {
    if (!data) return;
    this.clearAll();

    if (data.arena) {
      this.arena.buildArena(data.arena.width || 1200, data.arena.height || 800);
    }

    if (data.balls && Array.isArray(data.balls)) {
      for (var i = 0; i < data.balls.length; i++) {
        var bd = data.balls[i];
        var teamName = bd.team || "Red";
        var teamInfo = window.PRESETS.TEAMS[teamName] || window.PRESETS.TEAMS.Red;
        if (!this.ballManager.teams[teamName]) {
          this.ballManager.createTeam(teamName, teamInfo.color);
        }
        var config = Object.assign({}, bd, { color: teamInfo.color });
        this.ballManager.createBall(bd.x || 400, bd.y || 300, config);
      }
    }

    if (data.blocks && Array.isArray(data.blocks)) {
      for (var i = 0; i < data.blocks.length; i++) {
        var bl = data.blocks[i];
        this.blockManager.createBlock(bl.x || 400, bl.y || 300, bl);
      }
    }

    this.isBuildMode = false;
    this.log("Loaded save data", "#44ff44");
  }
};

function teamColorFor(team) {
  if (window.PRESETS && window.PRESETS.TEAMS && window.PRESETS.TEAMS[team]) {
    return window.PRESETS.TEAMS[team].color;
  }
  return '#ffffff';
}

document.addEventListener('DOMContentLoaded', function () {
  window.game = new Game();
});
