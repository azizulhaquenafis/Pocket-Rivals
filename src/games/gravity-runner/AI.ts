import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { GravityMatch } from "./Rules";
import { advanceRunner } from "./RunnerPhysics";
/** Bounded lookahead over legal flips, including a possible second transfer. */
export class GravityAI {
  readonly personality: MatchRandom;
  private wait = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(m: GravityMatch, dt = 1 / 120) {
    if (m.between || m.winner || !m.players[1].alive) return false;
    this.wait -= dt;
    if (this.wait > 0) return false;
    this.wait = this.personality.sample(
      { medium: 0.23, hard: 0.085, impossible: 0.04 }[this.difficulty],
      { medium: 0.045, hard: 0.018, impossible: 0.008 }[this.difficulty],
      0.025,
    );
    if (m.players[1].cooldown > 0) return false;
    const horizon = Math.min(
      410 / m.speed(),
      { medium: 0.85, hard: 1.45, impossible: 1.75 }[this.difficulty] +
        this.personality.tempo * 0.025,
    );
    const h = 1 / 120,
      steps = Math.ceil(horizon / h);
    const positions = new Float64Array(steps + 1);
    positions[0] = m.distance;
    for (let i = 1; i <= steps; i++)
      positions[i] = positions[i - 1] + m.speed(m.age + i * h) * h;
    const end = positions[steps] + 18;
    const gaps = m.gaps.filter(
      (g) => g.x + g.width >= m.distance - 15 && g.x <= end,
    );
    const obstacles = m.obstacles.filter(
      (o) => o.x + o.width >= m.distance - 15 && o.x <= end,
    );
    if (!gaps.length && !obstacles.length) return false;
    const survival = (flipNow: boolean, secondAt = Infinity) => {
      const p = { ...m.players[1] };
      if (flipNow) {
        p.gravity = p.gravity === 1 ? -1 : 1;
        p.cooldown = 0.16;
      }
      for (let i = 1; i <= steps; i++) {
        if (i === secondAt && p.cooldown <= 0) {
          p.gravity = p.gravity === 1 ? -1 : 1;
          p.cooldown = 0.16;
        }
        advanceRunner(p, positions[i], h, gaps, obstacles, m.age + i * h);
        if (!p.alive) return i * h;
      }
      return steps * h;
    };
    const stay = survival(false);
    // Stay stable on a safe surface. No per-frame random target switches.
    if (stay >= horizon) return false;
    let hold = stay,
      flip = survival(true);
    if (this.difficulty !== "medium") {
      const delays =
        this.difficulty === "impossible"
          ? [0.25, 0.4, 0.6, 0.85, 1.1]
          : [0.35, 0.65, 0.95];
      for (const delay of delays) {
        if (delay >= horizon) break;
        const at = Math.round(delay / h);
        hold = Math.max(hold, survival(false, at));
        flip = Math.max(flip, survival(true, at));
      }
    }
    return flip > hold + 0.035;
  }
}
