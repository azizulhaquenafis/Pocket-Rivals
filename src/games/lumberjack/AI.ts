import type { Difficulty } from "../../shared/contracts/AIController";
import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type { LumberMatch, Side } from "./Rules";

// Branch hits trigger a 3-second stun cooldown rather than ending the match.
// Natural occasional slip-ups + human chop cadence make every tier enjoyable.
const PACING = {
  medium: {
    interval: 0.34,
    spread: 0.06,
    minimum: 0.22,
    switch: 0.09,
    hesitation: 0.14,
    errorRate: 0.075,
    minErrorGap: 9,
    minStartChop: 7,
  },
  hard: {
    interval: 0.235,
    spread: 0.038,
    minimum: 0.175,
    switch: 0.05,
    hesitation: 0.05,
    errorRate: 0.04,
    minErrorGap: 14,
    minStartChop: 11,
  },
  impossible: {
    interval: 0.168,
    spread: 0.016,
    minimum: 0.135,
    switch: 0.025,
    hesitation: 0.01,
    errorRate: 0.02,
    minErrorGap: 24,
    minStartChop: 16,
  },
} as const;

export class LumberAI {
  readonly personality: MatchRandom;
  private wait: number;
  private errorCap: number;
  private errors = 0;
  private nextErrorAt: number;
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
    const roll = this.personality.next();
    this.errorCap =
      difficulty === "impossible"
        ? roll < 0.55
          ? 1
          : 0
        : difficulty === "hard"
          ? 2 + (roll < 0.55 ? 1 : 0)
          : 4 + Math.min(2, Math.floor(roll * 3));
    this.nextErrorAt = PACING[difficulty].minStartChop;
  }
  snapshot() {
    return {
      ...this.personality.snapshot(),
      wait: this.wait,
      difficulty: this.difficulty,
      errors: this.errors,
      errorCap: this.errorCap,
    };
  }
  update(dt: number, m: LumberMatch): Side | null {
    if (m.phase !== "playing" || !m.players[1].alive) return null;
    if (!Number.isFinite(dt) || dt <= 0) return null;
    if (m.players[1].stun > 0) {
      this.wait = 0.14;
      return null;
    }
    this.wait -= Math.min(dt, 0.1);
    // Match.chop is the sole action path; honor its human contact debounce and stun too.
    if (this.wait > 0 || m.players[1].cooldown > 0) return null;
    const p = this.personality,
      v = m.players[1],
      pace = PACING[this.difficulty];
    const legal = ([-1, 1] as Side[]).filter((side) => m.safe(1, side));
    if (!legal.length) return null;
    let side = legal[0];
    if (legal.length === 1) {
      if (
        this.errors < this.errorCap &&
        v.score >= this.nextErrorAt &&
        p.next() < pace.errorRate
      ) {
        side = -legal[0] as Side;
        this.errors++;
        this.nextErrorAt = v.score + pace.minErrorGap;
      }
    } else {
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
        ? p.sample(this.difficulty === "medium" ? 0.3 : 0.12, 0.06, 0.05)
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
