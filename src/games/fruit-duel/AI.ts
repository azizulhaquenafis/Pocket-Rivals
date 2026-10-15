import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { FruitMatch } from "./Rules";
export class FruitAI {
  readonly personality: MatchRandom;
  snapshot() {
    return { ...this.personality.snapshot(), reaction: this.delay };
  }
  private version = -1;
  private tapped = false;
  private delay = 1;
  private mistake = false;
  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(m: FruitMatch) {
    if (m.version !== this.version) {
      this.version = m.version;
      this.tapped = false;
      const style = this.personality,
        cautious = style.role === 1;
      this.delay = style.sample(
        { medium: 0.46, hard: 0.275, impossible: 0.145 }[this.difficulty] *
          (0.94 + style.tempo * 0.06) +
          (cautious ? 0.015 : 0),
        { medium: 0.1, hard: 0.055, impossible: 0.018 }[this.difficulty],
        0.12,
      );
      // Recognition errors are sampled once per presented fruit, never per frame.
      this.mistake =
        style.next() <
        { medium: 0.1, hard: 0.02, impossible: 0 }[this.difficulty] *
          (cautious ? 0.6 : style.role === 0 ? 1.3 : 1);
    }
    if (
      !this.tapped &&
      m.phase === "active" &&
      m.time - m.visibleAt >= this.delay &&
      (m.current === m.target || this.mistake)
    ) {
      m.tap(1);
      this.tapped = true;
    }
  }
}
