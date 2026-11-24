export type Side = -1 | 1;
export const TARGET = 100;
export const STUN_SECONDS = 3;
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
  private rngState: number;
  players = [
    {
      score: 0,
      index: 0,
      side: -1 as Side,
      alive: true,
      hitNext: false,
      idle: 0,
      cooldown: 0,
      stun: 0,
    },
    {
      score: 0,
      index: 0,
      side: 1 as Side,
      alive: true,
      hitNext: false,
      idle: 0,
      cooldown: 0,
      stun: 0,
    },
  ];
  totals: [number, number] = [0, 0];
  round = 1;
  phase: "playing" | "done" = "playing";
  time = 0;
  winner: 1 | 2 | null = null;
  constructor(readonly seed = 12345) {
    this.pattern = branches(seed);
    let s = seed >>> 0;
    for (let i = 0; i < this.pattern.length; i++)
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    this.rngState = s;
  }
  private ensure(needed: number) {
    while (this.pattern.length <= needed) {
      const last = this.pattern[this.pattern.length - 1] ?? 0;
      this.rngState = (Math.imul(this.rngState, 1664525) + 1013904223) >>> 0;
      this.pattern.push(last !== 0 ? 0 : (this.rngState % 3) - 1);
    }
  }
  safe(p: number, side: Side) {
    const index = this.players[p].index;
    this.ensure(index + 8);
    return this.pattern[index] !== side && this.pattern[index + 1] !== side;
  }
  chop(p: 0 | 1, side: Side) {
    const v = this.players[p];
    if (this.phase !== "playing" || !v.alive || v.cooldown > 0 || v.stun > 0)
      return null;
    this.ensure(v.index + 12);
    v.side = side;
    if (!this.safe(p, side)) {
      const hitNext =
        this.pattern[v.index] !== side && this.pattern[v.index + 1] === side;
      v.hitNext = hitNext;
      // If the chop dropped the next branch onto the player's head, advance the trunk
      // once (without awarding a chop) so the tree continues smoothly without snapping back.
      if (hitNext) v.index++;
      v.stun = STUN_SECONDS;
      v.cooldown = STUN_SECONDS;
      return false;
    }
    // Contact debounce, not an idle deadline: players can wait indefinitely.
    v.cooldown = 0.085;
    v.hitNext = false;
    v.index++;
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
    for (const p of this.players) {
      p.cooldown = Math.max(0, p.cooldown - dt);
      if (p.stun > 0) {
        p.stun = Math.max(0, p.stun - dt);
        if (p.stun === 0) {
          p.hitNext = false;
          // Step cleanly out from under the bonking branch onto the guaranteed-clear side.
          if (this.pattern[p.index] === p.side)
            p.side = (p.side === -1 ? 1 : -1) as Side;
        }
      }
    }
  }
}
