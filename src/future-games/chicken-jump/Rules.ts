import { MatchRandom } from "../../shared/ai/MatchRandom";
export interface Chicken {
  score: number;
  x: number;
  block: number;
  direction: number;
  width: number;
  phase: "sliding" | "jumping" | "miss";
  y: number;
  vy: number;
  age: number;
  stack: { x: number; width: number }[];
}
export class ChickenMatch {
  readonly players: [Chicken, Chicken];
  winner: 1 | 2 | "draw" | null = null;
  time = 0;
  constructor(seed: number) {
    const r = new MatchRandom(seed);
    const start = 28 + r.next() * 144;
    const make = (): Chicken => ({
      score: 0,
      x: 100,
      block: start,
      direction: r.side,
      width: 65,
      phase: "sliding",
      y: 0,
      vy: 0,
      age: 0,
      stack: [],
    });
    this.players = [make(), make()];
  }
  speed(p: Chicken) {
    return 92 + Math.min(85, p.score * 8);
  }
  stop(i: 0 | 1) {
    const p = this.players[i];
    if (this.winner || p.phase !== "sliding") return false;
    p.phase = "jumping";
    p.vy = -310;
    p.y = 0;
    p.age = 0;
    return true;
  }
  step(dt: number) {
    if (this.winner) return;
    this.time += dt;
    for (const p of this.players) {
      p.age += dt;
      if (p.phase === "sliding") {
        p.block += p.direction * this.speed(p) * dt;
        const edge = p.width / 2 + 4;
        if (p.block < edge) {
          p.block = edge + (edge - p.block);
          p.direction = 1;
        }
        if (p.block > 200 - edge) {
          p.block = 200 - edge - (p.block - (200 - edge));
          p.direction = -1;
        }
      } else if (p.phase === "jumping") {
        const old = p.y;
        p.vy += 800 * dt;
        p.y += p.vy * dt;
        if (
          p.vy > 0 &&
          old <= -26 &&
          p.y >= -26 &&
          Math.abs(p.x - p.block) <= p.width / 2 + 6
        ) {
          p.score++;
          p.x = Math.max(
            p.block - p.width / 2 + 6,
            Math.min(p.block + p.width / 2 - 6, p.x),
          );
          p.stack.push({ x: p.block, width: p.width });
          if (p.stack.length > 6) p.stack.shift();
          p.width = Math.max(38, 65 - p.score * 2.5);
          p.phase = "sliding";
          p.y = 0;
          p.vy = 0;
          p.age = 0;
        } else if (p.y > 60) {
          p.phase = "miss";
          p.age = 0;
        }
      } else if (p.age > 0.65) {
        p.phase = "sliding";
        p.y = 0;
        p.vy = 0;
        p.age = 0;
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
