window.SpecialObjectManager = class SpecialObjectManager {
  constructor(physics) {
    this.physics = physics;
    this.objects = [];
    this.nextId = 1;
  }

  createObject(x, y, type, config = {}) {
    let preset = null;
    if (typeof PRESETS !== "undefined" && PRESETS.SPECIAL_OBJECTS && PRESETS.SPECIAL_OBJECTS[type]) {
      preset = PRESETS.SPECIAL_OBJECTS[type];
    }

    const cfg = Object.assign({}, preset || {}, config);

    const radius = cfg.radius || 30;
    const isSensor = cfg.sensor !== false;

    const body = Matter.Bodies.circle(x, y, radius, {
      isStatic: true,
      isSensor: isSensor,
      label: "special_" + type,
      restitution: 1,
      friction: 0
    });

    const MatterRef = Matter.Composite;
    MatterRef.add(this.physics.world, body);

    const obj = {
      id: this.nextId++,
      body: body,
      type: type,
      data: {
        radius: radius,
        color: cfg.color || this._defaultColor(type),
        force: cfg.force || this._defaultForce(type),
        damage: cfg.damage || this._defaultDamage(type),
        healRate: cfg.healRate || 5,
        speedMultiplier: cfg.speedMultiplier || 2,
        forceDirection: cfg.forceDirection || { x: 0, y: -1 },
        forceAngle: cfg.forceAngle,
        knockback: cfg.knockback || this._defaultKnockback(type),
        range: cfg.range || radius * 2,
        active: true
      }
    };

    this.objects.push(obj);
    return obj;
  }

  removeObject(id) {
    const idx = this.objects.findIndex(o => o.id === id);
    if (idx === -1) return false;
    const obj = this.objects[idx];
    Matter.Composite.remove(this.physics.world, obj.body);
    this.objects.splice(idx, 1);
    return true;
  }

  getAllObjects() {
    return this.objects;
  }

  updateBumper(ball, bumper) {
    const body = ball.body;
    const bpos = bumper.body.position;
    const bx = body.position.x - bpos.x;
    const by = body.position.y - bpos.y;
    const dist = Math.sqrt(bx * bx + by * by) || 1;
    const nx = bx / dist;
    const ny = by / dist;
    const force = bumper.data.force || 0.015;
    Matter.Body.applyForce(body, body.position, { x: nx * force, y: ny * force });
  }

  updateLauncher(ball, launcher) {
    const body = ball.body;
    const force = launcher.data.force || 0.02;
    let dx, dy;

    if (launcher.data.forceAngle !== undefined) {
      const angle = launcher.data.forceAngle * Math.PI / 180;
      dx = Math.cos(angle);
      dy = Math.sin(angle);
    } else if (launcher.data.forceDirection) {
      const fd = launcher.data.forceDirection;
      const mag = Math.sqrt(fd.x * fd.x + fd.y * fd.y) || 1;
      dx = fd.x / mag;
      dy = fd.y / mag;
    } else {
      const lpos = launcher.body.position;
      dx = body.position.x - lpos.x;
      dy = body.position.y - lpos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dist;
      dy /= dist;
    }

    Matter.Body.applyForce(body, body.position, { x: dx * force, y: dy * force });
  }

  updateSpeedZone(ball, zone) {
    const vel = ball.body.velocity;
    const mult = zone.data.speedMultiplier || 2;
    Matter.Body.setVelocity(ball.body, {
      x: vel.x * mult,
      y: vel.y * mult
    });
  }

  updateHealZone(ball, zone) {
    if (ball.data && ball.data.hp !== undefined) {
      ball.data.hp = Math.min(ball.data.maxHp || ball.data.hp, ball.data.hp + (zone.data.healRate || 5));
    }
  }

  updateDamageZone(ball, zone) {
    const dmg = zone.data.damage || 10;
    if (ball.data && ball.data.hp !== undefined) {
      ball.data.hp -= dmg;
      if (ball.data.hp <= 0) {
        ball.data.hp = 0;
        ball.data.alive = false;
      }
    }
  }

  updateLava(ball, lava) {
    const dmg = (lava.data.damage || 25);
    if (ball.data && ball.data.hp !== undefined) {
      ball.data.hp -= dmg;
      if (ball.data.hp <= 0) {
        ball.data.hp = 0;
        ball.data.alive = false;
      }
    }

    const body = ball.body;
    const lpos = lava.body.position;
    const dx = body.position.x - lpos.x;
    const dy = body.position.y - lpos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const kb = lava.data.knockback || 0.02;
    Matter.Body.applyForce(body, body.position, {
      x: (dx / dist) * kb,
      y: (dy / dist) * kb
    });
  }

  updateSpike(ball, spike) {
    const dmg = (spike.data.damage || 30);
    if (ball.data && ball.data.hp !== undefined) {
      ball.data.hp -= dmg;
      if (ball.data.hp <= 0) {
        ball.data.hp = 0;
        ball.data.alive = false;
      }
    }

    const kb = spike.data.knockback || 0.025;
    Matter.Body.applyForce(ball.body, ball.body.position, { x: 0, y: -kb });
  }

  updateFan(ball, fan) {
    const force = fan.data.force || 0.005;
    let dx, dy;

    if (fan.data.forceAngle !== undefined) {
      const angle = fan.data.forceAngle * Math.PI / 180;
      dx = Math.cos(angle);
      dy = Math.sin(angle);
    } else if (fan.data.forceDirection) {
      const fd = fan.data.forceDirection;
      const mag = Math.sqrt(fd.x * fd.x + fd.y * fd.y) || 1;
      dx = fd.x / mag;
      dy = fd.y / mag;
    } else {
      const fpos = fan.body.position;
      dx = ball.body.position.x - fpos.x;
      dy = ball.body.position.y - fpos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dist;
      dy /= dist;
    }

    Matter.Body.applyForce(ball.body, ball.body.position, { x: dx * force, y: dy * force });
  }

  updateMagnet(ball, magnet) {
    const mpos = magnet.body.position;
    const bpos = ball.body.position;
    const dx = mpos.x - bpos.x;
    const dy = mpos.y - bpos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = magnet.data.force || 0.008;

    Matter.Body.applyForce(ball.body, ball.body.position, {
      x: (dx / dist) * force,
      y: (dy / dist) * force
    });
  }

  update(dt) {
    if (typeof window.ballManager === "undefined") return;
    const bm = window.ballManager;
    if (!bm) return;

    const balls = typeof bm.getAllBalls === "function" ? bm.getAllBalls() : (bm.balls || []);

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];
      if (!ball || !ball.data || ball.data.alive === false) continue;
      if (!ball.body) continue;

      const bx = ball.body.position.x;
      const by = ball.body.position.y;

      for (let j = 0; j < this.objects.length; j++) {
        const obj = this.objects[j];
        if (!obj.data.active) continue;

        const opos = obj.body.position;
        const dx = bx - opos.x;
        const dy = by - opos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const range = obj.data.range || obj.data.radius || 30;

        if (dist > range) continue;

        switch (obj.type) {
          case "Bumper":
            this.updateBumper(ball, obj);
            break;
          case "Launcher":
            this.updateLauncher(ball, obj);
            break;
          case "SpeedZone":
            this.updateSpeedZone(ball, obj);
            break;
          case "HealZone":
            this.updateHealZone(ball, obj);
            break;
          case "DamageZone":
            this.updateDamageZone(ball, obj);
            break;
          case "Lava":
            this.updateLava(ball, obj);
            break;
          case "Spike":
            this.updateSpike(ball, obj);
            break;
          case "Fan":
            this.updateFan(ball, obj);
            break;
          case "Magnet":
            this.updateMagnet(ball, obj);
            break;
        }
      }
    }
  }

  reset() {
    this.clear();
  }

  clear() {
    for (let i = this.objects.length - 1; i >= 0; i--) {
      Matter.Composite.remove(this.physics.world, this.objects[i].body);
    }
    this.objects = [];
    this.nextId = 1;
  }

  _defaultColor(type) {
    const colors = {
      Bumper: "#ff4444",
      Launcher: "#ff8800",
      SpeedZone: "#ffff00",
      HealZone: "#44ff44",
      DamageZone: "#ff0066",
      Lava: "#ff2200",
      Spike: "#cc0000",
      Fan: "#44ccff",
      Magnet: "#aa44ff"
    };
    return colors[type] || "#ffffff";
  }

  _defaultForce(type) {
    const forces = {
      Bumper: 0.015,
      Launcher: 0.02,
      Fan: 0.005,
      Magnet: 0.008
    };
    return forces[type] || 0.01;
  }

  _defaultDamage(type) {
    const dmg = {
      DamageZone: 10,
      Lava: 25,
      Spike: 30
    };
    return dmg[type] || 5;
  }

  _defaultKnockback(type) {
    const kb = {
      Lava: 0.02,
      Spike: 0.025
    };
    return kb[type] || 0.01;
  }
};
