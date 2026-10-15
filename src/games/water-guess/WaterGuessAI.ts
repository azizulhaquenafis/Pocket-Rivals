import type { Difficulty } from "../../shared/contracts/AIController";
import { MatchRandom } from "../../shared/ai/MatchRandom";
import { TUBE_HEIGHT } from "./Geometry";
export class WaterGuessAI {
  readonly personality: MatchRandom;
  constructor(
    public readonly difficulty: Difficulty = "medium",
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  estimate(actualHundredths: number) {
    // Measure the visible tube to one logical pixel; no oracle-perfect hidden decimal.
    const measured =
      (Math.round((actualHundredths / 10000) * TUBE_HEIGHT) / TUBE_HEIGHT) *
      10000;
    const r = this.personality,
      spread =
        this.difficulty === "medium"
          ? 550
          : this.difficulty === "hard"
            ? 170
            : 0;
    const bias = r.side * spread * (0.15 + r.role * 0.06),
      noise = r.sample(bias, spread * (0.8 + r.tempo * 0.1), -spread * 1.4);
    return Math.max(0, Math.min(10000, Math.round(measured + noise)));
  }
  snapshot() {
    return this.personality.snapshot();
  }
}
