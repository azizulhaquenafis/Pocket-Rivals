import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import { edgeDistance, type Pen, type Shot } from "./PenPhysics";
import { simulateShot } from "./PenRules";
export interface PlanInput {
  bodies: Pen[];
  difficulty: Difficulty;
  seed: number;
}
export interface Plan {
  shot: Shot;
  milliseconds: number;
  candidates: number;
}
export function fallbackShot(bodies: Pen[], player: 0 | 1 = 1): Shot {
  const own = bodies[player],
    other = bodies[1 - player];
  return {
    angle: Math.atan2(other.y - own.y, other.x - own.x),
    power: Math.min(
      0.93,
      0.38 + Math.hypot(other.x - own.x, other.y - own.y) / 650,
    ),
    offset: 0,
  };
}
function value(pair: Pen[], player: 0 | 1, risk: number) {
  const mine = pair[player],
    rival = pair[1 - player];
  if (mine.out) return rival.out ? -900 : -20000;
  if (rival.out) return 20000;
  return (
    edgeDistance(mine) * risk -
    edgeDistance(rival) * 2.4 -
    Math.hypot(mine.x - rival.x, mine.y - rival.y) * 0.22
  );
}
export function planShot(input: PlanInput): Plan {
  const start = performance.now(),
    random = new MatchRandom(input.seed);
  const count = { medium: 22, hard: 66, impossible: 144 }[input.difficulty];
  const budget = { medium: 40, hard: 80, impossible: 140 }[input.difficulty];
  const baseline = fallbackShot(input.bodies),
    ranked: { shot: Shot; value: number; pair: Pen[] }[] = [];
  const risk = 1.3 + random.role * 0.5;
  for (let i = 0; i < count; i++) {
    if (i > 8 && performance.now() - start > budget) break;
    const shot =
      i === 0
        ? baseline
        : {
            angle:
              baseline.angle +
              (i % 9 === 0
                ? (random.next() - 0.5) * Math.PI * 2
                : (random.next() - 0.5) *
                  (input.difficulty === "medium" ? 0.75 : 0.9)),
            power: 0.25 + random.next() * 0.75,
            offset: i % 3 === 0 ? (random.next() - 0.5) * 64 : 0,
          };
    const pair = simulateShot(input.bodies, 1, shot);
    const noise =
      input.difficulty === "medium"
        ? 60
        : input.difficulty === "hard"
          ? 8
          : 0.01;
    ranked.push({
      shot,
      pair,
      value: value(pair, 1, risk) + random.next() * noise,
    });
  }
  ranked.sort((a, b) => b.value - a.value);
  if (input.difficulty === "impossible" && ranked[0].value < 19000) {
    // Bounded one-reply lookahead penalizes shots that hand over an easy knockout.
    for (const candidate of ranked.slice(0, 4)) {
      const response = fallbackShot(candidate.pair, 0);
      let worst = candidate.value;
      for (let i = 0; i < 9 && performance.now() - start < budget; i++) {
        const next = simulateShot(candidate.pair, 0, {
          ...response,
          power: 0.42 + (i % 3) * 0.27,
          angle: response.angle + (Math.floor(i / 3) - 1) * 0.14,
        });
        worst = Math.min(worst, value(next, 1, risk));
      }
      candidate.value = candidate.value * 0.3 + worst * 0.7;
    }
    ranked.sort((a, b) => b.value - a.value);
  }
  return {
    shot: ranked[0]?.shot ?? baseline,
    candidates: ranked.length,
    milliseconds: performance.now() - start,
  };
}
