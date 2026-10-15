import type { Difficulty } from "../../shared/contracts/AIController";
import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type { LumberMatch, Side } from "./Rules";
export class LumberAI {
  readonly personality: MatchRandom;
  private wait: number;
  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
    this.wait = this.personality.sample(0.45, 0.12, 0.25);
  }
  snapshot() {
    return { ...this.personality.snapshot(), wait: this.wait };
  }
  update(dt: number, m: LumberMatch): Side | null {
    if (m.phase !== "playing" || !m.players[1].alive) {
      this.wait = 0.35;
      return null;
    }
    this.wait -= dt;
    if (this.wait > 0) return null;
    const p = this.personality,
      v = m.players[1],
      base = { medium: 0.42, hard: 0.245, impossible: 0.135 }[this.difficulty];
    this.wait = p.sample(base * (0.88 + p.tempo * 0.12), base * 0.12, 0.095);
    if (this.difficulty !== "medium")
      this.wait = Math.min(this.wait, m.limit(1) * 0.8);
    const legal = ([-1, 1] as Side[]).filter((side) => m.safe(1, side));
    let side = legal[0];
    if (legal.length === 2) {
      // Only inspect the seven visible segments. Plan which side stays safe longest.
      const room = (s: Side) => {
        for (let i = 2; i < 7; i++) if (m.pattern[v.score + i] === s) return i;
        return 7;
      };
      side =
        p.role === 0
          ? p.side
          : p.role === 1
            ? v.side
            : p.role === 3 && m.pattern[v.score + 2] !== v.side
              ? v.side
              : room(-1) === room(1)
                ? p.side
                : room(-1) > room(1)
                  ? -1
                  : 1;
    }
    // Casual recognition errors; Impossible never deliberately chooses a branch.
    if (p.next() < { medium: 0.1, hard: 0.012, impossible: 0 }[this.difficulty])
      side = side === 1 ? -1 : 1;
    return side ?? null;
  }
}
