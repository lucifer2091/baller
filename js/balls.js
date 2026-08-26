window.BallManager = class BallManager {
  constructor(physics) {
    this.physics = physics;
    this.balls = [];
    this.nextId = 1;
    this.teams = {};
  }

  createBall(x, y, config = {}) {
    const defaults = window.PRESETS?.BALL_DEFAULTS || {};
    const data = {
      name: config.name || defaults.name || 'Ball',
      hp: config.hp || defaults.hp || 100,
      maxHp: config.hp || defaults.hp || 100,
      damage: config.damage || defaults.damage || 10,
      speed: config.speed || defaults.speed || 3,
      size: config.size || defaults.size || 20,
      mass: config.mass || defaults.mass || 1,
      team: config.team || defaults.team || 'neutral',
      ai: (config.ai || defaults.ai || 'random').toLowerCase(),
      color: config.color || defaults.color || '#ffffff',
      weaponType: config.weaponType || defaults.weaponType || null,
      critChance: config.critChance || defaults.critChance || 0.05,
      critMultiplier: config.critMultiplier || defaults.critMultiplier || 2,
      knockback: config.knockback || defaults.knockback || 25,
      alive: true,
      lastAttackTime: 0,
      targetId: null,
      weaponId: null,
      kills: 0,
      damageDealt: 0
    };

    // Apply weapon statMods
    var weaponPreset = window.PRESETS && window.PRESETS.WEAPON_TYPES && window.PRESETS.WEAPON_TYPES[config.weaponType];
    if (weaponPreset && weaponPreset.statMods) {
      if (weaponPreset.statMods.damage) data.damage += weaponPreset.statMods.damage;
      if (weaponPreset.statMods.speed) data.speed += weaponPreset.statMods.speed;
      if (weaponPreset.statMods.size) data.size += weaponPreset.statMods.size;
      if (data.speed < 0.5) data.speed = 0.5;
    }

    // Store original base stats
    data.baseSpeed = data.speed;
    data.baseDamage = data.damage;
    data.baseSize = data.size;

    // Initialize modifier tracking
    data.wallBoostStacks = 0;
    data.hasLifesteal = false;
    data.rotSpeedMult = 1;
    data.lifestealHeal = 0;
    data.orbRotTimer = 0;
    data.orbRotMult = 1;

    const ball = {
      id: this.nextId++,
      body: this.physics.addBall(x, y, data.size, {
        hp: data.hp,
        maxHp: data.maxHp,
        damage: data.damage,
        speed: data.speed,
        mass: data.mass,
        team: data.team,
        ai: data.ai,
        color: data.color,
        weaponType: data.weaponType,
        critChance: data.critChance,
        critMultiplier: data.critMultiplier,
        knockback: data.knockback,
        name: data.name,
        bounce: config.bounce,
        friction: config.friction
      }),
      data: data
    };

    this.balls.push(ball);

    if (!this.teams[data.team]) {
      this.createTeam(data.team, data.color);
    }
    this.teams[data.team].alive++;

    if (data.weaponType) {
      this.createWeapon(ball);
    }

    return ball;
  }

  applyMatchModifiers(modifiers) {
    // modifiers has shape { base: {...}, ball: { damage2x, lifesteal, speed2x, rotSpeed15x, randomSize } }
    for (var i=0; i<this.balls.length; i++) {
      var b = this.balls[i];
      if (!b.data.alive) continue;
      if (modifiers.ball.damage2x) b.data.damage *= 2;
      if (modifiers.ball.speed2x) { b.data.speed *= 2; b.data.baseSpeed *= 2; }
      if (modifiers.ball.rotSpeed15x) b.data.rotSpeedMult = 1.5;
      if (modifiers.ball.lifesteal) b.data.hasLifesteal = true;
      if (modifiers.ball.randomSize) {
        var factor = 0.7 + Math.random() * 0.8; // 0.7 to 1.5
        var newSize = b.data.size * factor;
        b.data.size = newSize;
        // Update physics body radius - destroy and recreate or scale
        // For now just update data.size and let physics handle via scaling
        // Also update Matter body circle radius by recreating
        if (b.body && b.body.circleRadius) {
          var oldPos = { x: b.body.position.x, y: b.body.position.y };
          var oldVel = { x: b.body.velocity.x, y: b.body.velocity.y };
          // Remove old body and create new with new size - preserve gameData
          var gd = b.body.gameData;
          this.physics.removeBody(b.body);
          var newBody = this.physics.addBall(oldPos.x, oldPos.y, newSize, {
            hp: gd.hp, maxHp: gd.maxHp, damage: gd.damage, speed: gd.speed,
            mass: gd.mass, team: gd.team, ai: gd.ai, color: gd.color,
            weaponType: gd.weaponType, critChance: gd.critChance,
            critMultiplier: gd.critMultiplier, knockback: gd.knockback,
            name: gd.name
          });
          newBody.gameData = gd;
          newBody.gameData.size = newSize;
          Matter.Body.setVelocity(newBody, oldVel);
          b.body = newBody;
        }
      }
    }
  }

  removeBall(id) {
    const idx = this.balls.findIndex(b => b.id === id);
    if (idx !== -1) {
      const ball = this.balls[idx];
      if (ball.data.team && this.teams[ball.data.team]) {
        this.teams[ball.data.team].alive--;
      }
      this.physics.removeBody(ball.body);
      this.balls.splice(idx, 1);
    }
  }

  getBall(id) {
    return this.balls.find(b => b.id === id) || null;
  }

  getAllBalls() {
    return this.balls;
  }

  getAliveBalls() {
    return this.balls.filter(b => b.data.alive);
  }

  getBallsByTeam(teamName) {
    return this.balls.filter(b => b.data.team === teamName && b.data.alive);
  }

  getEnemyBalls(ball) {
    return this.balls.filter(b => b.data.alive && b.data.team !== ball.data.team);
  }

  getNearestEnemy(ball) {
    let nearest = null;
    let minDist = Infinity;
    const enemies = this.getEnemyBalls(ball);
    for (const e of enemies) {
      const dx = e.body.position.x - ball.body.position.x;
      const dy = e.body.position.y - ball.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return { ball: nearest, distance: minDist };
  }

  damageBall(ball, amount, source = null) {
    if (!ball.data.alive) return;

    const critChance = 0.1;
    let finalAmount = amount;
    if (Math.random() < critChance) {
      finalAmount = Math.floor(amount * 1.5);
    }

    ball.data.hp -= finalAmount;
    if (source && source.data) {
      source.data.damageDealt = (source.data.damageDealt || 0) + finalAmount;
    }

    if (source && source.data && source.data.hasLifesteal) {
      var healAmount = finalAmount * 0.2;
      this.healBall(source, healAmount);
      source.data.lifestealHeal = (source.data.lifestealHeal || 0) + healAmount;
    }

    // orbRotTimer handling: if source has active rotation orb, its weapon orbit is faster (handled in updateWeapons via rotSpeedMult/ orbRotMult)

    if (ball.data.hp <= 0) {
      ball.data.hp = 0;
      this.killBall(ball, source);
    }
  }

  updateOrbTimers(dt) {
    for (var i=0; i<this.balls.length; i++) {
      var b = this.balls[i];
      if (b.data.orbRotTimer > 0) {
        b.data.orbRotTimer -= dt;
        if (b.data.orbRotTimer <= 0) {
          b.data.orbRotTimer = 0;
          b.data.orbRotMult = 1;
        }
      }
    }
  }

  applyWallBoost(ball) {
    if (!ball.data.alive) return;
    var cap = ball.data.baseSpeed * 3;
    if (ball.data.speed >= cap) return;
    ball.data.speed = Math.min(cap, ball.data.speed * 1.02);
    ball.data.wallBoostStacks = (ball.data.wallBoostStacks || 0) + 1;
  }

  applyRotateOrb(ball, mult, duration) {
    ball.data.orbRotMult = mult;
    ball.data.orbRotTimer = duration;
  }

  killBall(ball, killer = null) {
    if (!ball.data.alive) return;
    ball.data.alive = false;

    if (killer && killer.data) {
      killer.data.kills = (killer.data.kills || 0) + 1;
    }

    const team = ball.data.team;
    if (this.teams[team]) {
      this.teams[team].alive--;
      if (this.teams[team].alive <= 0) {
        this.teams[team].score = 0;
      }
    }

    setTimeout(() => {
      this.removeBall(ball.id);
    }, 500);
  }

  healBall(ball, amount) {
    if (!ball.data.alive) return;
    ball.data.hp = Math.min(ball.data.hp + amount, ball.data.maxHp);
  }

  moveBall(ball, targetX, targetY) {
    const dx = targetX - ball.body.position.x;
    const dy = targetY - ball.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const speed = ball.data.speed;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    this.physics.setVelocity(ball.body, { x: vx, y: vy });
  }

  updateAI(dt) {
    for (const ball of this.balls) {
      if (!ball.data.alive) continue;

      const ai = (ball.data.ai || '').toLowerCase();
      switch (ai) {
        case 'aggressive': this.aggroAI(ball, dt); break;
        case 'defensive': this.defensiveAI(ball, dt); break;
        case 'random': this.randomAI(ball, dt); break;
        case 'ranged': this.rangedAI(ball, dt); break;
        case 'melee': this.meleeAI(ball, dt); break;
        case 'coward': this.cowardAI(ball, dt); break;
        case 'guard': this.guardAI(ball, dt); break;
        case 'berserker': this.berserkerAI(ball, dt); break;
        case 'passive': this.passiveAI(ball, dt); break;
        default: this.randomAI(ball, dt); break;
      }
    }
  }

  aggroAI(ball, dt) {
    const nearest = this.getNearestEnemy(ball);
    if (nearest.ball) {
      this.moveBall(ball, nearest.ball.body.position.x, nearest.ball.body.position.y);
    }
  }

  defensiveAI(ball, dt) {
    const nearest = this.getNearestEnemy(ball);
    if (nearest.ball && nearest.distance < 150) {
      const dx = ball.body.position.x - nearest.ball.body.position.x;
      const dy = ball.body.position.y - nearest.ball.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const fleeX = ball.body.position.x + (dx / dist) * 100;
      const fleeY = ball.body.position.y + (dy / dist) * 100;
      this.moveBall(ball, fleeX, fleeY);
    } else {
      this.randomAI(ball, dt);
    }
  }

  randomAI(ball, dt) {
    if (Math.random() < 0.02) {
      ball._randomTarget = {
        x: ball.body.position.x + (Math.random() - 0.5) * 400,
        y: ball.body.position.y + (Math.random() - 0.5) * 400
      };
    }
    if (ball._randomTarget) {
      this.moveBall(ball, ball._randomTarget.x, ball._randomTarget.y);
    }
  }

  rangedAI(ball, dt) {
    const nearest = this.getNearestEnemy(ball);
    if (nearest.ball) {
      if (nearest.distance < 100) {
        const dx = ball.body.position.x - nearest.ball.body.position.x;
        const dy = ball.body.position.y - nearest.ball.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const fleeX = ball.body.position.x + (dx / dist) * 100;
        const fleeY = ball.body.position.y + (dy / dist) * 100;
        this.moveBall(ball, fleeX, fleeY);
      } else {
        this.moveBall(ball, nearest.ball.body.position.x, nearest.ball.body.position.y);
      }
    }
  }

  meleeAI(ball, dt) {
    const nearest = this.getNearestEnemy(ball);
    if (nearest.ball) {
      this.moveBall(ball, nearest.ball.body.position.x, nearest.ball.body.position.y);
    }
  }

  cowardAI(ball, dt) {
    const nearest = this.getNearestEnemy(ball);
    const hpRatio = ball.data.hp / ball.data.maxHp;

    if (hpRatio < 0.3 && nearest.ball) {
      const dx = ball.body.position.x - nearest.ball.body.position.x;
      const dy = ball.body.position.y - nearest.ball.body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const fleeX = ball.body.position.x + (dx / dist) * 200;
      const fleeY = ball.body.position.y + (dy / dist) * 200;
      this.moveBall(ball, fleeX, fleeY);
    } else {
      this.randomAI(ball, dt);
    }
  }

  guardAI(ball, dt) {
    const spawn = ball._spawn || ball.body.position;
    const dx = spawn.x - ball.body.position.x;
    const dy = spawn.y - ball.body.position.y;
    const distToSpawn = Math.sqrt(dx * dx + dy * dy);

    if (distToSpawn > 50) {
      this.moveBall(ball, spawn.x, spawn.y);
    } else {
      const nearest = this.getNearestEnemy(ball);
      if (nearest.ball && nearest.distance < 150) {
        this.moveBall(ball, nearest.ball.body.position.x, nearest.ball.body.position.y);
      }
    }
  }

  berserkerAI(ball, dt) {
    const nearest = this.getNearestEnemy(ball);
    if (!nearest.ball) return;

    const hpRatio = ball.data.hp / ball.data.maxHp;
    const speedMult = hpRatio < 0.5 ? 1.5 : 1.0;

    const dx = nearest.ball.body.position.x - ball.body.position.x;
    const dy = nearest.ball.body.position.y - ball.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const vx = (dx / dist) * ball.data.speed * speedMult;
    const vy = (dy / dist) * ball.data.speed * speedMult;

    this.physics.setVelocity(ball.body, { x: vx, y: vy });
  }

  passiveAI(ball, dt) {
    if (Math.random() < 0.01) {
      ball._wanderTarget = {
        x: ball.body.position.x + (Math.random() - 0.5) * 300,
        y: ball.body.position.y + (Math.random() - 0.5) * 300
      };
    }
    if (ball._wanderTarget) {
      this.moveBall(ball, ball._wanderTarget.x, ball._wanderTarget.y);
    }
  }

  createWeapon(ball) {
    const weapons = window.PRESETS?.WEAPON_TYPES || {};
    const weaponData = weapons[ball.data.weaponType] || weapons.Sword || { damage: 10, range: 30, attackSpeed: 1.0 };

    const weapon = {
      id: this.nextId++,
      ballId: ball.id,
      type: ball.data.weaponType,
      data: {
        ...weaponData,
        angle: 0,
        orbitRadius: weaponData.range || 30,
        cooldown: (1 / (weaponData.attackSpeed || 1)) * 1000,
        lastAttackTime: 0,
        projectiles: []
      }
    };

    ball.data.weaponId = weapon.id;
    if (!ball._weapons) ball._weapons = [];
    ball._weapons.push(weapon);

    return weapon;
  }

  updateWeapons(dt) {
    for (const ball of this.balls) {
      if (!ball.data.alive || !ball._weapons) continue;

      for (const weapon of ball._weapons) {
        var wPreset = (window.PRESETS && window.PRESETS.WEAPON_TYPES && window.PRESETS.WEAPON_TYPES[weapon.type]) || null;
        var wBehavior = (wPreset && wPreset.behavior) || weapon.data.behavior || "sweep";
        if (wBehavior === 'shoot') {
          weapon.data.angle += 0.08 * (ball.data.rotSpeedMult || 1) * (ball.data.orbRotMult || 1);

          if (Date.now() - weapon.data.lastAttackTime > weapon.data.cooldown) {
            const enemies = this.getEnemyBalls(ball);
            if (enemies.length > 0) {
              const target = enemies[0];
              const px = ball.body.position.x + Math.cos(weapon.data.angle) * weapon.data.orbitRadius;
              const py = ball.body.position.y + Math.sin(weapon.data.angle) * weapon.data.orbitRadius;

              const dx = target.body.position.x - px;
              const dy = target.body.position.y - py;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;

              weapon.data.projectiles.push({
                x: px, y: py,
                vx: (dx / dist) * 5,
                vy: (dy / dist) * 5,
                life: 60,
                damage: weapon.data.damage
              });
              weapon.data.lastAttackTime = Date.now();
            }
          }

          for (let i = weapon.data.projectiles.length - 1; i >= 0; i--) {
            const proj = weapon.data.projectiles[i];
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.life--;

            const enemies = this.getEnemyBalls(ball);
            for (const enemy of enemies) {
              const dx = proj.x - enemy.body.position.x;
              const dy = proj.y - enemy.body.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < enemy.data.size + 5) {
                this.damageBall(enemy, proj.damage, ball);
                proj.life = 0;
                break;
              }
            }

            if (proj.life <= 0) {
              weapon.data.projectiles.splice(i, 1);
            }
          }
        } else {
          weapon.data.angle += 0.08 * (ball.data.rotSpeedMult || 1) * (ball.data.orbRotMult || 1);

          const ox = ball.body.position.x + Math.cos(weapon.data.angle) * weapon.data.orbitRadius;
          const oy = ball.body.position.y + Math.sin(weapon.data.angle) * weapon.data.orbitRadius;

          if (Date.now() - weapon.data.lastAttackTime > weapon.data.cooldown) {
            const enemies = this.getEnemyBalls(ball);
            for (const enemy of enemies) {
              const dx = ox - enemy.body.position.x;
              const dy = oy - enemy.body.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < enemy.data.size + weapon.data.orbitRadius * 0.5) {
                this.damageBall(enemy, weapon.data.damage, ball);
                weapon.data.lastAttackTime = Date.now();
                break;
              }
            }
          }
        }
      }
    }
  }

  checkWeaponCollisions() {
    for (const ball of this.balls) {
      if (!ball.data.alive || !ball._weapons) continue;

      for (const weapon of ball._weapons) {
        var cwPreset = (window.PRESETS && window.PRESETS.WEAPON_TYPES && window.PRESETS.WEAPON_TYPES[weapon.type]) || null;
        var cwBehavior = (cwPreset && cwPreset.behavior) || weapon.data.behavior || "sweep";
        if (cwBehavior === 'shoot') continue;

        const ox = ball.body.position.x + Math.cos(weapon.data.angle) * weapon.data.orbitRadius;
        const oy = ball.body.position.y + Math.sin(weapon.data.angle) * weapon.data.orbitRadius;

        const enemies = this.getEnemyBalls(ball);
        for (const enemy of enemies) {
          const dx = ox - enemy.body.position.x;
          const dy = oy - enemy.body.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < enemy.data.size + 15) {
            if (Date.now() - weapon.data.lastAttackTime > weapon.data.cooldown) {
              this.damageBall(enemy, weapon.data.damage, ball);
              weapon.data.lastAttackTime = Date.now();
            }
          }
        }
      }
    }
  }

  createTeam(name, color) {
    if (!this.teams[name]) {
      this.teams[name] = {
        name: name,
        color: color || '#ffffff',
        score: 0,
        alive: 0
      };
    }
  }

  updateTeamScore(teamName, amount) {
    if (this.teams[teamName]) {
      this.teams[teamName].score += amount;
    }
  }

  checkWinCondition() {
    const activeTeams = Object.entries(this.teams).filter(([_, t]) => t.alive > 0);
    if (activeTeams.length === 1) {
      return activeTeams[0][0];
    }
    return null;
  }

  getTeamStats() {
    const stats = {};
    for (const [name, team] of Object.entries(this.teams)) {
      stats[name] = {
        damageDealt: 0,
        kills: 0,
        blocksDestroyed: 0
      };
    }
    for (const ball of this.balls) {
      const team = ball.data.team;
      if (stats[team]) {
        stats[team].damageDealt += ball.data.damageDealt || 0;
        stats[team].kills += ball.data.kills || 0;
      }
    }
    return stats;
  }

  reset() {
    for (const ball of this.balls) {
      this.physics.removeBody(ball.body);
    }
    this.balls = [];
    this.teams = {};
  }
};
