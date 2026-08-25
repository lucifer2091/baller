window.EffectsManager = class EffectsManager {
  constructor() {
    this.effects = [];
  }

  spawnDamageNumber(x, y, damage, isCritical) {
    const text = Math.round(damage).toString();
    this.effects.push({
      type: "damageNumber",
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      vx: (Math.random() - 0.5) * 30,
      vy: -80 - Math.random() * 40,
      color: isCritical ? "#ff4444" : "#ffffff",
      size: isCritical ? 18 : 14,
      life: 1.0,
      maxLife: 1.0,
      text: text,
      alpha: 1,
      isCritical: isCritical
    });
  }

  spawnDeathEffect(x, y, color, size) {
    const radius = size * 1.5;
    this.effects.push({
      type: "ring",
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      color: color,
      size: size * 0.3,
      life: 0.6,
      maxLife: 0.6,
      text: "",
      alpha: 1,
      maxSize: radius
    });
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
      const speed = 60 + Math.random() * 100;
      this.effects.push({
        type: "particle",
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 3 + Math.random() * 4,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        text: "",
        alpha: 1
      });
    }
  }

  spawnExplosionEffect(x, y, radius) {
    this.effects.push({
      type: "flash",
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      color: "#ffffff",
      size: radius * 0.2,
      life: 0.25,
      maxLife: 0.25,
      text: "",
      alpha: 1,
      maxSize: radius
    });
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.2;
      const speed = 80 + Math.random() * 140;
      this.effects.push({
        type: "particle",
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? "#ffaa00" : "#ff4400",
        size: 2 + Math.random() * 5,
        life: 0.3 + Math.random() * 0.5,
        maxLife: 0.8,
        text: "",
        alpha: 1
      });
    }
  }

  spawnHitEffect(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.effects.push({
        type: "particle",
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 1.5 + Math.random() * 2,
        life: 0.15 + Math.random() * 0.2,
        maxLife: 0.35,
        text: "",
        alpha: 1
      });
    }
  }

  spawnHealEffect(x, y, amount) {
    const text = "+" + Math.round(amount).toString();
    this.effects.push({
      type: "healNumber",
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      vx: 0,
      vy: -50,
      color: "#44ff44",
      size: 14,
      life: 1.2,
      maxLife: 1.2,
      text: text,
      alpha: 1
    });
  }

  spawnBlockBreakEffect(x, y, color) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.effects.push({
        type: "fragment",
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 2 + Math.random() * 5,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        text: "",
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
  }

  spawnParticle(x, y, vx, vy, color, size, life) {
    this.effects.push({
      type: "particle",
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      color: color,
      size: size,
      life: life,
      maxLife: life,
      text: "",
      alpha: 1
    });
  }

  update(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.life <= 0) {
        this.effects.splice(i, 1);
        continue;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.alpha = Math.max(0, e.life / e.maxLife);
      if (e.type === "particle" || e.type === "fragment") {
        e.vy += 120 * dt;
        e.vx *= 0.98;
        if (e.rotation !== undefined) {
          e.rotation += e.rotationSpeed * dt;
        }
      }
      if (e.type === "ring") {
        const t = 1 - e.life / e.maxLife;
        e.size = e.size + (e.maxSize - e.size) * t;
      }
      if (e.type === "flash") {
        const t = 1 - e.life / e.maxLife;
        e.size = e.size + (e.maxSize - e.size) * t;
      }
    }
  }

  getEffects() {
    return this.effects;
  }

  clear() {
    this.effects = [];
  }
};
