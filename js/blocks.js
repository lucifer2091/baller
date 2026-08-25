window.BlockManager = class BlockManager {
  constructor(physics) {
    this.physics = physics;
    this.blocks = [];
    this.nextId = 1;
    this.totalDestroyed = 0;
    this.fragments = [];
  }

  createBlock(x, y, config = {}) {
    const blockTypes = window.PRESETS?.BLOCK_TYPES || {};
    const typeData = blockTypes[config.type] || {};
    const data = {
      name: config.name || typeData.name || 'Block',
      hp: config.hp || typeData.hp || 50,
      maxHp: config.hp || typeData.hp || 50,
      breakable: config.breakable !== undefined ? config.breakable : typeData.breakable !== undefined ? typeData.breakable : true,
      color: config.color || typeData.color || '#888888',
      material: config.material || typeData.material || 'normal',
      size: config.size || typeData.size || 30,
      explodes: config.explodes !== undefined ? config.explodes : typeData.explodes || false,
      respawn: config.respawn !== undefined ? config.respawn : typeData.respawn || false,
      respawnTime: config.respawnTime || typeData.respawnTime || 5000,
      originalColor: config.color || typeData.color || '#888888',
      originalConfig: { ...config, type: config.type }
    };

    const block = {
      id: this.nextId++,
      body: this.physics.addBlock(x, y, data.size, data.size, data.material),
      data: data
    };

    this.blocks.push(block);
    return block;
  }

  removeBlock(id) {
    const idx = this.blocks.findIndex(b => b.id === id);
    if (idx !== -1) {
      const block = this.blocks[idx];
      this.physics.removeBody(block.body);
      this.blocks.splice(idx, 1);
    }
  }

  getBlock(id) {
    return this.blocks.find(b => b.id === id) || null;
  }

  getAllBlocks() {
    return this.blocks;
  }

  getAliveBlocks() {
    return this.blocks.filter(b => b.data.hp > 0);
  }

  damageBlock(block, amount, source = null) {
    if (!block.data.breakable || block.data.hp <= 0) return;

    block.data.hp -= amount;

    const hpRatio = block.data.hp / block.data.maxHp;
    const baseColor = block.data.originalColor;
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    const dr = Math.floor(r * hpRatio);
    const dg = Math.floor(g * hpRatio);
    const db = Math.floor(b * hpRatio);
    block.data.color = `rgb(${dr},${dg},${db})`;

    if (block.data.hp <= 0) {
      block.data.hp = 0;
      this.breakBlock(block);
    }
  }

  breakBlock(block) {
    const x = block.body.position.x;
    const y = block.body.position.y;
    const color = block.data.color;
    const size = block.data.size;

    this.totalDestroyed++;
    this.physics.removeBody(block.body);

    if (block.data.explodes) {
      this.createExplosion(x, y, size * 2, 20);
    }

    this.createFragments(x, y, color, 6);

    if (block.data.respawn) {
      const originalConfig = block.data.originalConfig || {};
      const respawnTime = block.data.respawnTime;
      setTimeout(() => {
        this.respawnBlock(block, originalConfig);
      }, respawnTime);
    } else {
      const idx = this.blocks.findIndex(b => b.id === block.id);
      if (idx !== -1) {
        this.blocks.splice(idx, 1);
      }
    }
  }

  respawnBlock(block, config = {}) {
    const newBlock = this.createBlock(
      block.body.position.x,
      block.body.position.y,
      config
    );
    return newBlock;
  }

  createFragments(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      const size = 3 + Math.random() * 4;

      const fragment = {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        life: 30 + Math.random() * 30,
        maxLife: 60,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
      };

      this.fragments.push(fragment);
    }
  }

  createExplosion(x, y, radius, damage = 10) {
    if (window.BallManager && window.ballManager) {
      const balls = window.ballManager.getAliveBalls();
      for (const ball of balls) {
        const dx = ball.body.position.x - x;
        const dy = ball.body.position.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const force = (1 - dist / radius) * 5;
          const angle = Math.atan2(dy, dx);
          this.physics.setVelocity(ball.body, {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
          });

          const dmg = Math.floor(damage * (1 - dist / radius));
          window.ballManager.damageBall(ball, dmg, null);
        }
      }
    }
  }

  checkBallBlockCollisions() {
    if (!window.ballManager) return;

    const balls = window.ballManager.getAliveBalls();
    for (const ball of balls) {
      for (const block of this.blocks) {
        if (block.data.hp <= 0) continue;

        const dx = ball.body.position.x - block.body.position.x;
        const dy = ball.body.position.y - block.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.data.size + block.data.size * 0.5;

        if (dist < minDist) {
          const overlap = minDist - dist;
          if (overlap > 0 && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            this.physics.setVelocity(ball.body, {
              x: ball.body.velocity.x + nx * overlap * 0.1,
              y: ball.body.velocity.y + ny * overlap * 0.1
            });
          }
        }
      }
    }
  }

  update(dt) {
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const frag = this.fragments[i];
      frag.x += frag.vx;
      frag.y += frag.vy;
      frag.vy += 0.1;
      frag.vx *= 0.98;
      frag.rotation += frag.rotSpeed;
      frag.life--;

      if (frag.life <= 0) {
        this.fragments.splice(i, 1);
      }
    }
  }

  reset() {
    for (const block of this.blocks) {
      this.physics.removeBody(block.body);
    }
    this.blocks = [];
    this.fragments = [];
    this.totalDestroyed = 0;
  }

  clear() {
    this.reset();
  }
};
