export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  cooldown: number;
}
export const BUMPERS = [
  { x: 135, y: 245, r: 24 },
  { x: 285, y: 245, r: 24 },
  { x: 210, y: 345, r: 29 },
];
export class PinballWorld {
  balls: Ball[] = [];
  lives = 3;
  score = 0;
  done = false;
  left = 0;
  right = 0;
  combo = 0;
  hits = 0;
  age = 0;
  lastHit = -10;
  launch() {
    if (this.done || this.balls.length) return false;
    this.balls.push({ x: 350, y: 550, vx: -85, vy: -600, cooldown: 0 });
    return true;
  }
  private segment(
    b: Ball,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    r: number,
    bounce: number,
    spin = 0,
  ) {
    const dx = bx - ax,
      dy = by - ay,
      t = Math.max(
        0,
        Math.min(1, ((b.x - ax) * dx + (b.y - ay) * dy) / (dx * dx + dy * dy)),
      ),
      x = ax + t * dx,
      y = ay + t * dy;
    let nx = b.x - x,
      ny = b.y - y;
    const d = Math.hypot(nx, ny);
    if (d >= r + 7) return;
    nx /= d || 1;
    ny /= d || 1;
    if (d < 1e-6) {
      nx = 0;
      ny = -1;
    }
    b.x = x + nx * (r + 7 + 0.01);
    b.y = y + ny * (r + 7 + 0.01);
    const sx = -spin * (y - ay),
      sy = spin * (x - ax),
      v = (b.vx - sx) * nx + (b.vy - sy) * ny;
    if (v < 0) {
      b.vx -= (1 + bounce) * v * nx;
      b.vy -= (1 + bounce) * v * ny;
    }
  }
  flipper(side: 0 | 1) {
    const a = side ? Math.PI - this.right : this.left;
    return {
      ax: side ? 300 : 120,
      ay: 570,
      bx: (side ? 300 : 120) + Math.cos(a) * 76,
      by: 570 + Math.sin(a) * 76,
    };
  }
  step(dt: number, left: boolean, right: boolean) {
    if (this.done) return;
    this.age += dt;
    const n = Math.ceil(dt * 240),
      h = dt / n;
    for (let i = 0; i < n; i++) {
      const oldL = this.left,
        oldR = this.right;
      this.left +=
        (left ? -0.6 : 0.3) - this.left > 0
          ? Math.min(12 * h, (left ? -0.6 : 0.3) - this.left)
          : Math.max(-12 * h, (left ? -0.6 : 0.3) - this.left);
      this.right +=
        (right ? -0.6 : 0.3) - this.right > 0
          ? Math.min(12 * h, (right ? -0.6 : 0.3) - this.right)
          : Math.max(-12 * h, (right ? -0.6 : 0.3) - this.right);
      const spawn: Ball[] = [];
      for (const b of this.balls) {
        b.cooldown = Math.max(0, b.cooldown - h);
        b.vy += 440 * h;
        b.vx *= Math.exp(-0.035 * h);
        b.vy *= Math.exp(-0.035 * h);
        b.x += b.vx * h;
        b.y += b.vy * h;
        if (b.x < 46) {
          b.x = 46;
          b.vx = Math.abs(b.vx) * 0.9;
        }
        if (b.x > 374) {
          b.x = 374;
          b.vx = -Math.abs(b.vx) * 0.9;
        }
        if (b.y < 164) {
          b.y = 164;
          b.vy = Math.abs(b.vy) * 0.9;
        }
        for (const p of BUMPERS) {
          const dx = b.x - p.x,
            dy = b.y - p.y,
            d = Math.hypot(dx, dy);
          if (d < p.r + 7) {
            const nx = dx / (d || 1),
              ny = dy / (d || 1);
            b.x = p.x + nx * (p.r + 7 + 0.01);
            b.y = p.y + ny * (p.r + 7 + 0.01);
            const v = b.vx * nx + b.vy * ny;
            if (v < 0) {
              b.vx -= 2 * v * nx;
              b.vy -= 2 * v * ny;
              b.vx += nx * 100;
              b.vy += ny * 100;
              if (!b.cooldown) {
                this.combo =
                  this.age - this.lastHit < 1.5
                    ? Math.min(5, this.combo + 1)
                    : 1;
                this.lastHit = this.age;
                this.score += 10 * this.combo;
                this.hits++;
                b.cooldown = 0.12;
                if (this.hits % 8 === 0 && this.balls.length + spawn.length < 3)
                  spawn.push({
                    x: 350,
                    y: 540,
                    vx: -150,
                    vy: -560,
                    cooldown: 0.3,
                  });
              }
            }
          }
        }
        this.segment(b, 48, 460, 120, 545, 8, 0.85);
        this.segment(b, 372, 460, 300, 545, 8, 0.85);
        for (const side of [0, 1] as const) {
          const f = this.flipper(side),
            spin = side ? -(this.right - oldR) / h : (this.left - oldL) / h;
          this.segment(b, f.ax, f.ay, f.bx, f.by, 8, 0.8, spin);
        }
        const v = Math.hypot(b.vx, b.vy);
        if (v > 760) {
          b.vx *= 760 / v;
          b.vy *= 760 / v;
        }
      }
      const had = this.balls.length;
      this.balls = this.balls.filter((b) => b.y < 662);
      this.balls.push(...spawn);
      if (had && !this.balls.length) {
        this.lives--;
        this.combo = 0;
        if (!this.lives) this.done = true;
      }
    }
  }
}
