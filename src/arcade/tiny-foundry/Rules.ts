import type { Difficulty } from "../../shared/contracts/AIController";
export const FOUNDRY_TIERS = {
  medium: { speed: 0.65, width: 90, tolerance: 20, flow: 32 },
  hard: { speed: 0.95, width: 74, tolerance: 14, flow: 36 },
  impossible: { speed: 1.25, width: 60, tolerance: 9, flow: 40 },
};
export class FoundryWorld {
  level = 1;
  lives = 3;
  score = 0;
  done = false;
  time = 0;
  age = 0;
  fill = 0;
  spill = 0;
  pouring = false;
  settling = false;
  transition = 0;
  grade = 0;
  accepted = false;
  accumulator = 0;
  drops: { x: number; y: number; vy: number; vx: number }[] = [];
  readonly settings;
  constructor(readonly difficulty: Difficulty = "medium") {
    this.settings = FOUNDRY_TIERS[difficulty];
  }
  get target() {
    return [65, 80, 55, 90][(Math.min(8, this.level) - 1) % 4];
  }
  get x() {
    return (
      210 +
      Math.sin(
        this.time * this.settings.speed + Math.min(8, this.level) * 0.4,
      ) *
        100
    );
  }
  get upgrade() {
    return Math.floor((Math.min(8, this.level) - 1) / 2);
  }
  hold(value: boolean) {
    if (!this.done && !this.settling && !this.transition) this.pouring = value;
  }
  finish() {
    if (this.done || this.settling || this.transition || this.age < 0.3)
      return false;
    this.pouring = false;
    this.settling = true;
    return true;
  }
  step(dt: number) {
    if (this.done) return;
    this.time += dt;
    if (this.transition) {
      this.transition = Math.max(0, this.transition - dt);
      if (!this.transition) {
        if (this.accepted) this.level++;
        if (this.level > 8) {
          this.done = true;
          return;
        }
        this.fill = 0;
        this.spill = 0;
        this.age = 0;
        this.settling = false;
        this.drops = [];
      }
      return;
    }
    this.age += dt;
    if (this.age > 22) this.finish();
    if (this.pouring && !this.settling) {
      this.accumulator += dt * this.settings.flow;
      while (this.accumulator >= 1) {
        this.accumulator--;
        this.drops.push({
          x: 210,
          y: 255,
          vy: 55,
          vx: Math.sin(this.time * 37) * Math.max(0, 14 - this.upgrade * 4),
        });
      }
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.vy += 600 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y >= 477) {
        if (Math.abs(d.x - this.x) <= this.settings.width / 2 - 4) {
          if (this.fill < 100) this.fill++;
          else this.spill++;
        } else this.spill++;
        this.drops.splice(i, 1);
      }
    }
    if (this.settling && !this.drops.length) {
      const error = Math.abs(this.fill - this.target);
      this.grade = Math.max(0, Math.round(100 - error * 2 - this.spill * 0.35));
      this.accepted = error <= this.settings.tolerance;
      if (this.accepted) this.score += this.grade;
      else this.lives--;
      this.transition = 1.3;
      if (!this.lives) this.done = true;
    }
  }
}
