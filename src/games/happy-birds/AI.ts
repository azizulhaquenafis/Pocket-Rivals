import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { BirdsMatch } from "./Rules";
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
}
