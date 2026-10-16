import { recoveryPose } from "./Recovery";
import type { BirdsMatch } from "./Rules";
export class BirdView {
  private previous = [
    { x: 100, y: 230, vy: 0 },
    { x: 220, y: 230, vy: 0 },
  ];
  private faces = [1, -1];
  private angles = [0, 0];
  readonly wings = [0, 0];
  readonly bumps = [0, 0];
  readonly trails = [
    Array.from({ length: 6 }, () => ({ x: 100, y: 230 })),
    Array.from({ length: 6 }, () => ({ x: 220, y: 230 })),
  ];
  private trailAge = 0;
  capture(m: BirdsMatch) {
    for (let i = 0; i < 2; i++) {
      const p = m.players[i];
      Object.assign(this.previous[i], { x: p.x, y: p.y, vy: p.vy });
    }
  }
  reset(m: BirdsMatch) {
    this.capture(m);
    for (const i of [0, 1] as const) this.resetBird(m, i);
  }
  resetBird(m: BirdsMatch, i: 0 | 1) {
    const p = m.players[i];
    Object.assign(this.previous[i], { x: p.x, y: p.y, vy: p.vy });
    this.faces[i] = p.direction;
    this.angles[i] = 0;
    this.wings[i] = 0;
    this.bumps[i] = 0;
    for (const t of this.trails[i]) Object.assign(t, this.previous[i]);
  }
  sample(m: BirdsMatch, t: number, dt: number) {
    const alpha = Math.max(0, Math.min(1, t));
    const result = m.players.map((p, i) => {
      const prev = this.previous[i];
      this.faces[i] += (p.direction - this.faces[i]) * (1 - Math.exp(-26 * dt));
      this.angles[i] +=
        (Math.max(-0.5, Math.min(0.75, p.vy / 400)) - this.angles[i]) *
        (1 - Math.exp(-14 * dt));
      this.wings[i] = Math.max(0, this.wings[i] - dt * 5);
      this.bumps[i] *= Math.exp(-18 * dt);
      return {
        ...p,
        saturation: p.alive ? 1 : recoveryPose(p.recovery).tint,
        x: prev.x + (p.x - prev.x) * alpha,
        y: prev.y + (p.y - prev.y) * alpha,
        face: this.faces[i],
        angle: this.angles[i],
        wing: this.wings[i],
        bump: this.bumps[i],
      };
    });
    this.trailAge += dt;
    if (this.trailAge >= 0.045) {
      this.trailAge %= 0.045;
      for (let i = 0; i < 2; i++) {
        for (let j = 5; j > 0; j--)
          Object.assign(this.trails[i][j], this.trails[i][j - 1]);
        Object.assign(this.trails[i][0], result[i]);
      }
    }
    return result;
  }
}
