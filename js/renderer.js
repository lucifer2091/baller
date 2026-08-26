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

    const tl = cam.worldToScreen(0, 0);
    const br = cam.worldToScreen(arenaData.width || 2000, arenaData.height || 2000);

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

    if (data.damageBonus > 0) {
      const bonusFontSize = Math.max(7, Math.round(9 * cam.zoom));
      ctx.font = `bold ${bonusFontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ff8800';
      ctx.fillText('+' + data.damageBonus + ' DMG', s.x, barY - 2 - Math.max(9, 11 * cam.zoom));
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

  drawPad(pad, type) {
    if (!pad) return;
    const ctx = this.ctx;
    const cam = this.camera;
    const resolvedType = (type || pad.type || 'heal').toString().toLowerCase();
    const isHeal = resolvedType.includes('heal');
    const s = cam.worldToScreen(pad.x, pad.y);
    const baseSize = (pad.size || pad.width || 64) * cam.zoom;
    const hw = baseSize / 2;
    const hh = baseSize / 2;
    const color = pad.color || (isHeal ? '#22c55e' : '#f97316');
    const pulse = 0.85 + Math.sin(this.time * 2.4) * 0.15;
    const glowAlpha = 0.14 + Math.sin(this.time * 2) * 0.05;

    ctx.save();
    ctx.translate(s.x, s.y);

    if (isHeal) {
      // outer pulse glow
      ctx.fillStyle = this._withAlpha(color, glowAlpha * pulse);
      ctx.shadowColor = color;
      ctx.shadowBlur = 20 * cam.zoom * pulse;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-hw - 8 * cam.zoom, -hh - 8 * cam.zoom, baseSize + 16 * cam.zoom, baseSize + 16 * cam.zoom, 14 * cam.zoom);
      } else {
        ctx.rect(-hw - 8 * cam.zoom, -hh - 8 * cam.zoom, baseSize + 16 * cam.zoom, baseSize + 16 * cam.zoom);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // semi-transparent fill with rounded corners
      ctx.fillStyle = this._withAlpha(color, 0.2);
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-hw, -hh, baseSize, baseSize, 12 * cam.zoom);
      } else {
        ctx.rect(-hw, -hh, baseSize, baseSize);
      }
      ctx.fill();

      // subtle top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-hw, -hh, baseSize, baseSize * 0.34, 12 * cam.zoom);
      } else {
        ctx.rect(-hw, -hh, baseSize, baseSize * 0.34);
      }
      ctx.fill();

      // dashed border
      ctx.strokeStyle = this._withAlpha(color, 0.95);
      ctx.lineWidth = Math.max(2, 2.4 * cam.zoom);
      ctx.setLineDash([7 * cam.zoom, 5 * cam.zoom]);
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-hw, -hh, baseSize, baseSize, 12 * cam.zoom);
      } else {
        ctx.rect(-hw, -hh, baseSize, baseSize);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // "+" icon in center
      const plusSize = baseSize * 0.36;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2.5, 3.5 * cam.zoom);
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(-plusSize / 2, 0);
      ctx.lineTo(plusSize / 2, 0);
      ctx.moveTo(0, -plusSize / 2);
      ctx.lineTo(0, plusSize / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // rotate pad: diamond (square rotated 45deg)
      // pulse glow (diamond)
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = this._withAlpha(color, glowAlpha * pulse);
      ctx.shadowColor = color;
      ctx.shadowBlur = 20 * cam.zoom * pulse;
      ctx.fillRect(-hw - 8 * cam.zoom, -hh - 8 * cam.zoom, baseSize + 16 * cam.zoom, baseSize + 16 * cam.zoom);
      ctx.shadowBlur = 0;

      ctx.fillStyle = this._withAlpha(color, 0.2);
      ctx.fillRect(-hw, -hh, baseSize, baseSize);

      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.fillRect(-hw, -hh, baseSize, baseSize * 0.34);

      ctx.strokeStyle = this._withAlpha(color, 0.95);
      ctx.lineWidth = Math.max(2, 2.4 * cam.zoom);
      ctx.setLineDash([7 * cam.zoom, 5 * cam.zoom]);
      ctx.strokeRect(-hw, -hh, baseSize, baseSize);
      ctx.setLineDash([]);
      ctx.restore();

      // rotating arrow icon "↻" upright + extra spinning tick
      ctx.save();
      // subtle spinning ring tick
      ctx.rotate(this.time * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = Math.max(1.5, 2 * cam.zoom);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, baseSize * 0.32, -0.4, Math.PI * 1.6);
      ctx.stroke();
      // arrow head at end of arc
      const ar = baseSize * 0.32;
      const ang = Math.PI * 1.6;
      const ax = Math.cos(ang) * ar;
      const ay = Math.sin(ang) * ar;
      const headLen = 6 * cam.zoom;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + Math.cos(ang + Math.PI * 0.55) * headLen, ay + Math.sin(ang + Math.PI * 0.55) * headLen);
      ctx.lineTo(ax + Math.cos(ang - Math.PI * 0.55) * headLen, ay + Math.sin(ang - Math.PI * 0.55) * headLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // center "↻" symbol upright
      ctx.font = `bold ${Math.max(14, Math.round(baseSize * 0.52))}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText('↻', 1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('↻', 0, 0);
    }

    // label below pad (heal amount / rotMult)
    let label = '';
    if (isHeal) {
      if (pad.healAmount != null) label = `+${pad.healAmount} HP`;
      else if (pad.amount != null) label = `+${pad.amount} HP`;
      else label = 'HEAL';
    } else {
      if (pad.rotMult != null) label = `x${pad.rotMult}`;
      else if (pad.rotationMultiplier != null) label = `x${pad.rotationMultiplier}`;
      else if (pad.mult != null) label = `x${pad.mult}`;
      else label = 'ROTATE';
    }
    const labelY = hh + 16 * cam.zoom;
    const fontSize = Math.max(8, Math.round(10 * cam.zoom));
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(label, 1, labelY + 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 0, labelY);

    ctx.restore();
  }

  drawOrb(orb, type) {
    if (!orb) return;
    const ctx = this.ctx;
    const cam = this.camera;
    const resolvedType = (type || orb.type || 'heal').toString().toLowerCase();
    const isHeal = resolvedType.includes('heal');
    const color = orb.color || (isHeal ? '#22c55e' : '#f97316');
    const baseR = (orb.radius || 14) * cam.zoom;
    // bob up/down with sin(time*2) - use orb.x as phase offset so orbs don't move identically
    const phase = (orb.x || 0) * 0.02 + (orb.y || 0) * 0.02;
    const bob = Math.sin(this.time * 2 + phase) * 7 * cam.zoom;
    const s = cam.worldToScreen(orb.x, orb.y);
    s.y += bob;

    // shadow under orb
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + baseR * 1.35, baseR * 0.85, baseR * 0.38, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();

    // outer pulse glow ring
    const ringPulse = 1 + Math.sin(this.time * 2.2 + phase) * 0.18;
    const ringAlpha = 0.22 + Math.sin(this.time * 2 + phase) * 0.08;
    ctx.beginPath();
    ctx.arc(s.x, s.y, baseR * 1.55 * ringPulse, 0, Math.PI * 2);
    ctx.strokeStyle = this._withAlpha(color, Math.max(0, ringAlpha));
    ctx.lineWidth = Math.max(1.5, 2 * cam.zoom);
    ctx.stroke();

    // outer soft glow
    ctx.beginPath();
    ctx.arc(s.x, s.y, baseR * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = this._withAlpha(color, 0.14);
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 * cam.zoom;
    ctx.fill();
    ctx.shadowBlur = 0;

    // main orb filled circle with gradient
    const grad = ctx.createRadialGradient(s.x - baseR * 0.25, s.y - baseR * 0.3, baseR * 0.15, s.x, s.y, baseR);
    grad.addColorStop(0, this._lighten(color, 70));
    grad.addColorStop(0.45, color);
    grad.addColorStop(1, this._darken(color, 35));
    ctx.beginPath();
    ctx.arc(s.x, s.y, baseR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = this._lighten(color, 30);
    ctx.lineWidth = Math.max(1.5, 1.8 * cam.zoom);
    ctx.stroke();

    // highlight
    ctx.beginPath();
    ctx.arc(s.x - baseR * 0.28, s.y - baseR * 0.3, baseR * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.fill();

    if (isHeal) {
      // "+" icon
      const plusLen = baseR * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, 2.6 * cam.zoom);
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(s.x - plusLen / 2, s.y);
      ctx.lineTo(s.x + plusLen / 2, s.y);
      ctx.moveTo(s.x, s.y - plusLen / 2);
      ctx.lineTo(s.x, s.y + plusLen / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // rotate orb: central "↻" plus rotating arrow
      // rotating arc
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(this.time * 3 + phase);
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(1.4, 1.8 * cam.zoom);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.52, -0.5, Math.PI * 1.55);
      ctx.stroke();
      // arrow head
      const ar = baseR * 0.52;
      const ang = Math.PI * 1.55;
      const ax = Math.cos(ang) * ar;
      const ay = Math.sin(ang) * ar;
      const hl = 5 * cam.zoom;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      // compute perpendicular
      const tx = -Math.sin(ang);
      const ty = Math.cos(ang);
      ctx.lineTo(ax + (Math.cos(ang + 2.4) * hl), ay + (Math.sin(ang + 2.4) * hl));
      ctx.lineTo(ax + (Math.cos(ang - 2.0) * hl), ay + (Math.sin(ang - 2.0) * hl));
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // static centered symbol - draw on top
      const fontSize = Math.max(9, Math.round(baseR * 0.95));
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // draw behind with dark outline
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillText('↻', s.x + 1, s.y + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('↻', s.x, s.y);
    }
  }

  drawPortal(portal, isOnCooldown) {
    if (!portal) return;
    const ctx = this.ctx;
    const cam = this.camera;
    const s = cam.worldToScreen(portal.x, portal.y);
    const r = (portal.radius || 28) * cam.zoom;
    const innerR = r * 0.58;
    const rawCooldown = isOnCooldown !== undefined ? isOnCooldown : (portal.isOnCooldown ?? portal.onCooldown ?? false);
    const cooldownRemaining = portal.cooldownRemaining ?? portal.remaining ?? portal.cooldown ?? 0;
    const onCooldown = !!rawCooldown || (cooldownRemaining > 0.05);
    const baseColor = portal.color || '#a855f7';

    const displayColor = onCooldown ? '#6b7280' : baseColor;
    const alphaMul = onCooldown ? 0.45 : 1;

    // outer soft glow
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = this._withAlpha(displayColor, 0.12 * alphaMul);
    ctx.shadowColor = displayColor;
    ctx.shadowBlur = onCooldown ? 6 : 22 * cam.zoom;
    ctx.fill();
    ctx.shadowBlur = 0;

    // outer concentric circle
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    const outerGrad = ctx.createRadialGradient(s.x, s.y, innerR, s.x, s.y, r);
    outerGrad.addColorStop(0, this._withAlpha(displayColor, 0.18 * alphaMul));
    outerGrad.addColorStop(1, this._withAlpha(displayColor, 0.34 * alphaMul));
    ctx.fillStyle = outerGrad;
    ctx.fill();
    ctx.strokeStyle = onCooldown ? 'rgba(107,114,128,0.85)' : this._withAlpha(baseColor, 0.95);
    ctx.lineWidth = Math.max(2, 3 * cam.zoom);
    if (onCooldown) ctx.setLineDash([5 * cam.zoom, 4 * cam.zoom]);
    ctx.stroke();
    if (onCooldown) ctx.setLineDash([]);

    // inner concentric circle
    ctx.beginPath();
    ctx.arc(s.x, s.y, innerR, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(s.x - innerR * 0.2, s.y - innerR * 0.2, innerR * 0.1, s.x, s.y, innerR);
    if (onCooldown) {
      innerGrad.addColorStop(0, '#9ca3af');
      innerGrad.addColorStop(1, '#4b5563');
    } else {
      innerGrad.addColorStop(0, this._lighten(baseColor, 55));
      innerGrad.addColorStop(0.55, baseColor);
      innerGrad.addColorStop(1, this._darken(baseColor, 45));
    }
    ctx.fillStyle = this._withAlpha(innerGrad, 1); // gradient already has color; but fillStyle expects string/gradient
    // Actually gradient is object; no need withAlpha wrapper
    ctx.fillStyle = innerGrad;
    if (onCooldown) ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = onCooldown ? 'rgba(160,160,170,0.7)' : this._withAlpha(this._lighten(baseColor, 30), 0.95);
    ctx.lineWidth = Math.max(1.5, 2 * cam.zoom);
    ctx.stroke();

    // swirl effect - several arcs rotating
    if (!onCooldown) {
      const swirlCount = 3;
      for (let i = 0; i < swirlCount; i++) {
        const baseAngle = this.time * 1.8 + (i / swirlCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 0.78, baseAngle, baseAngle + Math.PI * 0.62);
        ctx.strokeStyle = this._withAlpha('#ffffff', 0.62);
        ctx.lineWidth = Math.max(1.2, 1.6 * cam.zoom);
        ctx.lineCap = 'round';
        ctx.stroke();

        // inner swirl opposite direction
        ctx.beginPath();
        ctx.arc(s.x, s.y, innerR * 0.72, -baseAngle * 1.1, -baseAngle * 1.1 + Math.PI * 0.5);
        ctx.strokeStyle = this._withAlpha('#ffffff', 0.28);
        ctx.lineWidth = Math.max(1, 1.2 * cam.zoom);
        ctx.stroke();
      }
      // central shine
      ctx.beginPath();
      ctx.arc(s.x - r * 0.15, s.y - r * 0.15, r * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fill();
    } else {
      // cooldown swirl dimmed static
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 0.78, 0, Math.PI * 1.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = Math.max(1.2, 1.6 * cam.zoom);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // cooldown timer text
    if (onCooldown) {
      const remaining = cooldownRemaining > 0 ? cooldownRemaining : 0;
      let timerText = '';
      if (remaining > 0.05) {
        timerText = remaining.toFixed(1) + 's';
      } else {
        timerText = 'CD';
      }
      const fontSize = Math.max(9, Math.round(11 * cam.zoom));
      ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // dark backdrop for readability
      const textW = ctx.measureText(timerText).width + 12 * cam.zoom;
      const textH = fontSize + 8 * cam.zoom;
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(s.x - textW / 2, s.y - textH / 2, textW, textH, 4 * cam.zoom);
      else ctx.rect(s.x - textW / 2, s.y - textH / 2, textW, textH);
      ctx.fill();
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(timerText, s.x, s.y);
    }
  }

  drawWallBody(body, data) {
    if (!body) return;
    const ctx = this.ctx;
    const cam = this.camera;
    const pos = body.position || { x: 0, y: 0 };
    const s = cam.worldToScreen(pos.x, pos.y);
    const w = (data && (data.width || data.w) ) || 100;
    const h = (data && (data.height || data.h) ) || 20;
    const hw = w * cam.zoom / 2;
    const hh = h * cam.zoom / 2;
    const color = (data && data.color) || '#4b5563';
    const angle = body.angle || (data && data.angle) || 0;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(angle);

    // main filled rect
    ctx.fillStyle = color;
    ctx.fillRect(-hw, -hh, hw * 2, hh * 2);

    // subtle gradient overlay for depth
    const grad = ctx.createLinearGradient(0, -hh, 0, hh);
    grad.addColorStop(0, 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(-hw, -hh, hw * 2, hh * 2);

    // brick pattern
    const brickH = Math.max(8 * cam.zoom, hh * 0.5);
    const brickW = Math.max(18 * cam.zoom, hw * 0.6);
    // Avoid too many bricks if wall is huge - clamp count
    const rows = Math.max(1, Math.floor((hh * 2) / brickH));
    const effectiveBrickH = (hh * 2) / rows;

    ctx.strokeStyle = this._withAlpha(this._darken(color, 35), 0.95);
    ctx.lineWidth = Math.max(1, 1.2 * cam.zoom);
    // horizontal mortar lines
    for (let i = 1; i < rows; i++) {
      const y = -hh + i * effectiveBrickH;
      ctx.beginPath();
      ctx.moveTo(-hw, y);
      ctx.lineTo(hw, y);
      ctx.stroke();
    }
    // vertical mortar lines staggered
    for (let row = 0; row < rows; row++) {
      const yTop = -hh + row * effectiveBrickH;
      const yBottom = yTop + effectiveBrickH;
      const cols = Math.max(1, Math.ceil((hw * 2) / brickW));
      const effectiveBrickW = (hw * 2) / cols;
      const offset = (row % 2 === 1) ? effectiveBrickW / 2 : 0;
      for (let c = -1; c < cols; c++) {
        const x = -hw + c * effectiveBrickW + offset;
        if (x <= -hw || x >= hw) continue;
        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBottom);
        ctx.stroke();
      }
    }

    // border
    ctx.strokeStyle = this._darken(color, 45);
    ctx.lineWidth = Math.max(1.5, 2 * cam.zoom);
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);

    // top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(-hw, -hh, hw * 2, Math.max(2 * cam.zoom, effectiveBrickH * 0.32));

    ctx.restore();
  }

  drawCountdown(number, label) {
    if (number == null) return;
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const pulse = 1 + Math.sin(this.time * 5) * 0.06;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    const numStr = String(number);
    // shadow / outline
    ctx.font = `900 112px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(numStr, 4, 4);

    // stroke
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeText(numStr, 0, 0);

    // gradient fill
    const grad = ctx.createLinearGradient(0, -56, 0, 56);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#fde68a');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.fillText(numStr, 0, 0);

    // inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `900 112px "Segoe UI", Arial, sans-serif`;
    // subtle inner
    if (label) {
      const labelStr = String(label);
      ctx.font = `bold 22px "Segoe UI", Arial, sans-serif`;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(labelStr, 1, 74);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelStr, 0, 73);
      // reset for potential further use
    }

    ctx.restore();
  }

  drawHealthBar(x, y, width, current, max, color) {
    const ctx = this.ctx;
    const height = Math.max(4, width * 0.12);
    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, width, height, height / 2);
    else ctx.rect(x, y, width, height);
    ctx.fill();

    if (ratio > 0) {
      const hpColor = ratio > 0.6 ? '#22c55e' : ratio > 0.3 ? '#eab308' : '#ef4444';
      const barWidth = width * ratio;
      const grad = ctx.createLinearGradient(x, y, x, y + height);
      grad.addColorStop(0, this._lighten(hpColor, 20));
      grad.addColorStop(1, hpColor);
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, height, height / 2);
      else ctx.rect(x, y, barWidth, height);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, barWidth, height / 2, height / 2);
      else ctx.rect(x, y, barWidth, height / 2);
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

    if (gameState.pads) {
      for (const pad of gameState.pads) {
        this.drawPad(pad, pad.type);
      }
    }

    if (gameState.orbs) {
      for (const orb of gameState.orbs) {
        this.drawOrb(orb, orb.type);
      }
    }

    if (gameState.portals) {
      for (const portal of gameState.portals) {
        const isOnCooldown = portal.isOnCooldown ?? portal.onCooldown ?? (portal.cooldownRemaining > 0) ?? false;
        // normalize boolean: if cooldownRemaining used, treat >0 as cooldown
        const cd = portal.cooldownRemaining ?? portal.remaining ?? 0;
        const onCd = typeof isOnCooldown === 'boolean' ? (isOnCooldown || cd > 0.05) : (cd > 0.05);
        this.drawPortal(portal, onCd);
      }
    }

    if (gameState.walls) {
      for (const wall of gameState.walls) {
        if (wall.body) {
          this.drawWallBody(wall.body, wall.data || wall);
        } else {
          // fallback: plain wall object with x,y,width,height
          const fakeBody = { position: { x: wall.x ?? 0, y: wall.y ?? 0 }, angle: wall.angle || 0 };
          this.drawWallBody(fakeBody, wall);
        }
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
    if (!color || typeof color !== 'string') return color || 'rgba(255,255,255,'+alpha+')';
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
