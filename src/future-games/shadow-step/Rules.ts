import type { Difficulty } from "../../shared/contracts/AIController";
export const CELL = 44,
  LEFT = 56,
  TOP = 174;
export type Point = { x: number; y: number };
export const SHADOW_TIERS = {
  medium: { sweep: 0.48, range: 142, exposure: 0.75 },
  hard: { sweep: 0.7, range: 166, exposure: 0.52 },
  impossible: { sweep: 0.92, range: 186, exposure: 0.34 },
};
export class ShadowWorld {
  x = 78;
  y = 548;
  level = 1;
  lives = 3;
  score = 0;
  done = false;
  time = 0;
  exposure = 0;
  recovery = 0;
  transition = 0;
  key = false;
  walls = new Set<number>();
  guards: { x: number; y: number; angle: number }[] = [];
  path: Point[] = [];
  readonly settings;
  constructor(readonly difficulty: Difficulty = "medium") {
    this.settings = SHADOW_TIERS[difficulty];
    this.room();
  }
  center(c: number, r: number): Point {
    return { x: LEFT + c * CELL + CELL / 2, y: TOP + r * CELL + CELL / 2 };
  }
  tile(x: number, y: number) {
    return {
      c: Math.floor((x - LEFT) / CELL),
      r: Math.floor((y - TOP) / CELL),
    };
  }
  room() {
    this.walls.clear();
    for (let r = 1; r < 8; r += 2)
      for (let c = 1; c < 7; c += 2)
        if ((r + c + this.level) % 5 !== 0) this.walls.add(r * 7 + c);
    this.x = this.center(0, 8).x;
    this.y = this.center(0, 8).y;
    this.key = false;
    this.exposure = 0;
    this.path = [];
    this.guards = [
      { ...this.center(3, 4), angle: 0 },
      { ...this.center(5, 2), angle: Math.PI },
    ];
    this.walls.delete(4 * 7 + 3);
    this.walls.delete(2 * 7 + 5);
  }
  get treasure() {
    return this.center(6, 4);
  }
  get exit() {
    return this.center(6, 0);
  }
  free(c: number, r: number) {
    return c >= 0 && c < 7 && r >= 0 && r < 9 && !this.walls.has(r * 7 + c);
  }
  route(x: number, y: number) {
    if (this.done || this.recovery || this.transition) return;
    const a = this.tile(this.x, this.y),
      b = this.tile(x, y);
    if (!this.free(b.c, b.r)) return;
    const start = a.r * 7 + a.c,
      end = b.r * 7 + b.c,
      q = [start],
      prev = new Map<number, number>([[start, -1]]);
    for (let i = 0; i < q.length; i++) {
      const n = q[i];
      if (n === end) break;
      for (const [dc, dr] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const c = (n % 7) + dc,
          r = Math.floor(n / 7) + dr,
          k = r * 7 + c;
        if (this.free(c, r) && !prev.has(k)) {
          prev.set(k, n);
          q.push(k);
        }
      }
    }
    if (!prev.has(end)) return;
    const p: Point[] = [];
    for (let n = end; n !== start; n = prev.get(n)!)
      p.push(this.center(n % 7, Math.floor(n / 7)));
    this.path = p.reverse();
  }
  visible(g: Point & { angle: number }, x = this.x, y = this.y) {
    const dx = x - g.x,
      dy = y - g.y,
      d = Math.hypot(dx, dy);
    if (d > this.settings.range) return false;
    if (d < 18) return true;
    const a = Math.atan2(dy, dx) - g.angle;
    if (Math.cos(a) < Math.cos(0.43)) return false;
    for (let t = 0; t <= d; t += 6) {
      const p = this.tile(
        g.x + (dx * t) / Math.max(1, d),
        g.y + (dy * t) / Math.max(1, d),
      );
      if (!this.free(p.c, p.r)) return false;
    }
    return true;
  }
  move(dx: number, dy: number, dt: number) {
    const l = Math.hypot(dx, dy);
    if (!l) return;
    const v = (110 * dt) / l;
    for (const axis of ["x", "y"] as const) {
      const nx = this.x + (axis === "x" ? dx * v : 0),
        ny = this.y + (axis === "y" ? dy * v : 0);
      if (
        [
          [-9, -9],
          [-9, 9],
          [9, -9],
          [9, 9],
        ].every(([a, b]) => {
          const t = this.tile(nx + a, ny + b);
          return this.free(t.c, t.r);
        })
      ) {
        this.x = nx;
        this.y = ny;
      }
    }
  }
  step(dt: number, dx = 0, dy = 0) {
    if (this.done) return;
    this.time += dt;
    if (this.transition > 0) {
      this.transition = Math.max(0, this.transition - dt);
      if (!this.transition) {
        this.level++;
        if (this.level > 5) this.done = true;
        else this.room();
      }
      return;
    }
    for (let i = 0; i < this.guards.length; i++)
      this.guards[i].angle =
        this.time * this.settings.sweep * (i ? -1 : 1) +
        i * Math.PI +
        this.level * 0.4;
    if (this.recovery > 0) {
      this.recovery = Math.max(0, this.recovery - dt);
      return;
    }
    if (dx || dy) {
      this.path = [];
      this.move(dx, dy, dt);
    } else if (this.path.length) {
      const p = this.path[0],
        d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < 110 * dt) {
        this.x = p.x;
        this.y = p.y;
        this.path.shift();
      } else this.move(p.x - this.x, p.y - this.y, dt);
    }
    this.exposure = Math.max(
      0,
      this.exposure + (this.guards.some((g) => this.visible(g)) ? dt : -dt * 2),
    );
    if (this.exposure >= this.settings.exposure) {
      this.lives--;
      this.exposure = 0;
      this.recovery = 1;
      this.path = [];
      const p = this.center(0, 8);
      this.x = p.x;
      this.y = p.y;
      if (!this.lives) this.done = true;
      return;
    }
    if (
      !this.key &&
      Math.hypot(this.x - this.treasure.x, this.y - this.treasure.y) < 19
    ) {
      this.key = true;
      this.score += 25;
    }
    if (
      this.key &&
      Math.hypot(this.x - this.exit.x, this.y - this.exit.y) < 19
    ) {
      this.score += 100;
      this.transition = 0.85;
      this.path = [];
    }
  }
}
