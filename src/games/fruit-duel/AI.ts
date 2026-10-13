import type { Difficulty } from "../../shared/contracts/AIController";
import type { FruitMatch } from "./Rules";
export class FruitAI {
  private version = -1;
  private tapped = false;
  private delay = 1;
  private mistake = false;
  constructor(
    private difficulty: Difficulty,
    private random = Math.random,
  ) {}
  update(m: FruitMatch) {
    if (m.version !== this.version) {
      this.version = m.version;
      this.tapped = false;
      this.delay =
        { medium: 0.4, hard: 0.24, impossible: 0.13 }[this.difficulty] +
        this.random() * 0.07;
      this.mistake =
        this.random() <
        { medium: 0.1, hard: 0.02, impossible: 0 }[this.difficulty];
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
