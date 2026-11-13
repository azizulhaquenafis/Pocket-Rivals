import type { Difficulty } from "../../shared/contracts/AIController";
export const COLORS = [0xf49b58, 0x58addb, 0x9ac480, 0xa88dc4];
const TAU = Math.PI * 2;
export class ColorWorld {
  y = 550;
  vy = 0;
  floor = 550;
  center = 350;
  angle = 0;
  color = 0;
  score = 0;
  level = 1;
  lives = 3;
  done = false;
  camera = 0;
  grace = 0;
  transition = 0;
  private cameraFrom = 0;
  constructor(readonly difficulty: Difficulty = "medium") {}
  hop() {
    if (!this.done && !this.grace && !this.transition) this.vy = -235;
  }
  get speed() {
    return (
      { medium: 0.55, hard: 0.8, impossible: 1.05 }[this.difficulty] +
      Math.min(0.55, (this.level - 1) * 0.035)
    );
  }
  ringColor(y: number) {
    const a =
      (((Math.atan2(y - this.center, 0) - this.angle) % TAU) + TAU) % TAU;
    return Math.floor(a / (Math.PI / 2));
  }
  step(dt: number) {
    if (this.done) return;
    if (this.transition > 0) {
      this.transition = Math.max(0, this.transition - dt);
      const t = 1 - this.transition / 0.7;
      this.camera =
        this.cameraFrom +
        (550 - this.floor - this.cameraFrom) * (t * t * (3 - 2 * t));
      return; // No input, momentum or collision while introducing the next ring.
    }
    this.grace = Math.max(0, this.grace - dt);
    this.angle = (this.angle + this.speed * dt) % TAU;
    if (!this.grace) {
      this.vy += 520 * dt;
      this.y += this.vy * dt;
      if (this.y > this.floor) {
        this.y = this.floor;
        this.vy = 0;
      }
      // Test the swept vertical contact band using the ball and ring radii.
      const radius = Math.abs(this.y - this.center);
      if (Math.abs(radius - 75) < 17 && this.ringColor(this.y) !== this.color) {
        this.lives--;
        this.y = this.floor;
        this.vy = 0;
        this.grace = 0.8;
        if (!this.lives) this.done = true;
      }
      if (!this.grace && this.y < this.center - 94) {
        this.score += 100;
        this.level++;
        this.floor = this.center - 100;
        this.y = this.floor;
        this.vy = 0;
        this.center = this.floor - 200;
        this.cameraFrom = this.camera;
        this.transition = 0.7;
        this.color = (this.color + 1) % 4;
      }
    }
  }
}
