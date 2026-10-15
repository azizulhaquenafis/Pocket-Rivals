import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { BirdsMatch } from "./Rules";
export class BirdsAI {
  readonly personality: MatchRandom;
  private think = 0;
  private threshold = 12;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
    this.threshold =
      (difficulty === "medium" ? 23 : difficulty === "hard" ? 14 : 9) +
      this.personality.role * 1.2;
  }
  update(dt: number, m: BirdsMatch) {
    if (m.winner || m.between) return false;
    this.think -= dt;
    if (this.think > 0) return false;
    this.think = this.personality.sample(
      this.difficulty === "medium"
        ? 0.14
        : this.difficulty === "hard"
          ? 0.065
          : 0.025,
      0.015,
      0.018,
    );
    const p = m.players[1],
      gate = m.gates.find((g) => g.x + 24 >= m.distance - 10),
      center = gate && gate.x - m.distance < 150 ? gate.center : 85;
    const future =
      p.y + Math.max(0, p.vy) * (this.difficulty === "medium" ? 0.04 : 0.1);
    return p.vy >= -5 && p.y >= center - 9 && future > center + this.threshold;
  }
}
