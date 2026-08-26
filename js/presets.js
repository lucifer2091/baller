window.PRESETS = {
  BALL_DEFAULTS: {
    name: "Ball",
    hp: 100,
    maxHp: 100,
    damage: 1,
    speed: 3,
    size: 25,
    mass: 5,
    bounce: 0.6,
    friction: 0.3,
    team: "Red",
    ai: "Aggressive",
    color: "#ff5050",
    weaponType: "Sword",
    critChance: 0.05,
    critMultiplier: 2,
    knockback: 25
  },

  BALL_PRESETS: {
    Basic: {
      name: "Basic",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 3,
      size: 25,
      mass: 5,
      bounce: 0.6,
      friction: 0.3,
      ai: "Aggressive",
      weaponType: "Sword",
      color: "#ff5050",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 25,
      description: "Standard all-around fighter"
    },
    Sword: {
      name: "Sword",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 3.5,
      size: 25,
      mass: 5,
      bounce: 0.6,
      friction: 0.3,
      ai: "Melee",
      weaponType: "Sword",
      color: "#ff6464",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 30,
      description: "+1 damage per hit"
    },
    Hammer: {
      name: "Hammer",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 2,
      size: 30,
      mass: 8,
      bounce: 0.4,
      friction: 0.5,
      ai: "Melee",
      weaponType: "Hammer",
      color: "#e91e9c",
      critChance: 0.05,
      critMultiplier: 3,
      knockback: 50,
      description: "+1 rot speed & dmg per hit, resets on parry"
    },
    Laser: {
      name: "Laser",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 2.5,
      size: 20,
      mass: 3,
      bounce: 0.3,
      friction: 0.2,
      ai: "Ranged",
      weaponType: "Laser",
      color: "#00b4d8",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 10,
      description: "Ranged energy shooter"
    },
    Bomber: {
      name: "Bomber",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 2.8,
      size: 24,
      mass: 4,
      bounce: 0.7,
      friction: 0.2,
      ai: "Aggressive",
      weaponType: "Cannon",
      color: "#ff8800",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 60,
      description: "+0.5 fireball dmg & size per hit"
    },
    Speed: {
      name: "Speed",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 6,
      size: 18,
      mass: 2,
      bounce: 0.8,
      friction: 0.1,
      ai: "Random",
      weaponType: "Dagger",
      color: "#e0e0e0",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 15,
      description: "+3.75 attack speed per hit"
    },
    Tank: {
      name: "Tank",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 1.5,
      size: 35,
      mass: 12,
      bounce: 0.3,
      friction: 0.6,
      ai: "Guard",
      weaponType: "Shield",
      color: "#8b6914",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 10,
      description: "Gets wider on parry, reflects attacks"
    },
    Berserker: {
      name: "Berserker",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 4,
      size: 23,
      mass: 5,
      bounce: 0.6,
      friction: 0.3,
      ai: "Berserker",
      weaponType: "Axe",
      color: "#a0522d",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 35,
      description: "+0.5 length & damage per hit"
    },
    Scout: {
      name: "Scout",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 3,
      size: 25,
      mass: 4,
      bounce: 0.6,
      friction: 0.3,
      ai: "Aggressive",
      weaponType: "Spear",
      color: "#a0522d",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 20,
      description: "+0.5 range & damage per hit"
    },
    Archer: {
      name: "Archer",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 3,
      size: 22,
      mass: 3,
      bounce: 0.5,
      friction: 0.3,
      ai: "Ranged",
      weaponType: "Bow",
      color: "#8b4513",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 15,
      description: "+1 arrow count per hit"
    },
    Assassin: {
      name: "Assassin",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 4.5,
      size: 20,
      mass: 3,
      bounce: 0.7,
      friction: 0.2,
      ai: "Aggressive",
      weaponType: "Dagger",
      color: "#e0e0e0",
      critChance: 0.1,
      critMultiplier: 2,
      knockback: 12,
      description: "+3.75 attack speed per hit"
    },
    Juggernaut: {
      name: "Juggernaut",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 2,
      size: 28,
      mass: 7,
      bounce: 0.5,
      friction: 0.4,
      ai: "Guard",
      weaponType: "Shield",
      color: "#4682b4",
      critChance: 0.05,
      critMultiplier: 2,
      knockback: 20,
      description: "Widens on parry, reflects attacks"
    },
    Swarm: {
      name: "Swarm",
      hp: 100,
      maxHp: 100,
      damage: 1,
      speed: 4.5,
      size: 12,
      mass: 1,
      bounce: 0.9,
      friction: 0.1,
      ai: "Aggressive",
      weaponType: "Dagger",
      color: "#fca311",
      critChance: 0.05,
      critMultiplier: 1.5,
      knockback: 8,
      description: "Tiny weak units that swarm"
    }
  },

  WEAPON_TYPES: {
    Sword: {
      damage: 1,
      size: 30,
      range: 45,
      attackSpeed: 1.0,
      knockback: 30,
      behavior: "sweep",
      color: "#c0c0c0",
      description: "+1 damage per hit"
    },
    Hammer: {
      damage: 1,
      size: 35,
      range: 40,
      attackSpeed: 0.6,
      knockback: 55,
      behavior: "sweep",
      color: "#8b5e3c",
      description: "+1 rot speed & dmg per hit, resets on parry"
    },
    Axe: {
      damage: 1,
      size: 28,
      range: 42,
      attackSpeed: 0.8,
      knockback: 40,
      behavior: "sweep",
      color: "#6b4c3b",
      description: "+0.5 length & damage per hit"
    },
    Spear: {
      damage: 1,
      size: 25,
      range: 65,
      attackSpeed: 0.9,
      knockback: 25,
      behavior: "sweep",
      color: "#a0522d",
      description: "+0.5 range & damage per hit"
    },
    Laser: {
      damage: 1,
      size: 15,
      range: 250,
      attackSpeed: 1.5,
      knockback: 10,
      behavior: "shoot",
      color: "#00b4d8",
      description: "Fast energy projectile"
    },
    Cannon: {
      damage: 1,
      size: 20,
      range: 200,
      attackSpeed: 0.4,
      knockback: 60,
      behavior: "shoot",
      color: "#ff8800",
      description: "+0.5 fireball dmg & size per hit"
    },
    Bow: {
      damage: 1,
      size: 12,
      range: 220,
      attackSpeed: 1.2,
      knockback: 15,
      behavior: "shoot",
      color: "#8b4513",
      description: "+1 arrow count per hit"
    },
    Dagger: {
      damage: 1,
      size: 18,
      range: 30,
      attackSpeed: 2.0,
      knockback: 12,
      behavior: "sweep",
      color: "#e0e0e0",
      description: "+3.75 attack speed per hit"
    },
    Shield: {
      damage: 1,
      size: 40,
      range: 35,
      attackSpeed: 0.5,
      knockback: 45,
      behavior: "orbit",
      color: "#4682b4",
      description: "Gets wider on parry, reflects"
    },
    Projectile: {
      damage: 1,
      size: 10,
      range: 180,
      attackSpeed: 1.0,
      knockback: 20,
      behavior: "shoot",
      color: "#ffd700",
      description: "Generic projectile"
    },
    None: { damage: 0, speed: 0, size: 0 }
  },

  BLOCK_TYPES: {
    Brick: {
      name: "Brick",
      hp: 200,
      maxHp: 200,
      color: "#b35900",
      breakable: true,
      bounciness: 0.3,
      density: 2.0,
      description: "Standard breakable block"
    },
    Stone: {
      name: "Stone",
      hp: 400,
      maxHp: 400,
      color: "#808080",
      breakable: true,
      bounciness: 0.2,
      density: 3.0,
      description: "Tough stone block"
    },
    Metal: {
      name: "Metal",
      hp: 800,
      maxHp: 800,
      color: "#a0a0b0",
      breakable: true,
      bounciness: 0.1,
      density: 5.0,
      description: "Very tough metal block"
    },
    Glass: {
      name: "Glass",
      hp: 100,
      maxHp: 100,
      color: "#b0e0e6",
      breakable: true,
      bounciness: 0.5,
      density: 1.0,
      description: "Fragile transparent block"
    },
    Rubber: {
      name: "Rubber",
      hp: 150,
      maxHp: 150,
      color: "#2ecc71",
      breakable: true,
      bounciness: 0.95,
      density: 0.8,
      description: "Super bouncy block"
    },
    Ice: {
      name: "Ice",
      hp: 120,
      maxHp: 120,
      color: "#add8e6",
      breakable: true,
      bounciness: 0.4,
      density: 1.5,
      description: "Slippery low-friction block"
    },
    Explosive: {
      name: "Explosive",
      hp: 80,
      maxHp: 80,
      color: "#ff4444",
      breakable: true,
      bounciness: 0.3,
      density: 1.5,
      description: "Explodes on destruction"
    },
    Regenerating: {
      name: "Regenerating",
      hp: 300,
      maxHp: 300,
      color: "#7b68ee",
      breakable: true,
      bounciness: 0.3,
      density: 2.0,
      description: "Slowly regenerates HP"
    },
    Indestructible: {
      name: "Indestructible",
      hp: Infinity,
      maxHp: Infinity,
      color: "#333333",
      breakable: false,
      bounciness: 0.3,
      density: 10.0,
      description: "Cannot be destroyed"
    },
    GiantBlock: {
      name: "GiantBlock",
      hp: 2000,
      maxHp: 2000,
      color: "#8b0000",
      breakable: true,
      bounciness: 0.2,
      density: 4.0,
      description: "Massive destructible block"
    }
  },

  AI_BEHAVIORS: {
    Aggressive: "Aggressive",
    Defensive: "Defensive",
    Random: "Random",
    Ranged: "Ranged",
    Melee: "Melee",
    Coward: "Coward",
    Guard: "Guard",
    Berserker: "Berserker",
    Passive: "Passive"
  },

  ARENA_PRESETS: {
    "Classic Box": {
      name: "Classic Box",
      width: 200,
      height: 200,
      description: "Small 7x7 ball-size arena",
      gravity: 1,
      generateBlocks: function (w, h) {
        var blocks = [];
        var bSize = 40;
        var cols = Math.floor(w / bSize);
        var rows = Math.floor(h / bSize);
        for (var i = 0; i < cols; i++) {
          blocks.push({ x: i * bSize + bSize / 2, y: bSize / 2, w: bSize, h: bSize, type: "Brick" });
          blocks.push({ x: i * bSize + bSize / 2, y: h - bSize / 2, w: bSize, h: bSize, type: "Brick" });
        }
        for (var j = 1; j < rows - 1; j++) {
          blocks.push({ x: bSize / 2, y: j * bSize + bSize / 2, w: bSize, h: bSize, type: "Brick" });
          blocks.push({ x: w - bSize / 2, y: j * bSize + bSize / 2, w: bSize, h: bSize, type: "Brick" });
        }
        return blocks;
      }
    },
    "Brick Factory": {
      name: "Brick Factory",
      width: 1200,
      height: 800,
      description: "Interior filled with breakable bricks",
      gravity: 1,
      generateBlocks: function (w, h) {
        var blocks = [];
        var bSize = 40;
        for (var row = 2; row < Math.floor(h / bSize) - 2; row += 3) {
          for (var col = 2; col < Math.floor(w / bSize) - 2; col += 4) {
            blocks.push({ x: col * bSize + bSize / 2, y: row * bSize + bSize / 2, w: bSize, h: bSize, type: "Brick" });
          }
        }
        return blocks;
      }
    },
    "Circle Arena": {
      name: "Circle Arena",
      width: 1200,
      height: 800,
      description: "Circular arena made of stone blocks",
      gravity: 1,
      generateBlocks: function (w, h) {
        var blocks = [];
        var cx = w / 2;
        var cy = h / 2;
        var radius = Math.min(w, h) / 2 - 40;
        var numBlocks = 48;
        for (var i = 0; i < numBlocks; i++) {
          var angle = (i / numBlocks) * Math.PI * 2;
          var x = cx + Math.cos(angle) * radius;
          var y = cy + Math.sin(angle) * radius;
          blocks.push({ x: x, y: y, w: 30, h: 30, type: "Stone" });
        }
        return blocks;
      }
    },
    "Maze": {
      name: "Maze",
      width: 1200,
      height: 800,
      description: "Complex maze of walls",
      gravity: 0.5,
      generateBlocks: function (w, h) {
        var blocks = [];
        var bSize = 40;
        var cols = Math.floor(w / bSize);
        var rows = Math.floor(h / bSize);
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            if ((r + c) % 3 === 0 || (r * 2 + c) % 5 === 0) {
              blocks.push({ x: c * bSize + bSize / 2, y: r * bSize + bSize / 2, w: bSize, h: bSize, type: "Brick" });
            }
          }
        }
        return blocks;
      }
    },
    "Tower Arena": {
      name: "Tower Arena",
      width: 1200,
      height: 800,
      description: "Central tower with surrounding platforms",
      gravity: 1,
      generateBlocks: function (w, h) {
        var blocks = [];
        var bSize = 40;
        var cx = w / 2;
        var cy = h / 2;
        for (var i = -3; i <= 3; i++) {
          blocks.push({ x: cx + i * bSize, y: cy, w: bSize, h: bSize, type: "Stone" });
          blocks.push({ x: cx + i * bSize, y: cy - bSize, w: bSize, h: bSize, type: "Stone" });
        }
        for (var level = 0; level < 3; level++) {
          var platW = 5;
          var platX = level % 2 === 0 ? w * 0.2 : w * 0.8;
          for (var p = 0; p < platW; p++) {
            blocks.push({ x: platX + p * bSize, y: h * 0.25 + level * 120, w: bSize, h: bSize, type: "Metal" });
          }
        }
        return blocks;
      }
    },
    "Pinball": {
      name: "Pinball",
      width: 1200,
      height: 800,
      description: "Bumpers and launchers everywhere",
      gravity: 1.5,
      generateBlocks: function (w, h) {
        var blocks = [];
        var bSize = 30;
        for (var i = 0; i < 8; i++) {
          for (var j = 0; j < 5; j++) {
            if ((i + j) % 2 === 0) {
              blocks.push({ x: w * 0.2 + i * (w * 0.08), y: h * 0.2 + j * (h * 0.15), w: bSize, h: bSize, type: "Rubber" });
            }
          }
        }
        return blocks;
      }
    },
    "Death Pit": {
      name: "Death Pit",
      width: 1200,
      height: 800,
      description: "Platform over deadly lava pit",
      gravity: 1,
      generateBlocks: function (w, h) {
        var blocks = [];
        var bSize = 40;
        for (var i = 0; i < Math.floor(w / bSize); i++) {
          blocks.push({ x: i * bSize + bSize / 2, y: h - 80, w: bSize, h: bSize, type: "Stone" });
          blocks.push({ x: i * bSize + bSize / 2, y: h - 40, w: bSize, h: bSize, type: "Explosive" });
        }
        for (var p = 0; p < 4; p++) {
          var pw = 8;
          var px = w * 0.1 + p * (w * 0.25);
          for (var b = 0; b < pw; b++) {
            blocks.push({ x: px + b * bSize, y: h * 0.4 + (p % 2) * 60, w: bSize, h: bSize, type: "Brick" });
          }
        }
        return blocks;
      }
    },
    "Block City": {
      name: "Block City",
      width: 1200,
      height: 800,
      description: "Cityscape of block buildings",
      gravity: 1,
      generateBlocks: function (w, h) {
        var blocks = [];
        var bSize = 30;
        var buildings = [
          { x: 100, bh: 8, bw: 4 },
          { x: 300, bh: 12, bw: 3 },
          { x: 500, bh: 6, bw: 5 },
          { x: 700, bh: 10, bw: 4 },
          { x: 900, bh: 7, bw: 3 },
          { x: 1050, bh: 9, bw: 4 }
        ];
        buildings.forEach(function (b) {
          for (var row = 0; row < b.bh; row++) {
            for (var col = 0; col < b.bw; col++) {
              blocks.push({
                x: b.x + col * bSize,
                y: h - 40 - row * bSize,
                w: bSize,
                h: bSize,
                type: row < 2 ? "Metal" : row < 4 ? "Stone" : "Brick"
              });
            }
          }
        });
        return blocks;
      }
    },
    "Space": {
      name: "Space",
      width: 1200,
      height: 800,
      description: "Zero gravity asteroid field",
      gravity: 0,
      generateBlocks: function (w, h) {
        var blocks = [];
        for (var i = 0; i < 20; i++) {
          blocks.push({
            x: 100 + Math.random() * (w - 200),
            y: 100 + Math.random() * (h - 200),
            w: 20 + Math.random() * 40,
            h: 20 + Math.random() * 40,
            type: ["Stone", "Metal", "Glass"][Math.floor(Math.random() * 3)]
          });
        }
        return blocks;
      }
    },
    "Chaos": {
      name: "Chaos",
      width: 1200,
      height: 800,
      description: "Random mix of everything",
      gravity: 1,
      generateBlocks: function (w, h) {
        var blocks = [];
        var types = ["Brick", "Stone", "Metal", "Glass", "Rubber", "Ice", "Explosive", "Regenerating"];
        for (var i = 0; i < 40; i++) {
          blocks.push({
            x: 80 + Math.random() * (w - 160),
            y: 80 + Math.random() * (h - 160),
            w: 25 + Math.random() * 35,
            h: 25 + Math.random() * 35,
            type: types[Math.floor(Math.random() * types.length)]
          });
        }
        return blocks;
      }
    }
  },

  SIMULATIONS: {
    "10 Sword vs 10 Hammer": {
      name: "10 Sword vs 10 Hammer",
      description: "Fast swords versus heavy hammers",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastTeamStanding",
      balls: (function () {
        var balls = [];
        for (var i = 0; i < 10; i++) {
          balls.push({ preset: "Sword", x: 200, y: 100 + i * 60, team: "Red" });
        }
        for (var i = 0; i < 10; i++) {
          balls.push({ preset: "Hammer", x: 1000, y: 100 + i * 60, team: "Blue" });
        }
        return balls;
      })(),
      blocks: []
    },
    "Giant Tank vs 50 Tiny": {
      name: "Giant Tank vs 50 Tiny",
      description: "One giant tank versus 50 tiny swarm balls",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastTeamStanding",
      balls: (function () {
        var balls = [];
        balls.push({ preset: "Tank", x: 600, y: 400, team: "Red", overrides: { hp: 5000, maxHp: 5000, size: 60, mass: 30, damage: 80 } });
        for (var i = 0; i < 50; i++) {
          balls.push({ preset: "Swarm", x: 50 + Math.random() * 1100, y: 50 + Math.random() * 700, team: "Blue" });
        }
        return balls;
      })(),
      blocks: []
    },
    "100 Ball Chaos": {
      name: "100 Ball Chaos",
      description: "100 random balls in all-out war",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastBallStanding",
      balls: (function () {
        var balls = [];
        var presets = ["Basic", "Sword", "Hammer", "Laser", "Bomber", "Speed", "Tank", "Berserker", "Shield", "Swarm"];
        var teams = ["Red", "Blue", "Green", "Yellow"];
        for (var i = 0; i < 100; i++) {
          balls.push({
            preset: presets[Math.floor(Math.random() * presets.length)],
            x: 100 + Math.random() * 1000,
            y: 100 + Math.random() * 600,
            team: teams[Math.floor(Math.random() * teams.length)]
          });
        }
        return balls;
      })(),
      blocks: []
    },
    "Boss Battle": {
      name: "Boss Battle",
      description: "Team of fighters versus a super-powered boss",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastTeamStanding",
      balls: (function () {
        var balls = [];
        balls.push({
          preset: "Tank",
          x: 600,
          y: 200,
          team: "Red",
          overrides: { hp: 10000, maxHp: 10000, size: 70, mass: 40, damage: 100, speed: 2 }
        });
        var fighterPresets = ["Sword", "Laser", "Bomber", "Speed", "Berserker"];
        for (var i = 0; i < 15; i++) {
          balls.push({
            preset: fighterPresets[i % fighterPresets.length],
            x: 100 + Math.random() * 400,
            y: 500 + Math.random() * 200,
            team: "Blue"
          });
        }
        return balls;
      })(),
      blocks: []
    },
    "Brick Breaking Race": {
      name: "Brick Breaking Race",
      description: "Two teams race to break through brick walls",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastTeamStanding",
      balls: (function () {
        var balls = [];
        for (var i = 0; i < 8; i++) {
          balls.push({ preset: "Hammer", x: 150, y: 100 + i * 80, team: "Red" });
        }
        for (var i = 0; i < 8; i++) {
          balls.push({ preset: "Hammer", x: 1050, y: 100 + i * 80, team: "Blue" });
        }
        return balls;
      })(),
      blocks: (function () {
        var blocks = [];
        var bSize = 40;
        for (var r = 0; r < 15; r++) {
          for (var c = 0; c < 3; c++) {
            blocks.push({ x: 560 + c * bSize, y: 40 + r * bSize, w: bSize, h: bSize, type: "Brick" });
          }
        }
        return blocks;
      })()
    },
    "Giant Block Boss": {
      name: "Giant Block Boss",
      description: "Fighters versus a giant destructible block boss",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastTeamStanding",
      balls: (function () {
        var balls = [];
        for (var i = 0; i < 20; i++) {
          balls.push({
            preset: "Sword",
            x: 100 + Math.random() * 300,
            y: 400 + Math.random() * 300,
            team: "Red"
          });
        }
        return balls;
      })(),
      blocks: (function () {
        var blocks = [];
        var bSize = 50;
        for (var r = 0; r < 6; r++) {
          for (var c = 0; c < 6; c++) {
            blocks.push({ x: 700 + c * bSize, y: 300 + r * bSize, w: bSize, h: bSize, type: "GiantBlock" });
          }
        }
        return blocks;
      })()
    },
    "Zero Gravity": {
      name: "Zero Gravity",
      description: "Floating battle with no gravity",
      width: 1200,
      height: 800,
      gravity: 0,
      boundaryType: "SolidWalls",
      winCondition: "LastBallStanding",
      balls: (function () {
        var balls = [];
        var presets = ["Basic", "Laser", "Speed", "Bomber"];
        var teams = ["Red", "Blue", "Green"];
        for (var i = 0; i < 30; i++) {
          balls.push({
            preset: presets[i % presets.length],
            x: 100 + Math.random() * 1000,
            y: 100 + Math.random() * 600,
            team: teams[i % teams.length]
          });
        }
        return balls;
      })(),
      blocks: []
    },
    "Super Bounce": {
      name: "Super Bounce",
      description: "Everything bounces like crazy",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastBallStanding",
      balls: (function () {
        var balls = [];
        var presets = ["Speed", "Swarm", "Berserker"];
        for (var i = 0; i < 40; i++) {
          balls.push({
            preset: presets[i % presets.length],
            x: 100 + Math.random() * 1000,
            y: 100 + Math.random() * 600,
            team: ["Red", "Blue"][Math.floor(Math.random() * 2)],
            overrides: { bounce: 0.99 }
          });
        }
        return balls;
      })(),
      blocks: (function () {
        var blocks = [];
        var types = ["Rubber", "Rubber", "Rubber", "Brick"];
        for (var i = 0; i < 30; i++) {
          blocks.push({
            x: 80 + Math.random() * 1040,
            y: 80 + Math.random() * 640,
            w: 30 + Math.random() * 40,
            h: 30 + Math.random() * 40,
            type: types[Math.floor(Math.random() * types.length)]
          });
        }
        return blocks;
      })()
    },
    "1 vs Arena": {
      name: "1 vs Arena",
      description: "One champion versus waves of enemies",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastTeamStanding",
      balls: (function () {
        var balls = [];
        balls.push({
          preset: "Berserker",
          x: 600,
          y: 400,
          team: "Red",
          overrides: { hp: 3000, maxHp: 3000, damage: 60, speed: 4.5 }
        });
        var enemyPresets = ["Sword", "Laser", "Hammer", "Speed"];
        for (var i = 0; i < 30; i++) {
          var angle = (i / 30) * Math.PI * 2;
          balls.push({
            preset: enemyPresets[i % enemyPresets.length],
            x: 600 + Math.cos(angle) * 350,
            y: 400 + Math.sin(angle) * 300,
            team: "Blue"
          });
        }
        return balls;
      })(),
      blocks: []
    },
    "Random Tournament": {
      name: "Random Tournament",
      description: "Randomized battle with all ball types",
      width: 1200,
      height: 800,
      gravity: 1,
      boundaryType: "SolidWalls",
      winCondition: "LastTeamStanding",
      balls: (function () {
        var balls = [];
        var presets = ["Basic","Sword","Hammer","Laser","Bomber","Speed","Tank","Berserker","Shield","Swarm"];
        var teams = ["Red", "Blue", "Green", "Yellow"];
        for (var i = 0; i < 50; i++) {
          balls.push({
            preset: presets[Math.floor(Math.random() * presets.length)],
            x: 100 + Math.random() * 1000,
            y: 100 + Math.random() * 600,
            team: teams[Math.floor(Math.random() * teams.length)]
          });
        }
        return balls;
      })(),
      blocks: (function () {
        var blocks = [];
        var types = ["Brick", "Stone", "Explosive", "Regenerating", "Glass"];
        for (var i = 0; i < 15; i++) {
          blocks.push({
            x: 80 + Math.random() * 1040,
            y: 80 + Math.random() * 640,
            w: 30 + Math.random() * 50,
            h: 30 + Math.random() * 50,
            type: types[Math.floor(Math.random() * types.length)]
          });
        }
        return blocks;
      })()
    }
  },

  PHYSICS_PRESETS: {
    Normal: {
      gravity: 1,
      friction: 0.3,
      restitution: 0.6,
      damageMultiplier: 1,
      knockbackMultiplier: 1
    },
    ZeroGravity: {
      gravity: 0,
      friction: 0.1,
      restitution: 0.8,
      damageMultiplier: 1,
      knockbackMultiplier: 1.5
    },
    LowGravity: {
      gravity: 0.3,
      friction: 0.3,
      restitution: 0.7,
      damageMultiplier: 1,
      knockbackMultiplier: 1.2
    },
    HighGravity: {
      gravity: 2,
      friction: 0.3,
      restitution: 0.5,
      damageMultiplier: 1,
      knockbackMultiplier: 0.8
    },
    SuperBounce: {
      gravity: 1,
      friction: 0.05,
      restitution: 0.99,
      damageMultiplier: 1,
      knockbackMultiplier: 1.5
    },
    LowFriction: {
      gravity: 1,
      friction: 0.02,
      restitution: 0.6,
      damageMultiplier: 1,
      knockbackMultiplier: 1
    },
    HighKnockback: {
      gravity: 1,
      friction: 0.3,
      restitution: 0.6,
      damageMultiplier: 1,
      knockbackMultiplier: 3
    },
    DoubleDamage: {
      gravity: 1,
      friction: 0.3,
      restitution: 0.6,
      damageMultiplier: 2,
      knockbackMultiplier: 1
    }
  },

  BOUNDARY_TYPES: {
    SolidWalls: {
      name: "SolidWalls",
      description: "Impassable walls that block movement",
      type: "solid"
    },
    DeathWall: {
      name: "DeathWall",
      description: "Walls that destroy on contact",
      type: "death"
    },
    Wraparound: {
      name: "Wraparound",
      description: "Bodies wrap around to the opposite side",
      type: "wrap"
    },
    Portals: {
      name: "Portals",
      description: "Teleport between portal pairs on edges",
      type: "portal"
    }
  },

  TEAMS: {
    Red: { name: "Red", color: "#ff5050" },
    Blue: { name: "Blue", color: "#5090ff" },
    Green: { name: "Green", color: "#50c878" },
    Yellow: { name: "Yellow", color: "#ffd700" },
    Neutral: { name: "Neutral", color: "#aaaaaa" }
  },

  SPECIAL_OBJECTS: {
    Bumper: {
      name: "Bumper",
      color: "#ff69b4",
      radius: 25,
      bounciness: 1.5,
      damage: 0,
      description: "Launches balls away on contact"
    },
    Launcher: {
      name: "Launcher",
      color: "#ff4444",
      radius: 20,
      force: 0.05,
      direction: "up",
      description: "Launches balls in a direction"
    },
    SpeedZone: {
      name: "SpeedZone",
      color: "#00ff88",
      radius: 80,
      speedBoost: 2.0,
      description: "Doubles ball speed inside zone"
    },
    HealZone: {
      name: "HealZone",
      color: "#00ff00",
      radius: 70,
      healRate: 2,
      description: "Heals balls inside zone"
    },
    DamageZone: {
      name: "DamageZone",
      color: "#ff0000",
      radius: 70,
      damageRate: 5,
      description: "Damages balls inside zone"
    },
    Lava: {
      name: "Lava",
      color: "#ff4400",
      radius: 30,
      damage: 50,
      damageType: "continuous",
      description: "Deals heavy continuous damage"
    },
    Spike: {
      name: "Spike",
      color: "#888888",
      radius: 20,
      damage: 30,
      damageType: "contact",
      description: "Sharp spike deals damage on hit"
    },
    Fan: {
      name: "Fan",
      color: "#88ccff",
      radius: 60,
      force: 0.002,
      direction: "up",
      description: "Applies continuous force in direction"
    },
    Magnet: {
      name: "Magnet",
      color: "#cc0000",
      radius: 100,
      force: 0.001,
      attract: true,
      description: "Attracts or repels nearby balls"
    }
  },

  PAD_CONFIGS: {
    HealPad: { radius: 28, color: "#2ecc71", defaultHealAmount: 80, defaultSpawnDuration: 8, orbColor: "#2ecc71", orbRadius: 10 },
    RotatePad: { radius: 28, color: "#f39c12", defaultRotMult: 1.5, defaultRotDuration: 6, defaultSpawnDuration: 8, orbColor: "#f39c12", orbRadius: 10 }
  },

  ORB_CONFIGS: {
    healOrb: { radius: 10, color: "#2ecc71", healAmount: 80 },
    rotateOrb: { radius: 10, color: "#f39c12", rotMult: 1.5, rotDuration: 6 }
  },

  MATCH_MODIFIERS: {
    base: { wallSpeedBoost: { enabled: false, amount: 0.02, cap: 3 }, gravity: 0, scatteredOrbs: { enabled: false, type: "heal", healAmount: 80, rotMult: 1.5, rotDuration: 6 } },
    ball: { damage2x: false, lifesteal: false, speed2x: false, rotSpeed15x: false, randomSize: false }
  }
};
