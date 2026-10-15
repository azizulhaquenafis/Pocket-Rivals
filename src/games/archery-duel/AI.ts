import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { ArcheryMatch } from "./Rules";
export class ArcheryAI {
  readonly personality: MatchRandom;
  private attempt = -1;
  private x = 0;
  private y = 0;
  private readyDelay = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(m: ArcheryMatch) {
    if (m.winner) return false;
    const p = m.players[1],
      r = this.personality;
    if (this.attempt !== p.attempt) {
      this.attempt = p.attempt;
      const target =
          p.targets[
            this.difficulty === "impossible" ||
            r.next() > (this.difficulty === "hard" ? 0.12 : 0.45)
              ? 1
              : 0
          ],
        spread =
          this.difficulty === "medium"
            ? 27
            : this.difficulty === "hard"
              ? 9
              : 1;
      this.x = target.x + r.sample(r.side * spread * 0.15, spread, -spread);
      this.y = target.y + r.sample(0, spread, -spread);
      this.readyDelay = r.sample(
        this.difficulty === "medium" ? 0.7 : 0.3,
        0.12,
        0.15,
      );
    }
    if (p.stage === "ready") return p.age >= this.readyDelay;
    return p.stage === "horizontal"
      ? Math.abs(p.x - this.x) < 1.8
      : p.stage === "vertical"
        ? Math.abs(p.y - this.y) < 1.8
        : false;
  }
}
