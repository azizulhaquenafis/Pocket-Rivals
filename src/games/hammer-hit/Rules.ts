export const ATTEMPTS = 3;
export function needle(time: number, attempt: number) {
  return Math.sin(time * (2.6 + attempt * 0.35) - Math.PI / 2);
}
export function strikeScore(position: number) {
  return Math.round(100 * (1 - Math.min(1, Math.abs(position))));
}
export class HammerMatch {
  scores: [number[], number[]] = [[], []];
  clocks = [0, 0];
  cooldowns = [0.6, 0.6];
  locked = [-1, -1];
  update(dt: number) {
    for (let p = 0; p < 2; p++) {
      if (this.cooldowns[p] > 0) {
        this.cooldowns[p] = Math.max(0, this.cooldowns[p] - dt);
        continue;
      }
      if (this.scores[p].length < ATTEMPTS) this.clocks[p] += dt;
    }
  }
  position(p: number) {
    return needle(this.clocks[p], this.scores[p].length);
  }
  hit(p: 0 | 1) {
    if (this.cooldowns[p] > 0 || this.scores[p].length >= ATTEMPTS) return null;
    const position = this.position(p),
      score = strikeScore(position);
    this.locked[p] = position;
    this.scores[p].push(score);
    this.clocks[p] = 0;
    this.cooldowns[p] = 1.1;
    return score;
  }
  get totals() {
    return this.scores.map((s) => s.reduce((a, b) => a + b, 0)) as [
      number,
      number,
    ];
  }
  get done() {
    return this.scores.every((s) => s.length === ATTEMPTS);
  }
  get winner(): 1 | 2 | "draw" | null {
    if (!this.done) return null;
    const [a, b] = this.totals;
    return a === b ? "draw" : a > b ? 1 : 2;
  }
  get averages() {
    return this.totals.map((n) => n / ATTEMPTS) as [number, number];
  }
}
