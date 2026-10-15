import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { HammerMatch } from "./Rules";
export class HammerAI {
  readonly personality: MatchRandom;
  private threshold = 0;
  private previous = 1;
  private attempt = -1;
  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
  }
  snapshot() {
    return { ...this.personality.snapshot(), threshold: this.threshold };
  }
  update(m: HammerMatch) {
    if (m.cooldowns[1] > 0 || m.scores[1].length === 3) {
      this.previous = 1;
      return false;
    }
    if (this.attempt !== m.scores[1].length) {
      this.attempt = m.scores[1].length;
      const p = this.personality;
      const roll = p.next();
      // Select a timing target once per strike, never alter the awarded score.
      const bands =
        this.difficulty === "impossible"
          ? roll < 0.7
            ? [97, 100]
            : roll < 0.95
              ? [90, 96]
              : [75, 89]
          : this.difficulty === "hard"
            ? roll < 0.6
              ? [90, 98]
              : roll < 0.9
                ? [80, 89]
                : [65, 79]
            : roll < 0.5
              ? [75, 89]
              : roll < 0.85
                ? [60, 74]
                : [50, 59];
      const target =
        bands[0] + Math.floor(p.next() * (bands[1] - bands[0] + 1));
      this.threshold = (100 - target + 0.49) / 100;
    }
    const distance = Math.abs(m.position(1));
    const hit =
      m.clocks[1] > 0.3 &&
      (distance <= this.threshold ||
        (distance > this.previous && this.previous < 0.07));
    this.previous = distance;
    return hit;
  }
}
