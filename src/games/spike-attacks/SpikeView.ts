import type { SpikeMatch } from "./Rules";
/** Presentation-only interpolation; neither camera nor animation can move a collider. */
export class SpikeView {
  private previous = [
    { x: 108, y: 208 },
    { x: 212, y: 208 },
  ];
  private lengths = [0, 0, 0, 0];
  private angles = [0, 0];
  capture(m: SpikeMatch) {
    for (let i = 0; i < 2; i++)
      Object.assign(this.previous[i], { x: m.players[i].x, y: m.players[i].y });
    this.lengths.splice(0, 4, ...m.lengths);
  }
  reset(m: SpikeMatch) {
    this.capture(m);
    this.angles = [0, 0];
  }
  sample(m: SpikeMatch, alpha: number, dt: number) {
    const t = Math.max(0, Math.min(1, alpha));
    return {
      lengths: m.lengths.map(
        (n, i) => this.lengths[i] + (n - this.lengths[i]) * t,
      ),
      players: m.players.map((p, i) => {
        const dx = p.tx - p.x,
          dy = p.ty - p.y,
          moving = Math.hypot(dx, dy) > 1;
        if (moving) {
          const goal = Math.atan2(dy, dx) + Math.PI / 2;
          const delta = Math.atan2(
            Math.sin(goal - this.angles[i]),
            Math.cos(goal - this.angles[i]),
          );
          this.angles[i] += delta * (1 - Math.exp(-18 * dt));
        }
        return {
          ...p,
          x: this.previous[i].x + (p.x - this.previous[i].x) * t,
          y: this.previous[i].y + (p.y - this.previous[i].y) * t,
          angle: this.angles[i],
          moving,
        };
      }),
    };
  }
}
