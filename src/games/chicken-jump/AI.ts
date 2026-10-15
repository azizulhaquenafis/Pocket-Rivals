import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { ChickenMatch } from "./Rules";
export class ChickenAI {
  readonly personality: MatchRandom;
  private newAttempt = true;
  private offset = 0;
  private delay = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(dt: number, m: ChickenMatch) {
    const p = m.players[1];
    if (m.winner) return false;
    if (p.phase !== "sliding") {
      this.newAttempt = true;
      return false;
    }
    if (this.newAttempt) {
      this.newAttempt = false;
      const spread =
        this.difficulty === "medium" ? 38 : this.difficulty === "hard" ? 15 : 4;
      this.offset = this.personality.sample(
        this.personality.side * spread * 0.2,
        spread,
        -spread,
      );
      this.delay = this.personality.sample(
        this.difficulty === "medium" ? 0.3 : 0.12,
        0.06,
        0.06,
      );
    }
    this.delay -= dt;
    if (this.delay > 0) return false;
    const target = Math.max(25, Math.min(175, p.x + this.offset));
    return Math.abs(p.block - target) <= m.speed(p) * dt + 2;
  }
}
