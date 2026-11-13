export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const ROOMS: { walls: Rect[]; targets: { x: number; y: number }[] }[] = [
  {
    walls: [],
    targets: [
      { x: 100, y: 230 },
      { x: 210, y: 175 },
      { x: 320, y: 230 },
    ],
  },
  {
    walls: [{ x: 155, y: 340, w: 110, h: 18 }],
    targets: [
      { x: 90, y: 260 },
      { x: 330, y: 260 },
      { x: 210, y: 200 },
    ],
  },
  {
    walls: [{ x: 130, y: 280, w: 18, h: 150 }],
    targets: [
      { x: 80, y: 190 },
      { x: 230, y: 240 },
      { x: 330, y: 190 },
    ],
  },
  {
    walls: [{ x: 200, y: 240, w: 18, h: 170 }],
    targets: [
      { x: 100, y: 220 },
      { x: 300, y: 220 },
      { x: 100, y: 410 },
      { x: 300, y: 410 },
    ],
  },
  {
    walls: [
      { x: 70, y: 330, w: 100, h: 18 },
      { x: 250, y: 330, w: 100, h: 18 },
    ],
    targets: [
      { x: 100, y: 230 },
      { x: 320, y: 230 },
      { x: 210, y: 175 },
      { x: 210, y: 430 },
    ],
  },
  {
    walls: [
      { x: 120, y: 260, w: 18, h: 160 },
      { x: 282, y: 260, w: 18, h: 160 },
    ],
    targets: [
      { x: 80, y: 200 },
      { x: 340, y: 200 },
      { x: 210, y: 310 },
      { x: 210, y: 170 },
    ],
  },
  {
    walls: [
      { x: 155, y: 270, w: 110, h: 18 },
      { x: 155, y: 420, w: 110, h: 18 },
    ],
    targets: [
      { x: 90, y: 200 },
      { x: 330, y: 200 },
      { x: 210, y: 345 },
      { x: 210, y: 170 },
    ],
  },
  {
    walls: [
      { x: 100, y: 320, w: 70, h: 18 },
      { x: 250, y: 320, w: 70, h: 18 },
      { x: 201, y: 190, w: 18, h: 75 },
    ],
    targets: [
      { x: 75, y: 200 },
      { x: 345, y: 200 },
      { x: 210, y: 370 },
      { x: 115, y: 445 },
      { x: 305, y: 445 },
    ],
  },
];
export class RicochetWorld {
  level = 0;
  score = 0;
  shots = 5;
  done = false;
  won = false;
  transition = 0;
  ball = { x: 210, y: 580, vx: 0, vy: 0 };
  flight = 0;
  moving = false;
  angle = -Math.PI / 2;
  targets = ROOMS[0].targets.map((t) => ({ ...t, alive: true }));
  get walls() {
    return ROOMS[this.level].walls;
  }
  fire(vx: number, vy: number) {
    if (this.done || this.moving || this.transition || this.shots <= 0)
      return false;
    const speed = Math.hypot(vx, vy);
    if (speed < 20) return false;
    const scale = Math.min(520, Math.max(160, speed)) / speed;
    this.ball.vx = vx * scale;
    this.ball.vy = vy * scale;
    this.shots--;
    this.flight = 0;
    this.moving = true;
    return true;
  }
  private reset() {
    this.ball = { x: 210, y: 580, vx: 0, vy: 0 };
    this.moving = false;
    if (!this.shots) this.done = true;
  }
  step(dt: number) {
    if (this.done) return;
    if (this.transition) {
      this.transition = Math.max(0, this.transition - dt);
      if (!this.transition) {
        this.level++;
        if (this.level === ROOMS.length) {
          this.level--;
          this.done = this.won = true;
          return;
        }
        this.shots = 5;
        this.targets = ROOMS[this.level].targets.map((t) => ({
          ...t,
          alive: true,
        }));
        this.reset();
      }
      return;
    }
    if (!this.moving) return;
    // Substeps keep displacement below 3px even at maximum power.
    const n = Math.ceil(dt * 240),
      h = dt / n,
      b = this.ball;
    for (let i = 0; i < n; i++) {
      b.x += b.vx * h;
      b.y += b.vy * h;
      if (b.x < 48) {
        b.x = 48;
        b.vx = Math.abs(b.vx);
      }
      if (b.x > 372) {
        b.x = 372;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y < 158) {
        b.y = 158;
        b.vy = Math.abs(b.vy);
      }
      if (b.y > 620) {
        b.y = 620;
        b.vy = -Math.abs(b.vy);
      }
      for (const r of this.walls) {
        const x = Math.max(r.x, Math.min(b.x, r.x + r.w)),
          y = Math.max(r.y, Math.min(b.y, r.y + r.h)),
          dx = b.x - x,
          dy = b.y - y,
          d = Math.hypot(dx, dy);
        if (d < 7) {
          let nx = dx / (d || 1),
            ny = dy / (d || 1);
          if (d === 0) {
            if (r.w > r.h) ny = b.vy > 0 ? -1 : 1;
            else nx = b.vx > 0 ? -1 : 1;
          }
          b.x += nx * (7 - d);
          b.y += ny * (7 - d);
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            b.vx -= 2 * vn * nx;
            b.vy -= 2 * vn * ny;
          }
        }
      }
      for (const t of this.targets)
        if (t.alive && Math.hypot(t.x - b.x, t.y - b.y) < 21) {
          t.alive = false;
          this.score += 25;
        }
    }
    this.flight += dt;
    if (this.targets.every((t) => !t.alive)) {
      this.score += 100 + this.shots * 20;
      this.moving = false;
      this.transition = 1;
    } else if (this.flight >= 4) this.reset();
  }
}
