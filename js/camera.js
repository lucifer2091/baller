window.GameCamera = class GameCamera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetX = 0;
    this.targetY = 0;
    this.targetZoom = 1;
    this.isDragging = false;
    this.dragButton = -1;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mode = "Free";
    this.followTarget = null;
    this.minZoom = 0.25;
    this.maxZoom = 4;
    this.lerpSpeed = 0.12;
    this.zoomLerpSpeed = 0.15;

    this._boundWheelHandler = (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.onWheel(e.clientX - rect.left, e.clientY - rect.top, e.deltaY);
    };
    this._boundContextMenuHandler = (e) => e.preventDefault();
    this.canvas.addEventListener('wheel', this._boundWheelHandler, { passive: false });
    this.canvas.addEventListener('contextmenu', this._boundContextMenuHandler);
  }

  worldToScreen(wx, wy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return {
      x: cx + (wx - this.x) * this.zoom,
      y: cy + (wy - this.y) * this.zoom
    };
  }

  screenToWorld(sx, sy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return {
      x: this.x + (sx - cx) / this.zoom,
      y: this.y + (sy - cy) / this.zoom
    };
  }

  pan(dx, dy) {
    this.targetX -= dx / this.zoom;
    this.targetY -= dy / this.zoom;
  }

  panWorld(dx, dy) {
    this.targetX += dx;
    this.targetY += dy;
  }

  zoomAt(screenX, screenY, factor) {
    const oldZoom = this.targetZoom;
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom * factor));

    const actualFactor = this.targetZoom / oldZoom;
    if (actualFactor !== 1) {
      const worldBefore = this.screenToWorld(screenX, screenY);
      this.x = worldBefore.x;
      this.y = worldBefore.y;
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      this.x -= (screenX - cx) / this.targetZoom;
      this.y -= (screenY - cy) / this.targetZoom;
      this.targetX = this.x;
      this.targetY = this.y;
    }
  }

  followBody(body) {
    this.followTarget = body;
    this.mode = "Follow";
  }

  goTo(x, y, zoom) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    if (zoom !== undefined) {
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
      this.targetZoom = this.zoom;
    }
  }

  update(dt) {
    const lerpT = Math.min(1, this.lerpSpeed * dt * 60);
    const zoomT = Math.min(1, this.zoomLerpSpeed * dt * 60);

    if (this.mode === "Follow" && this.followTarget) {
      this.targetX = this.followTarget.position.x;
      this.targetY = this.followTarget.position.y;
    }

    this.x += (this.targetX - this.x) * lerpT;
    this.y += (this.targetY - this.y) * lerpT;
    this.zoom += (this.targetZoom - this.zoom) * zoomT;
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.mode = "Free";
    this.followTarget = null;
  }

  onMouseDown(x, y, button) {
    this.isDragging = true;
    this.dragButton = button;
    this.lastMouseX = x;
    this.lastMouseY = y;
  }

  onMouseMove(x, y) {
    if (!this.isDragging) return;
    const dx = x - this.lastMouseX;
    const dy = y - this.lastMouseY;
    this.lastMouseX = x;
    this.lastMouseY = y;

    if (this.dragButton === 0 || this.dragButton === 2) {
      this.x -= dx / this.zoom;
      this.y -= dy / this.zoom;
      this.targetX = this.x;
      this.targetY = this.y;
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.dragButton = -1;
  }

  onWheel(screenX, screenY, delta) {
    const factor = delta > 0 ? 0.9 : 1.1;
    this.zoomAt(screenX, screenY, factor);
  }
};
