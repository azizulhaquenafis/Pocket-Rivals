import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { GravityMatch } from "./Rules";
export class GravityAI {
  readonly personality: MatchRandom;
  private lookahead: number;
  private wait = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
    this.lookahead =
      (difficulty === "medium" ? 0.15 : difficulty === "hard" ? 0.6 : 0.95) +
      this.personality.role * 0.04 +
      this.personality.tempo * 0.02 +
      this.personality.side * 0.015;
  }
  update(m: GravityMatch, dt = 1 / 120) {
    if (m.between || m.winner) return false;
    this.wait -= dt;
    if (this.wait > 0) return false;
    this.wait = this.personality.sample(
      this.difficulty === "medium"
        ? 0.55
        : this.difficulty === "hard"
          ? 0.1
          : 0.025,
      0.02,
      0.02,
    );
    const p = m.players[1],
      danger = m.gaps.find(
        (g) => g.x + g.width >= m.distance - 8 && g.side === p.gravity,
      );
    return (
      !!danger &&
      danger.x - m.distance < m.speed() * this.lookahead + 12 &&
      p.cooldown === 0
    );
  }
}
