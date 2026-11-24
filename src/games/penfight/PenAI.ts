import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import { edgeDistance, HALF, type Pen, type Shot } from "./PenPhysics";
import { deskForShots, powerLimit, simulateShot } from "./PenRules";

export interface PlanInput {
  bodies: Pen[];
  difficulty: Difficulty;
  seed: number;
  completed?: number;
}

export interface Plan {
  shot: Shot;
  milliseconds: number;
  candidates: number;
}

export function fallbackShot(
  bodies: Pen[],
  player: 0 | 1 = 1,
  completed = 0,
): Shot {
  const own = bodies[player];
  const rival = bodies[1 - player];
  const distance = Math.hypot(rival.x - own.x, rival.y - own.y);
  return {
    angle: Math.atan2(rival.y - own.y, rival.x - own.x),
    power: Math.min(powerLimit(completed), 0.58 + distance / 420),
    offset: 0,
  };
}

function value(pair: Pen[], player: 0 | 1, completed: number, risk: number) {
  const mine = pair[player];
  const rival = pair[1 - player];
  if (mine.out) return rival.out ? -900 : -20000;
  if (rival.out) return 20000;
  const desk = deskForShots(completed);
  return (
    Math.min(50, edgeDistance(mine, desk)) * risk -
    edgeDistance(rival, desk) * 1.8 -
    Math.hypot(mine.x - rival.x, mine.y - rival.y) * 0.48
  );
}

export function planShot(input: PlanInput): Plan {
  const start = performance.now();
  const random = new MatchRandom(input.seed);
  const completed = input.completed ?? 0;
  const limit = powerLimit(completed);
  const count = { medium: 24, hard: 68, impossible: 144 }[input.difficulty];
  const budget = { medium: 40, hard: 80, impossible: 140 }[input.difficulty];
  const baseline = fallbackShot(input.bodies, 1, completed);
  const ranked: { shot: Shot; value: number; pair: Pen[] }[] = [];
  const risk = 0.85 + random.role * 0.4;
  const [rival, own] = input.bodies;
  const desk = deskForShots(completed);
  const startClearance = edgeDistance(rival, desk);
  const bias =
    (random.next() - 0.5) *
    { medium: 0.18, hard: 0.09, impossible: 0.036 }[input.difficulty];
  const noise = { medium: 32, hard: 8, impossible: 0.1 }[input.difficulty];

  for (let i = 0; i < count; i++) {
    if (i > 12 && performance.now() - start > budget) break;
    // Try the barrel and both ends at different powers before sampling around them.
    const side = (i % 3) - 1;
    const targetX = rival.x + side * HALF * 0.76 * Math.cos(rival.a);
    const targetY = rival.y + side * HALF * 0.76 * Math.sin(rival.a);
    const direct = Math.atan2(targetY - own.y, targetX - own.x);
    const shot =
      i === 0
        ? { ...baseline, angle: baseline.angle + bias }
        : {
            angle:
              i < 13
                ? direct + bias
                : direct + (random.next() - 0.5) * (i % 10 ? 0.6 : Math.PI * 2),
            power:
              i < 13
                ? limit * (0.52 + (Math.floor(i / 3) % 4) * 0.16)
                : limit * (0.4 + random.next() * 0.6),
            offset: i > 12 && i % 4 === 0 ? (random.next() - 0.5) * 64 : 0,
          };
    const pair = simulateShot(input.bodies, 1, shot, completed);
    const push = Math.max(0, startClearance - edgeDistance(pair[0], desk));
    const travel = Math.hypot(pair[0].x - rival.x, pair[0].y - rival.y);
    ranked.push({
      shot,
      pair,
      value:
        value(pair, 1, completed + 1, risk) +
        push * 1.7 +
        travel * 0.35 +
        random.next() * noise,
    });
  }

  ranked.sort((a, b) => b.value - a.value);
  if (input.difficulty === "impossible" && ranked[0].value < 19000) {
    for (const candidate of ranked.slice(0, 4)) {
      if (candidate.pair.some((pen) => pen.out)) continue;
      const replyLimit = powerLimit(completed + 1);
      const response = fallbackShot(candidate.pair, 0, completed + 1);
      let worst = value(candidate.pair, 1, completed + 1, risk);
      for (let i = 0; i < 9 && performance.now() - start < budget; i++) {
        const next = simulateShot(
          candidate.pair,
          0,
          {
            ...response,
            power: replyLimit * (0.52 + (i % 3) * 0.24),
            angle: response.angle + (Math.floor(i / 3) - 1) * 0.15,
          },
          completed + 1,
        );
        worst = Math.min(worst, value(next, 1, completed + 2, risk));
      }
      // Retain the attack incentive while accounting for an immediate reply.
      candidate.value +=
        Math.min(0, worst - value(candidate.pair, 1, completed + 1, risk)) *
        0.58;
    }
    ranked.sort((a, b) => b.value - a.value);
  }
  return {
    shot: ranked[0]?.shot ?? baseline,
    candidates: ranked.length,
    milliseconds: performance.now() - start,
  };
}
