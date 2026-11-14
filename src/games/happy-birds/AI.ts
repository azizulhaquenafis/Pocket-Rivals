import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { BirdsMatch } from "./Rules";
import { advanceBird, FLAP, RADIUS, type Bird } from "./ArenaPhysics";
import { STAR_RADIUS } from "./Stars";
export class BirdsAI {
  readonly personality: MatchRandom;
  private think = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  private ageReady(m: BirdsMatch, born: number) {
    return m.age - born > 0.1;
  }
  update(dt: number, m: BirdsMatch, player: 0 | 1 = 1) {
    if (m.winner || m.between || !m.players[player].alive) return false;
    this.think -= dt;
    if (this.think > 0) return false;
    this.think = this.personality.sample(
      { medium: 0.14, hard: 0.06, impossible: 0.024 }[this.difficulty],
      0.012,
      0.018,
    );
    const p = m.players[player];
    if (p.cooldown > 0) return false;
    if (this.difficulty === "impossible") return this.predict(m, player);
    const side = p.direction === 1 ? 1 : 0,
      eta = (side === 0 ? p.x : 320 - p.x) / m.speed();
    const desired =
      m.safeCenter(side) +
      this.personality.side *
        { medium: 10, hard: 4, impossible: 1 }[this.difficulty];
    const mix = Math.max(0, Math.min(1, (1.9 - eta) / 0.8));
    let target = 230 + (desired - 230) * mix;
    const ahead = m.stars
      .filter(
        (s) => this.ageReady(m, s.born) && (s.x - p.x) * p.direction > -20,
      )
      .sort((a, b) => (a.x - p.x) * p.direction - (b.x - p.x) * p.direction)[0];
    if (ahead && eta > 0.25) {
      // Route toward visible collectibles, then leave time to line up with the safe wall opening.
      target =
        ahead.y +
        14 +
        this.personality.side *
          { medium: 10, hard: 3, impossible: 0 }[this.difficulty];
    }
    const look = { medium: 0.05, hard: 0.11, impossible: 0.11 }[
      this.difficulty
    ];
    const future = p.y + p.vy * look + 325 * look * look;
    if (p.y < 48 && p.vy < 0) return false;
    const climb = p.y > target + 35 && p.vy > -145;
    return (
      climb ||
      (p.vy >= -20 &&
        future >
          target + { medium: 20, hard: 10, impossible: 10 }[this.difficulty])
    );
  }
  /** Compare legal immediate actions with the same bird/collision integrator.
   * The following control is only a forecast; each real flap still goes through
   * BirdsMatch.flap and its cooldown. No future wall pattern or random state is read.
   */
  private predict(m: BirdsMatch, player: 0 | 1) {
    const start = m.players[player];
    const star = m.stars.find((s) => this.ageReady(m, s.born));
    const h = 1 / 120,
      steps = 144;
    const score = (flapNow: boolean) => {
      const p: Bird = { ...start };
      if (flapNow) {
        p.vy = FLAP;
        p.cooldown = 0.14;
      }
      let closest = Infinity,
        collected = false;
      for (let i = 1; i <= steps; i++) {
        const speed = Math.min(165, 115 + (m.age + i * h) * 0.25);
        const side = p.direction === 1 ? 1 : 0;
        const eta = (side === 0 ? p.x : 320 - p.x) / speed;
        let target = m.safeCenter(side);
        if (
          star &&
          !collected &&
          (star.x - p.x) * p.direction > -20 &&
          eta > 0.3
        )
          target = star.y + 14;
        if (
          i > 6 &&
          p.cooldown <= 0 &&
          p.y > 48 &&
          ((p.y > target + 35 && p.vy > -145) ||
            (p.vy >= -20 && p.y + p.vy * 0.11 + 325 * 0.11 ** 2 > target + 10))
        ) {
          p.vy = FLAP;
          p.cooldown = 0.14;
        }
        advanceBird(p, h, speed, m.walls);
        if (!p.alive) return -100000 + i;
        if (star && !collected) {
          const distance = Math.hypot(p.x - star.x, p.y - star.y);
          closest = Math.min(closest, distance);
          if (
            distance <= RADIUS + STAR_RADIUS &&
            m.age + i * h - star.born >= 0.18
          )
            collected = true;
        }
      }
      const side = p.direction === 1 ? 1 : 0;
      return (
        (collected ? 2000 : star ? -closest * 4 : 0) -
        Math.abs(p.y - m.safeCenter(side)) * 0.08
      );
    };
    return score(true) > score(false) + 0.1;
  }
}
