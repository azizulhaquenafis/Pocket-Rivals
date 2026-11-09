export type Side = -1 | 1;
export const TARGET = 100;
export function branches(seed: number, count = 600) {
  let s = seed >>> 0,
    last = 0;
  return Array.from({ length: count }, (_, i) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const value = i < 2 || last !== 0 ? 0 : (s % 3) - 1;
    last = value;
    return value;
  });
}
export class LumberMatch {
  pattern: number[];
  players = [
    {
      score: 0,
      side: -1 as Side,
      alive: true,
      hitNext: false,
      idle: 0,
      cooldown: 0,
    },
    {
      score: 0,
      side: 1 as Side,
      alive: true,
      hitNext: false,
      idle: 0,
      cooldown: 0,
    },
  ];
  totals: [number, number] = [0, 0];
  round = 1;
  phase: "playing" | "done" = "playing";
  time = 0;
  winner: 1 | 2 | null = null;
  constructor(readonly seed = 12345) {
    this.pattern = branches(seed);
  }
  safe(p: number, side: Side) {
    const index = this.players[p].score;
    return this.pattern[index] !== side && this.pattern[index + 1] !== side;
  }
  chop(p: 0 | 1, side: Side) {
    const v = this.players[p];
    if (this.phase !== "playing" || !v.alive || v.cooldown > 0) return null;
    v.side = side;
    // Contact debounce, not an idle deadline: players can wait indefinitely.
    v.cooldown = 0.085;
    if (!this.safe(p, side)) {
      v.hitNext =
        this.pattern[v.score] !== side && this.pattern[v.score + 1] === side;
      v.alive = false;
      this.winner = p === 0 ? 2 : 1;
      this.phase = "done";
      return false;
    }
    v.score++;
    this.totals[p] = v.score;
    if (v.score === TARGET) {
      this.winner = p === 0 ? 1 : 2;
      this.phase = "done";
    }
    return true;
  }
  update(dt: number) {
    if (this.phase === "done") return;
    this.time += dt;
    for (const p of this.players) p.cooldown = Math.max(0, p.cooldown - dt);
  }
}
