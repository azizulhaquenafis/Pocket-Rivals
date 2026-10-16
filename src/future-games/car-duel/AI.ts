import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { CarMatch } from "./Rules";
export class CarAI {
  readonly personality: MatchRandom;
  private wait = 0;
  private control = 0;
  private retreat = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(dt: number, m: CarMatch) {
    if (m.winner || m.between) {
      this.control = 0;
      this.wait = 0;
      return 0;
    }
    this.wait -= dt;
    if (this.wait > 0) return this.control;
    const r = this.personality,
      c = m.cars[1],
      other = m.cars[0],
      distance = other.x - c.x;
    this.wait = r.sample(
      this.difficulty === "medium"
        ? 0.24
        : this.difficulty === "hard"
          ? 0.1
          : 0.045,
      0.025,
      0.025,
    );
    const predicted =
      c.angle + c.omega * (this.difficulty === "medium" ? 0.08 : 0.22);
    if (Math.abs(predicted) > 0.42) {
      this.control = Math.sign(predicted);
      return this.control;
    }
    const closing = (other.vx - c.vx) * Math.sign(distance),
      separation = Math.abs(distance),
      cautious = r.role === 1 || r.role === 3;
    if (cautious && separation < 95 && closing < -90 && this.retreat <= 0)
      this.retreat = 0.35 + r.tempo * 0.08;
    this.retreat -= this.wait;
    this.control =
      this.retreat > 0 ? -Math.sign(distance) : Math.sign(distance);
    if (
      separation < 70 &&
      Math.abs(c.omega) > 0.8 &&
      this.difficulty !== "medium"
    )
      this.control = Math.sign(predicted || c.omega);
    return this.control;
  }
}
