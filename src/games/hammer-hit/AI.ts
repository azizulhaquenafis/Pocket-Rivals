import type { Difficulty } from "../../shared/contracts/AIController";
import type { HammerMatch } from "./Rules";
export class HammerAI {
  private threshold: number;
  private previous = 1;
  constructor(difficulty: Difficulty, random = Math.random) {
    this.threshold = {
      medium: 0.15 + random() * 0.2,
      hard: 0.035 + random() * 0.07,
      impossible: 0.015,
    }[difficulty];
  }
  update(m: HammerMatch) {
    if (m.cooldowns[1] > 0 || m.scores[1].length === 3) {
      this.previous = 1;
      return false;
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
