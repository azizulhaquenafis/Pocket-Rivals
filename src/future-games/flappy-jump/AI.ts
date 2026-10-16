import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import { projectedLanding, type FlappyMatch } from "./Rules";
export class FlappyAI {
  readonly personality: MatchRandom;
  private attempt = 0;
  private waiting = false;
  private offset = 0;
  private delay = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(dt: number, m: FlappyMatch) {
    const p = m.players[1];
    if (m.winner) return false;
    if (p.ball || p.jumping) {
      this.waiting = false;
      return false;
    }
    if (!this.waiting) {
      this.waiting = true;
      this.attempt++;
      const r = this.personality,
        spread =
          this.difficulty === "medium"
            ? 28
            : this.difficulty === "hard"
              ? 10
              : 2;
      this.offset = r.sample(r.side * spread * 0.15, spread, -spread);
      this.delay = r.sample(
        this.difficulty === "medium" ? 0.35 : 0.15,
        0.06,
        0.08,
      );
    }
    this.delay -= dt;
    return (
      this.delay <= 0 &&
      Math.abs(projectedLanding(p) - p.hoop.x - this.offset) < 1.5
    );
  }
}
