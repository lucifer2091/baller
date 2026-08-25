window.GameRenderer = class GameRenderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = camera;
    this.effects = [];
    this.damageNumbers = [];
    this.time = 0;
  }

  clear() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid() {
    const ctx = this.ctx;
    const cam = this.camera;
    const gridSize = 50;

    const topLeft = cam.screenToWorld(0, 0);
    const bottomRight = cam.screenToWorld(this.canvas.width, this.canvas.height);

    const startX = Math.floor(topLeft.x / gridSize) * gridSize;
    const startY = Math.floor(topLeft.y / gridSize) * gridSize;
    const endX = Math.ceil(bottomRight.x / gridSize) * gridSize;
    const endY = Math.ceil(bottomRight.y / gridSize) * gridSize;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let wx = startX; wx <= endX; wx += gridSize) {
      const s = cam.worldToScreen(wx, 0);
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x, this.canvas.height);
    }
    for (let wy = startY; wy <= endY; wy += gridSize) {
      const s = cam.worldToScreen(0, wy);
      ctx.moveTo(0, s.y);
      ctx.lineTo(this.canvas.width, s.y);
    }
    ctx.stroke();

    const majorSize = gridSize * 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const mStartX = Math.floor(topLeft.x / majorSize) * majorSize;
    const mStartY = Math.floor(topLeft.y / majorSize) * majorSize;
    const mEndX = Math.ceil(bottomRight.x / majorSize) * majorSize;
    const mEndY = Math.ceil(bottomRight.y / majorSize) * majorSize;
    for (let wx = mStartX; wx <= mEndX; wx += majorSize) {
      const s = cam.worldToScreen(wx, 0);
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x, this.canvas.height);
    }
    for (let wy = mStartY; wy <= mEndY; wy += majorSize) {
      const s = cam.worldToScreen(0, wy);
      ctx.moveTo(0, s.y);
      ctx.lineTo(this.canvas.width, s.y);
    }
    ctx.stroke();
  }

  drawArena(arenaData) {
    const ctx = this.ctx;
    const cam = this.camera;

    this.drawGrid();

    if (!arenaData) return;

    const halfW = (arenaData.width || 2000) / 2;
    const halfH = (arenaData.height || 2000) / 2;

    const tl = cam.worldToScreen(-halfW, -halfH);
    const br = cam.worldToScreen(halfW, halfH);

    const borderWidth = Math.max(4, 8 * cam.zoom);

    ctx.strokeStyle = arenaData.wallColor || '#ff6b35';
    ctx.lineWidth = borderWidth;
    ctx.shadowColor = arenaData.wallColor || '#ff6b35';
    ctx.shadowBlur = 12;
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,107,53,0.05)';
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  }

  drawBall(body, data) {
    if (!body || !data) return;
    const ctx = this.ctx;
    const cam = this.camera;

    const pos = body.position;
    const s = cam.worldToScreen(pos.x, pos.y);
    const r = (data.radius || 20) * cam.zoom;

    const teamColor = data.teamColor || data.color || '#4ecdc4';
    const hp = data.hp ?? data.health ?? 100;
    const maxHp = data.maxHp ?? data.maxHealth ?? 100;
    const hpRatio = maxHp > 0 ? hp / maxHp : 0;

    const gradient = ctx.createRadialGradient(
      s.x - r * 0.25, s.y - r * 0.25, r * 0.1,
      s.x, s.y, r
    );
    gradient.addColorStop(0, this._lighten(teamColor, 60));
    gradient.addColorStop(0.5, teamColor);
    gradient.addColorStop(1, this._darken(teamColor, 40));

    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = this._darken(teamColor, 30);
    ctx.lineWidth = Math.max(2, 2 * cam.zoom);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(s.x - r * 0.25, s.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    const barWidth = Math.max(30, r * 2.2);
    const barHeight = Math.max(4, 6 * cam.zoom);
    const barX = s.x - barWidth / 2;
    const barY = s.y - r - barHeight - Math.max(8, 10 * cam.zoom);
    this.drawHealthBar(barX, barY, barWidth, hp, maxHp, teamColor);

    const name = data.name || '';
    if (name) {
      const fontSize = Math.max(9, Math.round(11 * cam.zoom));
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(name, s.x + 1, barY - 2 + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, s.x, barY - 2);
    }

    const teamLabel = data.team || '';
    if (teamLabel) {
      const fontSize = Math.max(7, Math.round(8 * cam.zoom));
      ctx.font = `${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(teamLabel, s.x, s.y + r + 4 * cam.zoom);
    }

    if (body.velocity) {
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      if (speed > 3) {
        const angle = Math.atan2(body.velocity.y, body.velocity.x);
        const trailLen = Math.min(speed * 0.3, 30) * cam.zoom;
        ctx.beginPath();
        ctx.moveTo(
          s.x + Math.cos(angle + Math.PI) * r,
          s.y + Math.sin(angle + Math.PI) * r
        );
        ctx.lineTo(
          s.x + Math.cos(angle + Math.PI) * (r + trailLen),
          s.y + Math.sin(angle + Math.PI) * (r + trailLen)
        );
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.3, speed * 0.02)})`;
        ctx.lineWidth = r * 0.4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
  }

  drawBlock(body, data) {
    if (!body || !data) return;
    const ctx = this.ctx;
    const cam = this.camera;

    const pos = body.position;
    const s = cam.worldToScreen(pos.x, pos.y);
    const hw = (data.width || 40) * cam.zoom / 2;
    const hh = (data.height || 40) * cam.zoom / 2;

    const hp = data.hp ?? data.health ?? 100;
    const maxHp = data.maxHp ?? data.maxHealth ?? 100;
    const hpRatio = maxHp > 0 ? hp / maxHp : 0;
    const baseColor = data.color || '#8b5cf6';

    const darkened = this._darken(baseColor, Math.round((1 - hpRatio) * 50));

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(body.angle || 0);

    ctx.fillStyle = darkened;
    ctx.fillRect(-hw, -hh, hw * 2, hh * 2);

    ctx.strokeStyle = this._darken(baseColor, 30);
    ctx.lineWidth = Math.max(2, 2 * cam.zoom);
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-hw, -hh, hw * 2, hh * 0.3);

    ctx.restore();

    const hpText = `${Math.round(hp)}`;
    const fontSize = Math.max(8, Math.round(10 * cam.zoom));
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(hpText, s.x + 1, s.y + 1);
    ctx.fillStyle = '#fff';
    ctx.fillText(hpText, s.x, s.y);
  }

  drawWeapon(body, data) {
    if (!body || !data) return;
    const ctx = this.ctx;
    const cam = this.camera;

    const pos = body.position;
    const s = cam.worldToScreen(pos.x, pos.y);
    const weaponType = (data.type || data.weaponType || 'sword').toLowerCase();

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(body.angle || 0);

    const color = data.color || '#e74c3c';

    if (weaponType === 'sword' || weaponType === 'blade') {
      const len = (data.length || 40) * cam.zoom;
      const w = (data.width || 8) * cam.zoom;
      ctx.beginPath();
      ctx.ellipse(len * 0.3, 0, len * 0.5, w * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = this._darken(color, 30);
      ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(len * 0.3, 0, len * 0.5, w * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();
    } else if (weaponType === 'hammer') {
      const r = (data.radius || 18) * cam.zoom;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
      grad.addColorStop(0, this._lighten(color, 40));
      grad.addColorStop(1, this._darken(color, 20));
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = this._darken(color, 40);
      ctx.lineWidth = Math.max(2, 2 * cam.zoom);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.2, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    } else if (weaponType === 'laser' || weaponType === 'beam') {
      const len = (data.length || 60) * cam.zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, 4 * cam.zoom);
      ctx.shadowColor = color;
      ctx.shadowBlur = 10 * cam.zoom;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, 0);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = Math.max(1, 1.5 * cam.zoom);
      ctx.stroke();
    } else {
      const r = (data.radius || 12) * cam.zoom;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = this._darken(color, 30);
      ctx.lineWidth = Math.max(1, 2 * cam.zoom);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawProjectile(body, data) {
    if (!body || !data) return;
    const ctx = this.ctx;
    const cam = this.camera;

    const pos = body.position;
    const s = cam.worldToScreen(pos.x, pos.y);
    const r = (data.radius || 5) * cam.zoom;
    const color = data.color || '#ff6b35';

    if (body.velocity) {
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      if (speed > 1) {
        const angle = Math.atan2(-body.velocity.y, -body.velocity.x);
        const trailLen = Math.min(speed * 0.5, 40) * cam.zoom;
        const trailGrad = ctx.createLinearGradient(
          s.x + Math.cos(angle) * r,
          s.y + Math.sin(angle) * r,
          s.x + Math.cos(angle) * (r + trailLen),
          s.y + Math.sin(angle) * (r + trailLen)
        );
        trailGrad.addColorStop(0, color);
        trailGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.moveTo(
          s.x + Math.cos(angle + 0.2) * r,
          s.y + Math.sin(angle + 0.2) * r
        );
        ctx.lineTo(
          s.x + Math.cos(angle) * (r + trailLen),
          s.y + Math.sin(angle) * (r + trailLen)
        );
        ctx.lineTo(
          s.x + Math.cos(angle - 0.2) * r,
          s.y + Math.sin(angle - 0.2) * r
        );
        ctx.fillStyle = trailGrad;
        ctx.fill();
      }
    }

    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, this._darken(color, 20));
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  drawSpecialObject(body, data) {
    if (!body || !data) return;
    const ctx = this.ctx;
    const cam = this.camera;

    const pos = body.position;
    const s = cam.worldToScreen(pos.x, pos.y);
    const specialType = (data.specialType || data.type || '').toLowerCase();
    const color = data.color || '#ff4444';

    if (specialType === 'lava' || specialType === 'hazard') {
      const r = (data.radius || 30) * cam.zoom;
      const pulse = 1 + Math.sin(this.time * 3) * 0.15;

      ctx.beginPath();
      ctx.arc(s.x, s.y, r * pulse * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,100,0,${0.08 + Math.sin(this.time * 2) * 0.04})`;
      ctx.fill();

      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      grad.addColorStop(0, '#ff6600');
      grad.addColorStop(0.6, '#ff3300');
      grad.addColorStop(1, 'rgba(255,50,0,0.3)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(s.x, s.y, r * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = Math.max(2, 2 * cam.zoom);
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 15 * cam.zoom;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (specialType === 'bumper') {
      const r = (data.radius || 25) * cam.zoom;
      const pulse = 1 + Math.sin(this.time * 4) * 0.1;

      ctx.beginPath();
      ctx.arc(s.x, s.y, r * pulse, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        s.x - r * 0.2, s.y - r * 0.2, r * 0.1,
        s.x, s.y, r * pulse
      );
      grad.addColorStop(0, this._lighten(color, 50));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = this._darken(color, 20);
      ctx.lineWidth = Math.max(3, 3 * cam.zoom);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s.x - r * 0.2, s.y - r * 0.2, r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();
    } else if (specialType === 'zone' || specialType === 'area') {
      const hw = (data.width || 100) * cam.zoom / 2;
      const hh = (data.height || 100) * cam.zoom / 2;
      const alpha = data.alpha || 0.2;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(body.angle || 0);
      ctx.fillStyle = this._withAlpha(color, alpha);
      ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, 2 * cam.zoom);
      ctx.setLineDash([6 * cam.zoom, 4 * cam.zoom]);
      ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
      ctx.setLineDash([]);
      ctx.restore();
    } else if (specialType === 'spawn') {
      const r = (data.radius || 20) * cam.zoom;
      const pulse = 1 + Math.sin(this.time * 2) * 0.15;

      ctx.beginPath();
      ctx.arc(s.x, s.y, r * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, 2 * cam.zoom);
      ctx.setLineDash([4 * cam.zoom, 4 * cam.zoom]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      const r = (data.radius || 15) * cam.zoom;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = this._darken(color, 20);
      ctx.lineWidth = Math.max(2, 2 * cam.zoom);
      ctx.stroke();
    }
  }

  drawHealthBar(x, y, width, current, max, color) {
    const ctx = this.ctx;
    const height = Math.max(4, width * 0.12);
    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fill();

    if (ratio > 0) {
      const hpColor = ratio > 0.6 ? '#22c55e' : ratio > 0.3 ? '#eab308' : '#ef4444';
      const barWidth = width * ratio;
      const grad = ctx.createLinearGradient(x, y, x, y + height);
      grad.addColorStop(0, this._lighten(hpColor, 20));
      grad.addColorStop(1, hpColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, height, height / 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, height / 2, height / 2);
      ctx.fill();
    }
  }

  drawText(text, x, y, options = {}) {
    const ctx = this.ctx;
    const fontSize = options.fontSize || 12;
    const color = options.color || '#ffffff';
    const align = options.align || 'center';
    const baseline = options.baseline || 'middle';
    const outline = options.outline !== false;
    const outlineColor = options.outlineColor || 'rgba(0,0,0,0.8)';

    ctx.font = `${options.bold ? 'bold ' : ''}${fontSize}px "${options.fontFamily || 'Segoe UI'}", Arial, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (outline) {
      ctx.fillStyle = outlineColor;
      ctx.fillText(text, x + 1, y + 1);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  addEffect(effect) {
    this.effects.push({
      type: effect.type || 'ring',
      x: effect.x || 0,
      y: effect.y || 0,
      color: effect.color || '#ffffff',
      size: effect.size || 20,
      life: effect.life || 1,
      maxLife: effect.maxLife || effect.life || 1,
      data: effect.data || {}
    });
  }

  addDamageNumber(x, y, amount, color) {
    this.damageNumbers.push({
      x: x,
      y: y,
      text: `-${Math.round(amount)}`,
      color: color || '#ff4444',
      life: 1.2,
      maxLife: 1.2,
      vy: -60,
      vx: (Math.random() - 0.5) * 30
    });
  }

  addDeathEffect(x, y, color) {
    this.addEffect({
      type: 'death_ring',
      x: x,
      y: y,
      color: color || '#ff0000',
      size: 30,
      life: 0.6,
      maxLife: 0.6
    });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.addEffect({
        type: 'death_particle',
        x: x,
        y: y,
        color: color || '#ff0000',
        size: 4,
        life: 0.8,
        maxLife: 0.8,
        data: { angle: angle, speed: 120 + Math.random() * 80 }
      });
    }
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.life -= dt;
      if (e.life <= 0) {
        this.effects.splice(i, 1);
        continue;
      }
      if (e.type === 'death_particle') {
        e.x += Math.cos(e.data.angle) * e.data.speed * dt;
        e.y += Math.sin(e.data.angle) * e.data.speed * dt;
      }
    }

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
        continue;
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 30 * dt;
    }
  }

  drawEffects() {
    const ctx = this.ctx;
    const cam = this.camera;

    for (const e of this.effects) {
      const s = cam.worldToScreen(e.x, e.y);
      const progress = 1 - e.life / e.maxLife;

      if (e.type === 'death_ring' || e.type === 'ring') {
        const r = e.size * (1 + progress * 2) * cam.zoom;
        const alpha = (1 - progress) * 0.8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = this._withAlpha(e.color, alpha);
        ctx.lineWidth = Math.max(2, (3 - progress * 2) * cam.zoom);
        ctx.stroke();
      } else if (e.type === 'death_particle') {
        const alpha = 1 - progress;
        const size = e.size * (1 - progress * 0.5) * cam.zoom;
        ctx.beginPath();
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
        ctx.fillStyle = this._withAlpha(e.color, alpha);
        ctx.fill();
      } else if (e.type === 'explosion') {
        const r = e.size * progress * cam.zoom;
        const alpha = (1 - progress) * 0.6;
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        grad.addColorStop(0, this._withAlpha('#ffffff', alpha));
        grad.addColorStop(0.5, this._withAlpha(e.color, alpha * 0.7));
        grad.addColorStop(1, this._withAlpha(e.color, 0));
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    for (const d of this.damageNumbers) {
      const s = cam.worldToScreen(d.x, d.y);
      const alpha = Math.min(1, d.life / (d.maxLife * 0.3));
      const fontSize = Math.max(10, Math.round(14 * cam.zoom));
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
      ctx.fillText(d.text, s.x + 1, s.y + 1);
      ctx.fillStyle = d.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
      if (!d.color.includes('rgba')) {
        ctx.fillStyle = this._withAlpha(d.color, alpha);
      }
      ctx.fillText(d.text, s.x, s.y);
    }
  }

  render(gameState) {
    this.time += 1 / 60;
    this.ctx.save();

    this.clear();

    this.drawArena(gameState.arena);

    if (gameState.specials) {
      for (const special of gameState.specials) {
        this.drawSpecialObject(special.body, special.data);
      }
    }

    if (gameState.blocks) {
      for (const block of gameState.blocks) {
        this.drawBlock(block.body, block.data);
      }
    }

    if (gameState.weapons) {
      for (const weapon of gameState.weapons) {
        this.drawWeapon(weapon.body, weapon.data);
      }
    }

    if (gameState.projectiles) {
      for (const proj of gameState.projectiles) {
        this.drawProjectile(proj.body, proj.data);
      }
    }

    if (gameState.balls) {
      for (const ball of gameState.balls) {
        this.drawBall(ball.body, ball.data);
      }
    }

    this.drawEffects();

    this.ctx.restore();
  }

  _lighten(hex, amount) {
    const rgb = this._hexToRgb(hex);
    if (!rgb) return hex;
    return `rgb(${Math.min(255, rgb.r + amount)},${Math.min(255, rgb.g + amount)},${Math.min(255, rgb.b + amount)})`;
  }

  _darken(hex, amount) {
    const rgb = this._hexToRgb(hex);
    if (!rgb) return hex;
    return `rgb(${Math.max(0, rgb.r - amount)},${Math.max(0, rgb.g - amount)},${Math.max(0, rgb.b - amount)})`;
  }

  _withAlpha(color, alpha) {
    const rgb = this._hexToRgb(color);
    if (rgb) {
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
    }
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
    }
    if (color.startsWith('rgba(')) {
      return color.replace(/,[^,]*\)$/, `,${alpha})`);
    }
    return color;
  }

  _hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return null;
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return null;
    const num = parseInt(hex, 16);
    if (isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }
};
