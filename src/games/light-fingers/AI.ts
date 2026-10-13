import type { Difficulty } from "../../shared/contracts/AIController";
import type { LightMatch } from "./Rules";
export class LightAI {
  private serial = -1;
  private delay = 1;
  private tapped = false;
  constructor(
    private difficulty: Difficulty,
    private random = Math.random,
  ) {}
  update(m: LightMatch) {
    if (this.serial !== m.serial) {
      this.serial = m.serial;
      this.tapped = false;
      this.delay =
        { medium: 0.46, hard: 0.26, impossible: 0.12 }[this.difficulty] +
        this.random() * (this.difficulty === "medium" ? 0.18 : 0.04);
    }
    if (
      !this.tapped &&
      m.phase === "active" &&
      m.time - m.signalAt >= this.delay
    ) {
      m.tap(1);
      this.tapped = true;
    }
  }
}
