import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Bird } from "./ArenaPhysics";
export const STAR_GOAL = 15;
export const STAR_RADIUS = 10;
export interface Star {
  id: number;
  x: number;
  y: number;
  born: number;
}
export interface StarBurst {
  x: number;
  y: number;
  player: 0 | 1;
  age: number;
}
/** Uniform candidates across the open arena; reject instant pickups and nearby repeats. */
export function spawnStar(
  random: MatchRandom,
  id: number,
  age: number,
  players: readonly Bird[],
  previous?: { x: number; y: number },
): Star {
  let best = { x: 160, y: 230 },
    bestClearance = -Infinity;
  for (let attempt = 0; attempt < 64; attempt++) {
    const point = { x: 58 + random.next() * 204, y: 110 + random.next() * 240 };
    const clearance = Math.min(
      ...players
        .filter((p) => p.alive)
        .map((p) => Math.hypot(p.x - point.x, p.y - point.y) / 65),
      previous
        ? Math.hypot(previous.x - point.x, previous.y - point.y) / 80
        : Infinity,
    );
    if (clearance > bestClearance) {
      best = point;
      bestClearance = clearance;
    }
    if (clearance >= 1) break;
  }
  return { id, ...best, born: age };
}
export function pickupDistance(
  s: Star,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    length = dx * dx + dy * dy;
  const t = length
    ? Math.max(
        0,
        Math.min(1, ((s.x - from.x) * dx + (s.y - from.y) * dy) / length),
      )
    : 0;
  return Math.hypot(from.x + t * dx - s.x, from.y + t * dy - s.y);
}
