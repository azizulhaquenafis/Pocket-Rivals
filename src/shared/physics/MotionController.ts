/** Acceleration-limited, critically damped movement. Targets may change; motion stays continuous. */
export class MotionController {
  vx = 0;
  vy = 0;
  private tx: number;
  private ty: number;
  constructor(x: number, y: number) {
    this.tx = x;
    this.ty = y;
  }
  reset(x: number, y: number) {
    this.vx = this.vy = 0;
    this.tx = x;
    this.ty = y;
  }
  move(
    dt: number,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number,
    acceleration = speed * 7,
  ) {
    const blend = 1 - Math.exp(-18 * dt);
    this.tx += (targetX - this.tx) * blend;
    this.ty += (targetY - this.ty) * blend;
    const dx = this.tx - x,
      dy = this.ty - y,
      d = Math.hypot(dx, dy);
    const desired = Math.min(speed, d * 10, Math.sqrt(2 * acceleration * d));
    const wantX = d > 0.3 ? (dx / d) * desired : 0,
      wantY = d > 0.3 ? (dy / d) * desired : 0;
    const ax = wantX - this.vx,
      ay = wantY - this.vy,
      a = Math.hypot(ax, ay),
      s = a ? Math.min(1, (acceleration * dt) / a) : 0;
    this.vx += ax * s;
    this.vy += ay * s;
    // A subpixel deadband avoids limit cycles, without snapping a visible distance.
    if (d < 0.3 && Math.hypot(this.vx, this.vy) < 3) this.vx = this.vy = 0;
    return { x: x + this.vx * dt, y: y + this.vy * dt };
  }
}
