import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { LightMatch } from "./Rules";
export class LightAI {
  readonly personality: MatchRandom;
  snapshot() {
    return { ...this.personality.snapshot(), reaction: this.delay };
  }
  private serial = -1;
  private delay = 1;
  private tapped = false;
  private retryAt = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(m: LightMatch) {
    if (this.serial !== m.serial) {
      this.serial = m.serial;
      this.tapped = false;
      const style = this.personality;
      const pressure =
        m.scores[0] > m.scores[1] && style.role === 2 ? -0.025 : 0;
      const mean = { medium: 0.53, hard: 0.29, impossible: 0.145 }[
        this.difficulty
      ];
      this.delay = style.sample(
        mean * (0.92 + style.tempo * 0.08) + pressure,
        this.difficulty === "medium"
          ? 0.12
          : this.difficulty === "hard"
            ? 0.06
            : 0.018,
        0.12,
      );
    }
    if (
      this.tapped &&
      m.phase === "active" &&
      m.time >= this.retryAt &&
      m.canTap(1)
    )
      this.tapped = false;
    if (
      !this.tapped &&
      m.phase === "active" &&
      m.time - m.signalAt >= this.delay
    ) {
      if (m.tap(1)) {
        this.tapped = true;
        this.retryAt = m.time + 1.3;
      }
    }
  }
}
