import type { Difficulty } from "../../shared/contracts/AIController";
export const GLIDER_TIERS = {
  medium: { speed: 82, gap: 150, ring: 37, wind: 12, landing: 65 },
  hard: { speed: 103, gap: 124, ring: 30, wind: 23, landing: 53 },
  impossible: { speed: 125, gap: 104, ring: 24, wind: 32, landing: 43 },
};
export class GliderWorld {
  x = 210;
  y = 0;
  vx = 0;
  level = 1;
  score = 0;
  lives = 3;
  done = false;
  time = 0;
  recovery = 0;
  transition = 0;
  rings = 0;
  pending = 0;
  readonly settings;
  targets: { x: number; y: number; hit: boolean; passed: boolean }[] = [];
  walls: { x: number; y: number }[] = [];
  constructor(readonly difficulty: Difficulty = "medium") {
    this.settings = GLIDER_TIERS[difficulty];
    this.course();
  }
  get length() {
    return 1550 + Math.min(3, this.level) * 80;
  }
  get landing() {
    return 210 + Math.sin(Math.min(3, this.level) * 2) * 75;
  }
  course() {
    this.x = 210;
    this.y = 0;
    this.vx = 0;
    this.rings = 0;
    this.pending = 0;
    this.targets = [];
    this.walls = [];
    for (let i = 0; i < 6; i++) {
      const x = 210 + Math.sin(i * 1.8 + this.level) * 75;
      this.targets.push({ x, y: 230 + i * 220, hit: false, passed: false });
      if (i < 5) this.walls.push({ x, y: 320 + i * 220 });
    }
  }
  get wind() {
    return Math.sin(this.y / 170 + this.level) * this.settings.wind;
  }
  step(dt: number, steer = 0, brake = false) {
    if (this.done) return;
    this.time += dt;
    if (this.transition) {
      this.transition = Math.max(0, this.transition - dt);
      if (!this.transition) {
        this.level++;
        if (this.level > 3) this.done = true;
        else this.course();
      }
      return;
    }
    if (this.recovery) {
      this.recovery = Math.max(0, this.recovery - dt);
      return;
    }
    const old = this.y;
    this.vx += (steer * 135 + this.wind - this.vx) * (1 - Math.exp(-4 * dt));
    this.x = Math.max(39, Math.min(381, this.x + this.vx * dt));
    this.y += this.settings.speed * (brake ? 0.57 : 1) * dt;
    for (const r of this.targets)
      if (!r.passed && old < r.y && this.y >= r.y) {
        r.passed = true;
        if (Math.abs(this.x - r.x) <= this.settings.ring) {
          r.hit = true;
          this.rings++;
          this.pending += 30;
        }
      }
    for (const w of this.walls)
      if (
        this.y + 7 >= w.y - 9 &&
        this.y - 7 <= w.y + 9 &&
        Math.abs(this.x - w.x) > this.settings.gap / 2 - 9
      ) {
        this.crash();
        return;
      }
    if (this.y >= this.length) {
      if (
        Math.abs(this.x - this.landing) < this.settings.landing &&
        Math.abs(this.vx) < 55 &&
        this.rings >= 2
      ) {
        this.score += 200 + this.pending;
        this.transition = 1;
      } else this.crash();
    }
  }
  crash() {
    this.lives--;
    if (!this.lives) {
      this.done = true;
      return;
    }
    this.course();
    this.recovery = 1;
  }
}
