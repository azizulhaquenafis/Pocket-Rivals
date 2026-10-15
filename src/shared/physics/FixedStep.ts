export class FixedStep {
  private accumulator = 0;
  readonly step = 1 / 120;
  advance(deltaSeconds: number, tick: (dt: number) => void) {
    this.accumulator += Math.max(0, Math.min(deltaSeconds, 0.1));
    let n = 0;
    while (this.accumulator + 1e-10 >= this.step && n++ < 12) {
      tick(this.step);
      this.accumulator -= this.step;
    }
  }
  reset() {
    this.accumulator = 0;
  }
  get remainder() {
    return this.accumulator;
  }
  get fraction() {
    return Math.min(1, Math.max(0, this.accumulator / this.step));
  }
}
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
