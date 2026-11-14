import type { Difficulty } from "../../shared/contracts/AIController";
export const DRIFT_TIERS = {
  medium: { speed: 104, width: 36, turn: 2.7, grip: 6 },
  hard: { speed: 125, width: 30, turn: 2.9, grip: 5 },
  impossible: { speed: 145, width: 25, turn: 3.1, grip: 4 },
};
export class DriftWorld {
  x = 210;
  y = 579;
  angle = 0;
  vx = 0;
  vy = 0;
  time = 0;
  lives = 5;
  score = 0;
  lap = 0;
  checkpoint = 0;
  done = false;
  offroad = 0;
  recovery = 0;
  drift = 0;
  combo = 0;
  readonly settings;
  trail: { x: number; y: number }[] = [];
  private trailTime = 0;
  constructor(readonly difficulty: Difficulty = "medium") {
    this.settings = DRIFT_TIERS[difficulty];
  }
  point(theta: number) {
    return { x: 210 + 124 * Math.cos(theta), y: 383 + 196 * Math.sin(theta) };
  }
  get theta() {
    return Math.atan2((this.y - 383) / 196, (this.x - 210) / 124);
  }
  get gates() {
    return [-Math.PI, -Math.PI / 2, 0, Math.PI / 2].map((a) => this.point(a));
  }
  get progress() {
    return (Math.PI / 2 - this.theta + Math.PI * 2) % (Math.PI * 2);
  }
  get barriers() {
    return [this.point(-0.4), this.point(Math.PI - 0.4)].map((p, i) => ({
      x: p.x + (i ? -1 : 1) * 22,
      y: p.y,
      r: 10,
    }));
  }
  respawn() {
    const a = Math.PI / 2 - (this.checkpoint * Math.PI) / 2,
      p = this.point(a);
    this.x = p.x;
    this.y = p.y;
    this.angle = Math.atan2(-196 * Math.cos(a), 124 * Math.sin(a));
    this.vx = 0;
    this.vy = 0;
    this.offroad = 0;
    this.recovery = 0.9;
    this.combo = 0;
    this.trail = [];
  }
  step(dt: number, steer = 0, brake = false) {
    if (this.done) return;
    this.time += dt;
    this.recovery = Math.max(0, this.recovery - dt);
    if (this.time >= 100) {
      this.done = true;
      return;
    }
    const s = this.settings;
    steer = Math.max(-1, Math.min(1, steer));
    const speed = brake ? s.speed * 0.68 : s.speed;
    this.angle += steer * s.turn * dt;
    const forward =
        this.vx * Math.cos(this.angle) + this.vy * Math.sin(this.angle),
      side = -this.vx * Math.sin(this.angle) + this.vy * Math.cos(this.angle);
    const f = forward + (speed - forward) * (1 - Math.exp(-2.7 * dt)),
      l = side * Math.exp(-(brake ? s.grip * 0.33 : s.grip) * dt);
    this.vx = f * Math.cos(this.angle) - l * Math.sin(this.angle);
    this.vy = f * Math.sin(this.angle) + l * Math.cos(this.angle);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const r = Math.hypot((this.x - 210) / 124, (this.y - 383) / 196),
      road = Math.abs(r - 1) * 124;
    if (road > s.width) {
      this.offroad += dt;
      this.vx *= Math.exp(-3 * dt);
      this.vy *= Math.exp(-3 * dt);
    } else this.offroad = Math.max(0, this.offroad - dt * 3);
    if (
      !this.recovery &&
      (this.x < 38 ||
        this.x > 382 ||
        this.y < 126 ||
        this.y > 638 ||
        this.offroad > 0.55 ||
        this.barriers.some(
          (b) => Math.hypot(this.x - b.x, this.y - b.y) < b.r + 8,
        ))
    ) {
      this.lives--;
      if (!this.lives) this.done = true;
      else this.respawn();
      return;
    }
    const target = this.point(
      Math.PI / 2 - ((this.checkpoint + 1) * Math.PI) / 2,
    );
    if (Math.hypot(this.x - target.x, this.y - target.y) < 42) {
      this.checkpoint++;
      this.score += 25;
      if (this.checkpoint === 4) {
        this.checkpoint = 0;
        this.lap++;
        this.score += 100;
        if (this.lap === 3) this.done = true;
      }
    }
    this.drift = road < s.width && Math.abs(l) > 12 ? Math.abs(l) : 0;
    if (this.drift) {
      this.combo += dt;
      this.score +=
        Math.floor(this.combo * 5) - Math.floor((this.combo - dt) * 5);
    } else this.combo = Math.max(0, this.combo - dt * 0.5);
    this.trailTime += dt;
    if (this.trailTime > 0.035) {
      this.trailTime = 0;
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 50) this.trail.shift();
    }
  }
}
