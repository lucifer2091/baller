window.PhysicsEngine = class PhysicsEngine {
  constructor() {
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.gravity.y = 1;
    this.engine.gravity.x = 0;
    this.collisionCallbacks = [];
    this.bodies = [];
    this.ballBodies = [];
    this.blockBodies = [];
    this.wallBodies = [];
    this.specialBodies = [];
    this.specialObjects = [];
    this._bodyIdCounter = 0;
    this._setupCollisions();
  }

  _setupCollisions() {
    var self = this;
    Matter.Events.on(this.engine, "collisionStart", function (event) {
      var pairs = event.pairs;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var bodyA = pair.bodyA;
        var bodyB = pair.bodyB;
        self._handleCollision(bodyA, bodyB, "start");
      }
    });
    Matter.Events.on(this.engine, "collisionActive", function (event) {
      var pairs = event.pairs;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var bodyA = pair.bodyA;
        var bodyB = pair.bodyB;
        self._handleCollision(bodyA, bodyB, "active");
      }
    });
    Matter.Events.on(this.engine, "collisionEnd", function (event) {
      var pairs = event.pairs;
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var bodyA = pair.bodyA;
        var bodyB = pair.bodyB;
        self._handleCollision(bodyA, bodyB, "end");
      }
    });
  }

  _handleCollision(bodyA, bodyB, phase) {
    for (var i = 0; i < this.collisionCallbacks.length; i++) {
      this.collisionCallbacks[i](bodyA, bodyB, phase);
    }
    if (bodyA.gameData && bodyA.gameData.type === "ball" && bodyB.gameData && bodyB.gameData.type === "ball") {
      this._processBallCollision(bodyA, bodyB);
    }
    if (bodyA.gameData && bodyA.gameData.type === "ball" && bodyB.gameData && bodyB.gameData.type === "special") {
      this._processSpecialCollision(bodyA, bodyB);
    }
    if (bodyB.gameData && bodyB.gameData.type === "ball" && bodyA.gameData && bodyA.gameData.type === "special") {
      this._processSpecialCollision(bodyB, bodyA);
    }
    if (bodyA.gameData && bodyA.gameData.type === "ball" && bodyB.gameData && bodyB.gameData.type === "block") {
      this._processBlockCollision(bodyA, bodyB);
    }
    if (bodyB.gameData && bodyB.gameData.type === "ball" && bodyA.gameData && bodyA.gameData.type === "block") {
      this._processBlockCollision(bodyB, bodyA);
    }
  }

  _processBallCollision(ballA, ballB) {
    var dataA = ballA.gameData;
    var dataB = ballB.gameData;
    if (dataA.team === dataB.team) return;
    var damageA = (dataA.damage || 25) * (window.PRESETS ? (window.PRESETS.PHYSICS_PRESETS.Normal ? window.PRESETS.PHYSICS_PRESETS.Normal.damageMultiplier : 1) : 1);
    var damageB = (dataB.damage || 25) * (window.PRESETS ? (window.PRESETS.PHYSICS_PRESETS.Normal ? window.PRESETS.PHYSICS_PRESETS.Normal.damageMultiplier : 1) : 1);
    var isCritA = Math.random() < (dataA.critChance || 0.05);
    var isCritB = Math.random() < (dataB.critChance || 0.05);
    if (isCritA) damageA *= (dataA.critMultiplier || 2);
    if (isCritB) damageB *= (dataB.critMultiplier || 2);
    dataB.hp -= damageA;
    dataA.hp -= damageB;
    var dx = ballB.position.x - ballA.position.x;
    var dy = ballB.position.y - ballA.position.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = dx / dist;
    var ny = dy / dist;
    var kbMultiplier = window.PRESETS ? (window.PRESETS.PHYSICS_PRESETS.Normal ? window.PRESETS.PHYSICS_PRESETS.Normal.knockbackMultiplier : 1) : 1;
    var kbA = (dataA.knockback || 25) * kbMultiplier;
    var kbB = (dataB.knockback || 25) * kbMultiplier;
    Matter.Body.applyForce(ballA, ballA.position, { x: -nx * kbA * 0.001, y: -ny * kbA * 0.001 });
    Matter.Body.applyForce(ballB, ballB.position, { x: nx * kbB * 0.001, y: ny * kbB * 0.001 });
    if (isCritA || isCritB) {
      dataA.lastCrit = isCritA;
      dataB.lastCrit = isCritB;
    }
    if (dataB.hp <= 0) {
      dataB.alive = false;
    }
    if (dataA.hp <= 0) {
      dataA.alive = false;
    }
  }

  _processSpecialCollision(ballBody, specialBody) {
    var special = specialBody.gameData;
    var ball = ballBody.gameData;
    switch (special.subType) {
      case "Bumper":
        var dx = ballBody.position.x - specialBody.position.x;
        var dy = ballBody.position.y - specialBody.position.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var force = special.force || 0.05;
        Matter.Body.applyForce(ballBody, ballBody.position, { x: (dx / dist) * force, y: (dy / dist) * force });
        break;
      case "Launcher":
        var dir = special.direction || "up";
        var launchForce = special.force || 0.05;
        var fx = 0, fy = 0;
        if (dir === "up") fy = -launchForce;
        else if (dir === "down") fy = launchForce;
        else if (dir === "left") fx = -launchForce;
        else if (dir === "right") fx = launchForce;
        Matter.Body.applyForce(ballBody, ballBody.position, { x: fx, y: fy });
        break;
      case "HealZone":
        ball.hp = Math.min(ball.maxHp, (ball.hp || 0) + (special.healRate || 2));
        break;
      case "DamageZone":
        ball.hp -= special.damageRate || 5;
        if (ball.hp <= 0) ball.alive = false;
        break;
      case "Lava":
        ball.hp -= special.damage || 50;
        if (ball.hp <= 0) ball.alive = false;
        break;
      case "Spike":
        if (!ball._spikeHit) {
          ball.hp -= special.damage || 30;
          ball._spikeHit = true;
          var sdx = ballBody.position.x - specialBody.position.x;
          var sdy = ballBody.position.y - specialBody.position.y;
          var sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
          Matter.Body.applyForce(ballBody, ballBody.position, { x: (sdx / sdist) * 0.03, y: (sdy / sdist) * 0.03 });
          if (ball.hp <= 0) ball.alive = false;
          var bd = ball;
          setTimeout(function () { bd._spikeHit = false; }, 200);
        }
        break;
      case "Fan":
        var fdir = special.direction || "up";
        var ffx = 0, ffy = 0;
        var fStrength = special.force || 0.002;
        if (fdir === "up") ffy = -fStrength;
        else if (fdir === "down") ffy = fStrength;
        else if (fdir === "left") ffx = -fStrength;
        else if (fdir === "right") ffx = fStrength;
        Matter.Body.applyForce(ballBody, ballBody.position, { x: ffx, y: ffy });
        break;
      case "Magnet":
        var mdx = specialBody.position.x - ballBody.position.x;
        var mdy = specialBody.position.y - ballBody.position.y;
        var mDist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
        var mForce = special.force || 0.001;
        if (special.attract) {
          Matter.Body.applyForce(ballBody, ballBody.position, { x: (mdx / mDist) * mForce, y: (mdy / mDist) * mForce });
        } else {
          Matter.Body.applyForce(ballBody, ballBody.position, { x: -(mdx / mDist) * mForce, y: -(mdy / mDist) * mForce });
        }
        break;
      case "SpeedZone":
        var vx = ballBody.velocity.x * (special.speedBoost || 2);
        var vy = ballBody.velocity.y * (special.speedBoost || 2);
        Matter.Body.setVelocity(ballBody, { x: vx, y: vy });
        break;
    }
  }

  _processBlockCollision(ballBody, blockBody) {
    var block = blockBody.gameData;
    if (!block.breakable) return;
    var ballData = ballBody.gameData;
    var impactForce = Math.sqrt(
      ballBody.velocity.x * ballBody.velocity.x +
      ballBody.velocity.y * ballBody.velocity.y
    );
    var damage = impactForce * 2 + (ballData.damage || 0) * 0.5;
    block.hp -= damage;
    if (block.hp <= 0) {
      block.broken = true;
      if (block.subType === "Explosive") {
        this._explodeBlock(blockBody);
      }
      Matter.World.remove(this.world, blockBody);
      var idx = this.blockBodies.indexOf(blockBody);
      if (idx !== -1) this.blockBodies.splice(idx, 1);
      var bidx = this.bodies.indexOf(blockBody);
      if (bidx !== -1) this.bodies.splice(bidx, 1);
    }
  }

  _explodeBlock(blockBody) {
    var pos = blockBody.position;
    var radius = 80;
    var allBodies = this.bodies;
    for (var i = 0; i < allBodies.length; i++) {
      var b = allBodies[i];
      if (b === blockBody) continue;
      var dx = b.position.x - pos.x;
      var dy = b.position.y - pos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist > 0) {
        var force = 0.03 * (1 - dist / radius);
        Matter.Body.applyForce(b, b.position, { x: (dx / dist) * force, y: (dy / dist) * force });
        if (b.gameData && b.gameData.type === "ball") {
          b.gameData.hp -= 40 * (1 - dist / radius);
          if (b.gameData.hp <= 0) b.gameData.alive = false;
        }
        if (b.gameData && b.gameData.type === "block" && b.gameData.breakable) {
          b.gameData.hp -= 60 * (1 - dist / radius);
          if (b.gameData.hp <= 0) {
            b.gameData.broken = true;
            Matter.World.remove(this.world, b);
            var bi = this.bodies.indexOf(b);
            if (bi !== -1) this.bodies.splice(bi, 1);
            var bbi = this.blockBodies.indexOf(b);
            if (bbi !== -1) this.blockBodies.splice(bbi, 1);
          }
        }
      }
    }
  }

  setGravity(scale) {
    this.engine.gravity.y = scale;
    this.engine.gravity.x = 0;
  }

  setFriction(value) {
    this.engine.gravity.friction = value;
    var allBodies = this.bodies;
    for (var i = 0; i < allBodies.length; i++) {
      allBodies[i].friction = value;
    }
  }

  setBounce(value) {
    var allBodies = this.bodies;
    for (var i = 0; i < allBodies.length; i++) {
      allBodies[i].restitution = value;
    }
  }

  addBall(x, y, radius, options) {
    options = options || {};
    var id = this._bodyIdCounter++;
    var body = Matter.Bodies.circle(x, y, radius || 25, {
      restitution: options.bounce !== undefined ? options.bounce : 0.6,
      friction: options.friction !== undefined ? options.friction : 0.3,
      density: (options.mass || 5) / 1000,
      frictionAir: 0.01,
      label: "ball_" + id
    });
    body.gameData = {
      type: "ball",
      id: id,
      name: options.name || "Ball",
      hp: options.hp !== undefined ? options.hp : 500,
      maxHp: options.maxHp !== undefined ? options.maxHp : 500,
      damage: options.damage || 25,
      speed: options.speed || 3,
      size: radius || options.size || 25,
      mass: options.mass || 5,
      team: options.team || "Red",
      ai: options.ai || "Aggressive",
      color: options.color || "#ff5050",
      weaponType: options.weaponType || "Sword",
      critChance: options.critChance || 0.05,
      critMultiplier: options.critMultiplier || 2,
      knockback: options.knockback || 25,
      alive: true,
      lastCrit: false,
      _spikeHit: false,
      aiState: null,
      aiTarget: null,
      attackCooldown: 0,
      lastDamageTime: 0
    };
    Matter.World.add(this.world, body);
    this.bodies.push(body);
    this.ballBodies.push(body);
    return body;
  }

  addBlock(x, y, width, height, options) {
    options = options || {};
    var blockType = options.type || "Brick";
    var blockConfig = (window.PRESETS && window.PRESETS.BLOCK_TYPES && window.PRESETS.BLOCK_TYPES[blockType]) || {};
    var hp = options.hp !== undefined ? options.hp : (blockConfig.hp || 200);
    var body = Matter.Bodies.rectangle(x, y, width || 40, height || 40, {
      isStatic: true,
      restitution: options.bounciness !== undefined ? options.bounciness : (blockConfig.bounciness || 0.3),
      friction: 0.5,
      density: options.density !== undefined ? options.density : (blockConfig.density || 2),
      label: "block_" + this._bodyIdCounter++
    });
    body.gameData = {
      type: "block",
      id: this._bodyIdCounter++,
      subType: blockType,
      hp: hp,
      maxHp: hp,
      breakable: options.breakable !== undefined ? options.breakable : (blockConfig.breakable !== undefined ? blockConfig.breakable : true),
      color: options.color || blockConfig.color || "#b35900",
      broken: false
    };
    Matter.World.add(this.world, body);
    this.bodies.push(body);
    this.blockBodies.push(body);
    return body;
  }

  addWall(x, y, width, height, options) {
    options = options || {};
    var body = Matter.Bodies.rectangle(x, y, width || 50, height || 50, {
      isStatic: true,
      restitution: 0.3,
      friction: 0.5,
      label: "wall_" + this._bodyIdCounter++,
      isSensor: options.deathWall || false
    });
    body.gameData = {
      type: "wall",
      id: this._bodyIdCounter++,
      subType: options.deathWall ? "DeathWall" : "SolidWall"
    };
    Matter.World.add(this.world, body);
    this.bodies.push(body);
    this.wallBodies.push(body);
    return body;
  }

  addSpecialObject(x, y, type, options) {
    options = options || {};
    var specialConfig = (window.PRESETS && window.PRESETS.SPECIAL_OBJECTS && window.PRESETS.SPECIAL_OBJECTS[type]) || {};
    var radius = options.radius || specialConfig.radius || 25;
    var isStatic = options.isStatic !== undefined ? options.isStatic : true;
    var body;
    if (isStatic) {
      body = Matter.Bodies.circle(x, y, radius, {
        isStatic: true,
        restitution: specialConfig.bounciness || 0.5,
        friction: 0.5,
        label: "special_" + type + "_" + this._bodyIdCounter++,
        isSensor: (type === "HealZone" || type === "DamageZone" || type === "SpeedZone" || type === "Fan" || type === "Magnet")
      });
    } else {
      body = Matter.Bodies.circle(x, y, radius, {
        restitution: specialConfig.bounciness || 0.5,
        friction: 0.5,
        density: 0.01,
        label: "special_" + type + "_" + this._bodyIdCounter++
      });
    }
    body.gameData = {
      type: "special",
      id: this._bodyIdCounter++,
      subType: type,
      color: options.color || specialConfig.color || "#ff69b4",
      radius: radius,
      force: options.force || specialConfig.force || 0,
      direction: options.direction || specialConfig.direction || "up",
      speedBoost: options.speedBoost || specialConfig.speedBoost || 1,
      healRate: options.healRate || specialConfig.healRate || 0,
      damageRate: options.damageRate || specialConfig.damageRate || 0,
      damage: options.damage || specialConfig.damage || 0,
      attract: options.attract !== undefined ? options.attract : (specialConfig.attract !== undefined ? specialConfig.attract : true)
    };
    Matter.World.add(this.world, body);
    this.bodies.push(body);
    this.specialBodies.push(body);
    this.specialObjects.push(body);
    return body;
  }

  removeBody(body) {
    Matter.World.remove(this.world, body);
    var idx = this.bodies.indexOf(body);
    if (idx !== -1) this.bodies.splice(idx, 1);
    var bIdx = this.ballBodies.indexOf(body);
    if (bIdx !== -1) this.ballBodies.splice(bIdx, 1);
    var blkIdx = this.blockBodies.indexOf(body);
    if (blkIdx !== -1) this.blockBodies.splice(blkIdx, 1);
    var wIdx = this.wallBodies.indexOf(body);
    if (wIdx !== -1) this.wallBodies.splice(wIdx, 1);
    var sIdx = this.specialBodies.indexOf(body);
    if (sIdx !== -1) this.specialBodies.splice(sIdx, 1);
    var soIdx = this.specialObjects.indexOf(body);
    if (soIdx !== -1) this.specialObjects.splice(soIdx, 1);
  }

  applyForce(body, forceX, forceY) {
    Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
  }

  setVelocity(body, vx, vy) {
    Matter.Body.setVelocity(body, { x: vx, y: vy });
  }

  getBodies() {
    return this.bodies;
  }

  getBalls() {
    return this.ballBodies;
  }

  getBlocks() {
    return this.blockBodies;
  }

  step(delta) {
    Matter.Engine.update(this.engine, delta || 16.666);
    this._cleanupDead();
  }

  _cleanupDead() {
    var toRemove = [];
    for (var i = this.ballBodies.length - 1; i >= 0; i--) {
      var ball = this.ballBodies[i];
      if (ball.gameData && ball.gameData.hp <= 0) {
        ball.gameData.alive = false;
        toRemove.push(ball);
      }
    }
    for (var i = this.blockBodies.length - 1; i >= 0; i--) {
      var block = this.blockBodies[i];
      if (block.gameData && block.gameData.broken) {
        toRemove.push(block);
      }
    }
    for (var j = 0; j < toRemove.length; j++) {
      this.removeBody(toRemove[j]);
    }
  }

  clear() {
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
    this.engine.gravity.y = 1;
    this.engine.gravity.x = 0;
    this.bodies = [];
    this.ballBodies = [];
    this.blockBodies = [];
    this.wallBodies = [];
    this.specialBodies = [];
    this.specialObjects = [];
    this.collisionCallbacks = [];
    this._bodyIdCounter = 0;
  }

  onCollision(callback) {
    if (typeof callback === "function") {
      this.collisionCallbacks.push(callback);
    }
  }

  applyPhysicsPreset(presetName) {
    if (!window.PRESETS || !window.PRESETS.PHYSICS_PRESETS) return;
    var preset = window.PRESETS.PHYSICS_PRESETS[presetName];
    if (!preset) return;
    this.setGravity(preset.gravity);
    this.setFriction(preset.friction);
    this.setBounce(preset.restitution);
  }

  createBoundaryWalls(width, height, type) {
    var thickness = 40;
    var wallOptions = {};
    if (type === "DeathWall") {
      wallOptions.deathWall = true;
    }
    var top = this.addWall(width / 2, -thickness / 2, width + thickness * 2, thickness, wallOptions);
    var bottom = this.addWall(width / 2, height + thickness / 2, width + thickness * 2, thickness, wallOptions);
    var left = this.addWall(-thickness / 2, height / 2, thickness, height + thickness * 2, wallOptions);
    var right = this.addWall(width + thickness / 2, height / 2, thickness, height + thickness * 2, wallOptions);
    return { top: top, bottom: bottom, left: left, right: right };
  }

  handleWraparound(width, height) {
    var balls = this.ballBodies;
    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      var pos = b.position;
      var vel = b.velocity;
      if (pos.x < -50) {
        Matter.Body.setPosition(b, { x: width + 50, y: pos.y });
      } else if (pos.x > width + 50) {
        Matter.Body.setPosition(b, { x: -50, y: pos.y });
      }
      if (pos.y < -50) {
        Matter.Body.setPosition(b, { x: pos.x, y: height + 50 });
      } else if (pos.y > height + 50) {
        Matter.Body.setPosition(b, { x: pos.x, y: -50 });
      }
    }
  }

  updateSpecialObjects(delta) {
    var balls = this.ballBodies;
    var specials = this.specialObjects;
    for (var i = 0; i < specials.length; i++) {
      var sp = specials[i];
      var spData = sp.gameData;
      if (!spData) continue;
      if (spData.subType === "Fan" || spData.subType === "Magnet") {
        var radius = spData.radius || 100;
        for (var j = 0; j < balls.length; j++) {
          var ball = balls[j];
          var dx = ball.position.x - sp.position.x;
          var dy = ball.position.y - sp.position.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius && dist > 0) {
            var forceMult = 1 - dist / radius;
            if (spData.subType === "Fan") {
              var fdir = spData.direction || "up";
              var ffx = 0, ffy = 0;
              var fStrength = (spData.force || 0.002) * forceMult;
              if (fdir === "up") ffy = -fStrength;
              else if (fdir === "down") ffy = fStrength;
              else if (fdir === "left") ffx = -fStrength;
              else if (fdir === "right") ffx = fStrength;
              Matter.Body.applyForce(ball, ball.position, { x: ffx, y: ffy });
            } else if (spData.subType === "Magnet") {
              var mForce = (spData.force || 0.001) * forceMult;
              var mdx = sp.position.x - ball.position.x;
              var mdy = sp.position.y - ball.position.y;
              var mDist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
              if (spData.attract) {
                Matter.Body.applyForce(ball, ball.position, { x: (mdx / mDist) * mForce, y: (mdy / mDist) * mForce });
              } else {
                Matter.Body.applyForce(ball, ball.position, { x: -(mdx / mDist) * mForce, y: -(mdy / mDist) * mForce });
              }
            }
          }
        }
      }
      if (spData.subType === "HealZone" || spData.subType === "DamageZone") {
        var hRadius = spData.radius || 70;
        for (var j = 0; j < balls.length; j++) {
          var ball = balls[j];
          var dx = ball.position.x - sp.position.x;
          var dy = ball.position.y - sp.position.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < hRadius) {
            if (spData.subType === "HealZone") {
              ball.gameData.hp = Math.min(ball.gameData.maxHp, ball.gameData.hp + (spData.healRate || 2));
            } else {
              ball.gameData.hp -= spData.damageRate || 5;
              if (ball.gameData.hp <= 0) ball.gameData.alive = false;
            }
          }
        }
      }
      if (spData.subType === "Regenerating") {
        var blocks = this.blockBodies;
        for (var k = 0; k < blocks.length; k++) {
          var block = blocks[k];
          if (block.gameData && block.gameData.subType === "Regenerating" && block.gameData.hp < block.gameData.maxHp) {
            block.gameData.hp = Math.min(block.gameData.maxHp, block.gameData.hp + 0.5);
          }
        }
      }
    }
  }
};
