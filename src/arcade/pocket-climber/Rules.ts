import type { Difficulty } from "../../shared/contracts/AIController";
export interface Ledge {
  id: number;
  x: number;
  y: number;
  width: number;
  motion: number;
  phase: number;
  star: boolean;
  fragile?: boolean;
  crumble?: number;
}
export class ClimberWorld {
  platforms: Ledge[] = [
    { id: 0, x: 150, y: 590, width: 120, motion: 0, phase: 0, star: false },
  ];
  x = 210;
  y = 576;
  vx = 0;
  vy = -420;
  camera = 0;
  age = 0;
  score = 0;
  highest = 0;
  stars = 0;
  done = false;
  rockClock = 3;
  rocks: { x: number; y: number; vy: number; warning: number; vx: number }[] =
    [];
  constructor(
    private random = Math.random,
    readonly difficulty: Difficulty = "medium",
  ) {
    this.extend();
  }
  private extend() {
    while (this.platforms.at(-1)!.y + this.camera > 30) {
      const p = this.platforms.at(-1)!,
        width =
          { medium: 78, hard: 65, impossible: 55 }[this.difficulty] +
          this.random() * 14,
        center = Math.max(
          100,
          Math.min(320, p.x + p.width / 2 + (this.random() - 0.5) * 150),
        );
      this.platforms.push({
        id: p.id + 1,
        x: center - width / 2,
        y:
          p.y -
          { medium: 68, hard: 72, impossible: 75 }[this.difficulty] -
          this.random() * 10,
        width,
        motion:
          p.id > 1 && p.id % (this.difficulty === "medium" ? 3 : 2) === 0
            ? { medium: 14, hard: 18, impossible: 21 }[this.difficulty]
            : 0,
        fragile:
          p.id > 3 && (p.id + 1) % (this.difficulty === "medium" ? 5 : 3) === 0,
        crumble: 0,
        phase: this.random() * 6.28,
        star: (p.id + 1) % 4 === 0,
      });
    }
    this.platforms = this.platforms.filter((p) => p.y + this.camera < 700);
  }
  left(p: Ledge, age = this.age) {
    return (
      p.x +
      Math.sin(
        age * { medium: 1.2, hard: 1.5, impossible: 1.8 }[this.difficulty] +
          p.phase,
      ) *
        p.motion
    );
  }
  step(dt: number, axis: number) {
    if (this.done) return;
    this.age += dt;
    for (const p of this.platforms) if (p.crumble) p.crumble += dt;
    const oldY = this.y;
    const target = Math.max(-1, Math.min(1, axis)) * 200;
    this.vx += (target - this.vx) * (1 - Math.exp(-18 * dt));
    this.x = Math.max(46, Math.min(374, this.x + this.vx * dt));
    this.vy += 900 * dt;
    this.y += this.vy * dt;
    if (this.vy > 0)
      for (const p of this.platforms) {
        const left = this.left(p);
        if (
          (!p.crumble || p.crumble < 0.45) &&
          oldY + 12 <= p.y &&
          this.y + 12 >= p.y &&
          this.x + 10 > left &&
          this.x - 10 < left + p.width
        ) {
          this.y = p.y - 12;
          this.vy = -420;
          if (p.fragile) p.crumble = Math.max(0.001, p.crumble ?? 0);
          if (p.id > this.highest) {
            this.score += (p.id - this.highest) * 10;
            this.highest = p.id;
          }
          break;
        }
      }
    for (const p of this.platforms)
      if (
        p.star &&
        Math.hypot(this.x - (this.left(p) + p.width / 2), this.y - (p.y - 35)) <
          23
      ) {
        p.star = false;
        this.stars++;
        this.score += 50;
      }
    this.camera = Math.max(this.camera, 360 - this.y);
    this.extend();
    if (this.highest > 2) {
      this.rockClock -= dt;
      if (this.rockClock <= 0) {
        this.rockClock = Math.max(
          1.25,
          { medium: 3.2, hard: 2.6, impossible: 2.05 }[this.difficulty] -
            this.highest * 0.02,
        );
        this.rocks.push({
          x: 60 + this.random() * 300,
          y: 135 - this.camera,
          vy: 80,
          warning: { medium: 1.35, hard: 1.15, impossible: 1 }[this.difficulty],
          vx: this.difficulty === "medium" ? 0 : (this.random() - 0.5) * 65,
        });
      }
    }
    for (const r of this.rocks) {
      if (r.warning > 0) {
        r.warning -= dt;
        continue;
      }
      r.vy += 340 * dt;
      r.x += r.vx * dt;
      if (r.x < 48 || r.x > 372) {
        r.x = Math.max(48, Math.min(372, r.x));
        r.vx *= -1;
      }
      r.y += r.vy * dt;
      if (Math.hypot(this.x - r.x, this.y - r.y) < 19) this.done = true;
    }
    this.rocks = this.rocks.filter((r) => r.y + this.camera < 680).slice(-4);
    if (this.y + this.camera > 665) this.done = true;
  }
}
