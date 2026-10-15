/** Presentation physics only: the legal timing score remains owned by Rules. */
export class StrikePhysics {
  y = 602;
  velocity: number;
  settled = false;
  contacted = false;
  peaked = false;
  constructor(score: number) {
    this.velocity = -Math.sqrt(
      2 * 2200 * (score === 100 ? 365 : (score / 100) * 348),
    );
  }
  step(dt: number) {
    if (this.settled) return;
    const previous = this.velocity;
    this.y += this.velocity * dt + 1100 * dt * dt;
    this.velocity += 2200 * dt;
    // Puck radius 10, bell bottom 244: actual separating contact at 254.
    if (this.y <= 254 && this.velocity < 0) {
      this.y = 254;
      this.velocity = -this.velocity * 0.28;
      this.contacted = true;
    }
    if (previous <= 0 && this.velocity >= 0) this.peaked = true;
    if (this.y >= 602 && this.velocity >= 0) {
      this.y = 602;
      this.velocity = 0;
      this.settled = true;
      this.peaked = true;
    }
  }
}
export class ImpactRing {
  angle = 0;
  velocity = 0;
  strike() {
    this.velocity += 2.8;
  }
  step(dt: number) {
    this.velocity += (-65 * this.angle - 9 * this.velocity) * dt;
    this.angle += this.velocity * dt;
  }
}
