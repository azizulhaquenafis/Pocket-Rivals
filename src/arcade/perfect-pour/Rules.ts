import type { Difficulty } from "../../shared/contracts/AIController";
export class PourWorld {
  round = 1;
  score = 0;
  lives = 3;
  done = false;
  volume = 0;
  pending = 0;
  holding = false;
  started = false;
  settling = 0;
  between = 0;
  rating = 0;
  lastError = 0;
  time = 0;
  constructor(readonly difficulty: Difficulty = "medium") {}
  get target() {
    return [0.62, 0.75, 0.55, 0.8, 0.68, 0.58, 0.72, 0.65, 0.82, 0.6][
      this.round - 1
    ];
  }
  get flow() {
    return (
      this.capacity /
      ({ medium: 3.1, hard: 2.6, impossible: 2.05 }[this.difficulty] +
        (this.round % 3) * 0.35)
    );
  }
  width(height: number) {
    const t = Math.max(0, Math.min(1, height / 270));
    switch ((this.round - 1) % 5) {
      case 0:
        return 95;
      case 1:
        return 55 + 85 * t;
      case 2:
        return 120 - 65 * t;
      case 3:
        return 60 + 70 * Math.sin(t * Math.PI);
      default:
        return 65 + 55 * Math.pow(Math.sin(t * Math.PI * 1.5), 2);
    }
  }
  private profiles = new Map<number, Float64Array>();
  private get areas() {
    const id = (this.round - 1) % 5;
    let areas = this.profiles.get(id);
    if (!areas) {
      areas = new Float64Array(271);
      for (let h = 0; h < 270; h++)
        areas[h + 1] = areas[h] + this.width(h + 0.5);
      this.profiles.set(id, areas);
    }
    return areas;
  }
  get capacity() {
    return this.areas[270];
  }
  heightFor(volume: number) {
    const areas = this.areas;
    if (volume <= 0) return 0;
    if (volume >= areas[270]) return 270;
    let low = 0,
      high = 270;
    while (high - low > 1) {
      const mid = (low + high) >>> 1;
      if (areas[mid] < volume) low = mid;
      else high = mid;
    }
    return low + (volume - areas[low]) / (areas[high] - areas[low]);
  }
  hold(value: boolean) {
    if (this.done || this.between) return;
    this.holding = value;
    if (value) {
      this.started = true;
      this.settling = 0;
    }
  }
  cancel() {
    this.holding = false;
    this.started = false;
    this.settling = 0;
  }
  private judge() {
    const fraction = this.volume / this.capacity;
    this.lastError = Math.abs(fraction - this.target);
    this.rating = Math.max(
      0,
      Math.round(
        100 -
          this.lastError *
            { medium: 350, hard: 450, impossible: 550 }[this.difficulty],
      ),
    );
    if (fraction > 1.01) this.rating = 0;
    this.score += this.rating;
    if (this.rating < 75) this.lives--;
    this.between = 1.5;
    this.holding = false;
    this.pending = 0;
  }
  step(dt: number) {
    if (this.done) return;
    this.time += dt;
    if (this.between) {
      this.between = Math.max(0, this.between - dt);
      if (!this.between) {
        if (this.round === 10 || !this.lives) {
          this.done = true;
          return;
        }
        this.round++;
        this.volume = 0;
        this.pending = 0;
        this.started = false;
        this.settling = 0;
      }
      return;
    }
    if (this.holding) this.pending += this.flow * dt;
    const arriving =
      this.pending *
      (1 -
        Math.exp(
          -dt / { medium: 0.12, hard: 0.18, impossible: 0.24 }[this.difficulty],
        ));
    this.pending -= arriving;
    this.volume += arriving;
    if (this.volume > this.capacity * 1.04) {
      this.judge();
      return;
    }
    if (this.started && !this.holding) {
      this.settling += dt;
      if (this.settling > 0.55) {
        this.volume += this.pending;
        this.judge();
      }
    }
  }
}
