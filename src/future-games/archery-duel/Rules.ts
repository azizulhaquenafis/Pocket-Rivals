import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
export interface Target {
  x: number;
  y: number;
  r: number;
  points: number;
}
export interface Archer {
  score: number;
  attempt: number;
  stage: "ready" | "horizontal" | "vertical" | "flight" | "impact";
  x: number;
  y: number;
  direction: number;
  age: number;
  targets: Target[];
  lastPoints: number;
}
export class ArcheryMatch {
  readonly players: [Archer, Archer];
  winner: 1 | 2 | "draw" | null = null;
  time = 0;
  constructor(readonly seed: number) {
    const make = (): Archer => ({
      score: 0,
      attempt: 0,
      stage: "ready",
      x: 0,
      y: 0,
      direction: 1,
      age: 1,
      targets: this.targets(0),
      lastPoints: 0,
    });
    this.players = [make(), make()];
  }
  private targets(n: number) {
    const r = new MatchRandom(mixSeed(this.seed, n));
    const left = 40 + r.next() * 85,
      right = 210 + r.next() * 85;
    return [
      { x: left, y: 40 + r.next() * 90, r: 28, points: 1 },
      { x: right, y: 30 + r.next() * 110, r: 14, points: 2 },
    ];
  }
  tap(i: 0 | 1) {
    const p = this.players[i];
    if (this.winner || p.age < 0.12) return false;
    if (p.stage === "ready") {
      p.stage = "horizontal";
      p.x = 0;
      p.y = 85;
      p.direction = 1;
    } else if (p.stage === "horizontal") {
      p.stage = "vertical";
      p.y = 0;
      p.direction = 1;
    } else if (p.stage === "vertical") p.stage = "flight";
    else return false;
    p.age = 0;
    return true;
  }
  step(dt: number) {
    if (this.winner) return;
    this.time += dt;
    for (const p of this.players) {
      p.age += dt;
      if (p.stage === "horizontal" || p.stage === "vertical") {
        const key = p.stage === "horizontal" ? "x" : "y",
          limit = key === "x" ? 340 : 170;
        p[key] += p.direction * 175 * dt;
        if (p[key] > limit) {
          p[key] = 2 * limit - p[key];
          p.direction = -1;
        }
        if (p[key] < 0) {
          p[key] = -p[key];
          p.direction = 1;
        }
      } else if (p.stage === "flight" && p.age >= 0.38) {
        p.lastPoints =
          p.targets.find((t) => Math.hypot(p.x - t.x, p.y - t.y) <= t.r)
            ?.points ?? 0;
        p.score += p.lastPoints;
        p.stage = "impact";
        p.age = 0;
      } else if (p.stage === "impact" && p.age >= 0.7) {
        p.attempt++;
        p.targets = this.targets(p.attempt);
        p.stage = "ready";
        p.age = 1;
      }
    }
    const a = this.players[0].score >= 10,
      b = this.players[1].score >= 10;
    if (a || b) this.winner = a && b ? "draw" : a ? 1 : 2;
    if (this.time >= 180 && !this.winner)
      this.winner =
        this.players[0].score === this.players[1].score
          ? "draw"
          : this.players[0].score > this.players[1].score
            ? 1
            : 2;
  }
}
