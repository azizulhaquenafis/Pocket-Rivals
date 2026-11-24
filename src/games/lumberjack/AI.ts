import type { Difficulty } from "../../shared/contracts/AIController";
import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type { LumberMatch, Side } from "./Rules";

// A branch collision ends the whole 100-chop match. Difficulty therefore comes
// from recognizing branches and changing sides quickly, not a per-chop death die.
const PACING = {
  medium: {
    interval: 0.44,
    spread: 0.08,
    minimum: 0.28,
    switch: 0.14,
    hesitation: 0.18,
  },
  hard: {
    interval: 0.225,
    spread: 0.035,
    minimum: 0.17,
    switch: 0.045,
    hesitation: 0.035,
  },
  impossible: {
    interval: 0.105,
    spread: 0.008,
    minimum: 0.09,
    switch: 0,
    hesitation: 0,
  },
} as const;

export class LumberAI {
  readonly personality: MatchRandom;
  private wait: number;
  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
    this.wait = this.personality.sample(
      difficulty === "impossible" ? 0.28 : difficulty === "hard" ? 0.42 : 0.6,
      0.06,
      0.2,
    );
  }
  snapshot() {
    return {
      ...this.personality.snapshot(),
      wait: this.wait,
      difficulty: this.difficulty,
    };
  }
  update(dt: number, m: LumberMatch): Side | null {
    if (m.phase !== "playing" || !m.players[1].alive) return null;
    if (!Number.isFinite(dt) || dt <= 0) return null;
    this.wait -= Math.min(dt, 0.1);
    // Match.chop is the sole action path; honor its human contact debounce and stun too.
    if (this.wait > 0 || m.players[1].cooldown > 0 || m.players[1].stun > 0)
      return null;
    const p = this.personality,
      v = m.players[1],
      pace = PACING[this.difficulty];
    const legal = ([-1, 1] as Side[]).filter((side) => m.safe(1, side));
    if (!legal.length) return null;
    let side = legal[0];
    if (legal.length === 2) {
      // These seven segments are visible to humans. No hidden future branches.
      const room = (s: Side) => {
        for (let i = 2; i < 7; i++) if (m.pattern[v.index + i] === s) return i;
        return 7;
      };
      side =
        p.role === 0
          ? p.side
          : p.role === 1
            ? v.side
            : p.role === 3 && m.pattern[v.index + 2] !== v.side
              ? v.side
              : room(-1) === room(1)
                ? p.side
                : room(-1) > room(1)
                  ? -1
                  : 1;
    }
    const interval = p.sample(
      pace.interval * (0.94 + p.tempo * 0.06),
      pace.spread,
      pace.minimum,
    );
    const hesitation =
      p.next() < pace.hesitation
        ? p.sample(this.difficulty === "medium" ? 0.32 : 0.12, 0.07, 0.06)
        : 0;
    // Carry fractional-frame overshoot: 30/60/120 Hz should not change strength.
    // Never catch up with multiple chops or bypass the shared cooldown.
    this.wait =
      Math.max(this.wait, -0.1) +
      interval +
      (side !== v.side ? pace.switch : 0) +
      hesitation;
    return side;
  }
}
