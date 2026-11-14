import type { Difficulty } from "../../shared/contracts/AIController";
import { MatchRandom } from "../../shared/ai/MatchRandom";
export const MAGNET_TIERS = {
  medium: { speed: 128, spacing: 260, pull: 820 },
  hard: { speed: 165, spacing: 245, pull: 950 },
  impossible: { speed: 200, spacing: 240, pull: 1050 },
};
export class MagnetWorld {
  x = 100;
  vx = 0;
  side = -1;
  time = 0;
  lives = 3;
  score = 0;
  done = false;
  recovery = 0;
  distance = 0;
  rows: { y: number; side: number; coin: boolean; passed: boolean }[] = [];
  readonly settings;
  private rng;
  private until = 0;
  constructor(
    readonly difficulty: Difficulty = "medium",
    seed?: number,
  ) {
    this.settings = MAGNET_TIERS[difficulty];
    this.rng = new MatchRandom(seed);
    this.rows = [{ y: 180, side: -1, coin: true, passed: false }];
    this.until = this.settings.spacing;
  }
  flip() {
    if (!this.done) this.side *= -1;
  }
  step(dt: number) {
    if (this.done) return;
    this.time += dt;
    this.recovery = Math.max(0, this.recovery - dt);
    const target = this.side < 0 ? 100 : 320;
    this.vx +=
      (Math.sign(target - this.x) * this.settings.pull - this.vx * 4) * dt;
    this.x += this.vx * dt;
    if (this.x < 100) {
      this.x = 100;
      this.vx = Math.max(0, this.vx);
    }
    if (this.x > 320) {
      this.x = 320;
      this.vx = Math.min(0, this.vx);
    }
    if (Math.abs(target - this.x) < 1.5 && Math.abs(this.vx) < 25) {
      this.x = target;
      this.vx = 0;
    }
    const speed = this.settings.speed + Math.min(75, this.time * 1.1),
      travel = speed * dt;
    this.distance += travel;
    this.until -= travel;
    if (this.until <= 0) {
      this.until += this.settings.spacing + this.rng.next() * 50;
      this.rows.push({
        y: 115,
        side: this.rng.next() < 0.5 ? -1 : 1,
        coin: true,
        passed: false,
      });
    }
    for (const row of this.rows) {
      row.y += travel;
      const hx = row.side < 0 ? 100 : 320,
        cx = row.side < 0 ? 320 : 100;
      if (
        !this.recovery &&
        Math.abs(row.y - 500) < 26 &&
        Math.abs(this.x - hx) < 53
      ) {
        this.lives--;
        this.recovery = 1;
        row.passed = true;
        if (!this.lives) this.done = true;
      }
      if (row.coin && Math.hypot(row.y - 500, this.x - cx) < 24) {
        row.coin = false;
        this.score += 20;
      }
      if (!row.passed && row.y > 530) {
        row.passed = true;
        this.score += 5;
      }
    }
    this.rows = this.rows.filter((r) => r.y < 680);
  }
}
