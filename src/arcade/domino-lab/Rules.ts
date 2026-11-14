import type { Difficulty } from "../../shared/contracts/AIController";
export type Cell = { c: number; r: number };
export const SIZE = 42,
  OX = 63,
  OY = 168;
export const DOMINO_TIERS = {
  medium: { reach: 61, spare: 3, guides: true },
  hard: { reach: 48, spare: 1, guides: true },
  impossible: { reach: 44, spare: 0, guides: false },
};
export class DominoWorld {
  level = 1;
  lives = 3;
  score = 0;
  done = false;
  phase: "plan" | "fall" | "clear" | "miss" = "plan";
  time = 0;
  walls = new Set<number>();
  pieces: Cell[] = [];
  angles: number[] = [];
  active = 0;
  hit = false;
  cursor: Cell = { c: 0, r: 7 };
  readonly settings;
  constructor(readonly difficulty: Difficulty = "medium") {
    this.settings = DOMINO_TIERS[difficulty];
    this.layout();
  }
  get start(): Cell {
    return { c: Math.min(6, this.level) % 2 ? 0 : 6, r: 8 };
  }
  get goal(): Cell {
    return { c: Math.min(6, this.level) % 2 ? 6 : 0, r: 0 };
  }
  private pieceBudget = 0;
  get budget() {
    return this.pieceBudget;
  }
  layout() {
    this.walls.clear();
    for (let r = 2; r <= 6; r += 2) {
      const gap = (r + this.level) % 3 === 0 ? 1 : 5;
      for (let c = 0; c < 7; c++)
        if (c !== gap && c !== gap - 1) this.walls.add(r * 7 + c);
    }
    this.pieces = [];
    this.angles = [];
    this.active = 0;
    this.phase = "plan";
    this.cursor = { c: this.start.c, r: 7 };
    this.pieceBudget = this.solution().length - 2 + this.settings.spare;
  }
  free(p: Cell) {
    return (
      p.c >= 0 &&
      p.c < 7 &&
      p.r >= 0 &&
      p.r < 9 &&
      !this.walls.has(p.r * 7 + p.c)
    );
  }
  equal(a: Cell, b: Cell) {
    return a.c === b.c && a.r === b.r;
  }
  distance(a: Cell, b: Cell) {
    return Math.hypot(a.c - b.c, a.r - b.r) * SIZE;
  }
  clearLine(a: Cell, b: Cell) {
    const d = this.distance(a, b);
    for (let t = 0; t <= d; t += 3) {
      const p = {
        c: Math.round(a.c + ((b.c - a.c) * t) / Math.max(1, d)),
        r: Math.round(a.r + ((b.r - a.r) * t) / Math.max(1, d)),
      };
      if (!this.free(p)) return false;
    }
    return true;
  }
  solution() {
    const s = this.start.r * 7 + this.start.c,
      end = this.goal.r * 7 + this.goal.c,
      q = [s],
      prev = new Map([[s, -1]]);
    for (let i = 0; i < q.length; i++) {
      const n = q[i];
      if (n === end) break;
      for (const [dc, dr] of [
        [0, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
      ]) {
        const p = { c: (n % 7) + dc, r: Math.floor(n / 7) + dr },
          k = p.r * 7 + p.c;
        if (this.free(p) && !prev.has(k)) {
          prev.set(k, n);
          q.push(k);
        }
      }
    }
    const path: Cell[] = [];
    if (!prev.has(end)) return path;
    for (let n = end; n !== -1; n = prev.get(n)!)
      path.push({ c: n % 7, r: Math.floor(n / 7) });
    return path.reverse();
  }
  place(p: Cell) {
    if (
      this.done ||
      this.phase !== "plan" ||
      !this.free(p) ||
      this.equal(p, this.start) ||
      this.equal(p, this.goal) ||
      this.pieces.some((a) => this.equal(a, p)) ||
      this.pieces.length >= this.budget
    )
      return false;
    this.pieces.push({ ...p });
    return true;
  }
  undo() {
    if (this.phase === "plan" && !this.done) this.pieces.pop();
  }
  launch() {
    if (this.phase !== "plan" || this.done || !this.pieces.length) return false;
    this.phase = "fall";
    this.angles = Array(this.pieces.length + 2).fill(0);
    this.active = 0;
    this.time = 0;
    return true;
  }
  get chain() {
    return [this.start, ...this.pieces, this.goal];
  }
  step(dt: number) {
    if (this.done || this.phase === "plan") return;
    this.time += dt;
    if (this.phase === "clear" || this.phase === "miss") {
      if (this.time < 1) return;
      if (this.phase === "clear") {
        this.level++;
        if (this.level > 6) {
          this.done = true;
          return;
        }
        this.layout();
      } else {
        this.phase = "plan";
        this.angles = [];
      }
      return;
    }
    const chain = this.chain;
    for (let i = 0; i <= this.active; i++)
      this.angles[i] = Math.min(
        Math.PI / 2,
        this.angles[i] + dt * (1.5 + 5 * this.angles[i]),
      );
    const i = this.active;
    if (i === chain.length - 1) {
      if (this.angles[i] > 1.3) {
        this.score += 100 + Math.max(0, this.budget - this.pieces.length) * 10;
        this.phase = "clear";
        this.time = 0;
      }
      return;
    }
    const d = this.distance(chain[i], chain[i + 1]);
    if (
      d <= this.settings.reach &&
      this.clearLine(chain[i], chain[i + 1]) &&
      Math.sin(this.angles[i]) * this.settings.reach >= d
    ) {
      this.active++;
      return;
    }
    if (this.angles[i] >= Math.PI / 2) {
      this.phase = "miss";
      this.time = 0;
      this.lives--;
      if (!this.lives) this.done = true;
    }
  }
}
