import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { GravityMatch } from "./Rules";
import { advanceRunner } from "./RunnerPhysics";
/** Bounded lookahead over legal flips, including multi-flip recovery at higher speeds. */
export class GravityAI {
  readonly personality: MatchRandom;
  private wait = 0;
  private positions = new Float64Array(320);
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
      { medium: 0.22, hard: 0.08, impossible: 0.04 }[this.difficulty],
      { medium: 0.035, hard: 0.015, impossible: 0.008 }[this.difficulty],
      0.025,
    );
    if (m.players[1].cooldown > 0) return false;
    const sight = { medium: 175, hard: 520, impossible: 540 }[this.difficulty];
    const horizon = Math.min(
      sight / m.speed(),
      { medium: 0.72, hard: 1.38, impossible: 1.65 }[this.difficulty] +
        this.personality.tempo * 0.025,
    );
    const h = 1 / 120,
      steps = Math.min(this.positions.length - 1, Math.ceil(horizon / h));
    // Avoid forecasting an empty opening; this is a conservative speed bound.
    const reach = m.distance + m.speed(m.age + horizon) * horizon + 24;
    if (
      !m.gaps.some((g) => g.x <= reach && g.x + g.width >= m.distance - 15) &&
      !m.obstacles.some((o) => o.x <= reach && o.x + o.width >= m.distance - 15)
    )
      return false;
    const positions = this.positions;
    positions[0] = m.distance;
    for (let i = 1; i <= steps; i++)
      positions[i] = positions[i - 1] + m.speed(m.age + i * h) * h;
    const end = positions[steps] + 24;
    const gaps = m.gaps.filter(
      (g) => g.x + g.width >= m.distance - 15 && g.x <= end,
    );
    const obstacles = m.obstacles.filter(
      (o) => o.x + o.width >= m.distance - 15 && o.x <= end,
    );
    if (!gaps.length && !obstacles.length) return false;
    const survival = (
      flipNow: boolean,
      secondAt = Infinity,
      thirdAt = Infinity,
    ) => {
      const p = { ...m.players[1] };
      if (flipNow) {
        p.gravity = p.gravity === 1 ? -1 : 1;
        p.cooldown = 0.16;
      }
      for (let i = 1; i <= steps; i++) {
        if ((i === secondAt || i === thirdAt) && p.cooldown <= 0) {
          p.gravity = p.gravity === 1 ? -1 : 1;
          p.cooldown = 0.16;
        }
        advanceRunner(p, positions[i], h, gaps, obstacles, m.age + i * h);
        if (!p.alive) return i * h;
      }
      return steps * h;
    };
    const full = steps * h;
    const stay = survival(false);
    // Stay stable on a safe surface. No per-frame random target switches.
    if (stay >= full) return false;
    const probe = (
      flipNow: boolean,
      delays: readonly number[],
      deep: boolean,
    ) => {
      let best = survival(flipNow),
        bestAt = Infinity;
      if (best >= full) return best;
      for (const delay of delays) {
        if (delay >= full) break;
        const at = Math.round(delay / h);
        const s = survival(flipNow, at);
        if (s > best) {
          best = s;
          bestAt = at;
        }
        if (best >= full) return best;
      }
      // Only probe a third recovery flip from the strongest 2-flip branch when needed.
      if (deep && bestAt !== Infinity && best > bestAt * h + 0.18) {
        const deadStep = Math.round(best / h);
        for (const lead of [30, 18, 10]) {
          const third = deadStep - lead;
          if (third <= bestAt + 20) continue;
          const s3 = survival(flipNow, bestAt, third);
          if (s3 > best) best = s3;
          if (best >= full) return best;
        }
      }
      return best;
    };
    const delays =
      this.difficulty === "impossible"
        ? [0.1, 0.2, 0.34, 0.52, 0.76, 1.05]
        : this.difficulty === "hard"
          ? [0.14, 0.28, 0.48, 0.76]
          : [];
    const deep = this.difficulty !== "medium";
    const flip = probe(true, delays, deep);
    if (this.difficulty !== "medium" && flip >= full && stay < 0.44)
      return true;
    const hold = probe(false, delays, deep);
    return flip > hold + 0.025;
  }
}
