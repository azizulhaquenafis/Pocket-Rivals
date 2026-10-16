import type { GravityMatch } from "./Rules";
/** Interpolate simulation positions; presentation never writes back to physics. */
export class GravityView {
  private distance = 0;
  private age = 0;
  private y = [160, 160];
  private vy = [0, 0];
  readonly angles = [-Math.PI / 2, -Math.PI / 2];
  private targets = [-Math.PI / 2, -Math.PI / 2];
  readonly landing = [0, 0];
  capture(m: GravityMatch) {
    this.distance = m.distance;
    this.age = m.age;
    for (let i = 0; i < 2; i++) {
      this.y[i] = m.players[i].y;
      this.vy[i] = m.players[i].vy;
    }
  }
  reset(m: GravityMatch) {
    this.capture(m);
    for (let i = 0; i < 2; i++) {
      this.angles[i] = this.targets[i] =
        m.players[i].gravity === 1 ? -Math.PI / 2 : Math.PI / 2;
      this.landing[i] = 0;
    }
  }
  flip(p: number) {
    this.targets[p] += Math.PI;
  }
  land(p: number) {
    this.landing[p] = 1;
  }
  sample(m: GravityMatch, alpha: number, dt: number) {
    const t = Math.max(0, Math.min(1, alpha));
    for (let i = 0; i < 2; i++) {
      this.angles[i] +=
        (this.targets[i] - this.angles[i]) * (1 - Math.exp(-22 * dt));
      this.landing[i] *= Math.exp(-16 * dt);
    }
    return {
      distance: this.distance + (m.distance - this.distance) * t,
      age: this.age + (m.age - this.age) * t,
      players: m.players.map((p, i) => ({
        ...p,
        y: this.y[i] + (p.y - this.y[i]) * t,
        vy: this.vy[i] + (p.vy - this.vy[i]) * t,
        angle: this.angles[i],
        landing: this.landing[i],
      })),
    };
  }
}
