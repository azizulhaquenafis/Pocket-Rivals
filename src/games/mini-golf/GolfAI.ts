import type { Difficulty } from "../../shared/contracts/AIController";
import type { Course } from "./courses";
import { FRICTION, MAX_POWER, simulate, type GolfBall } from "./GolfPhysics";
interface Point {
  x: number;
  y: number;
}
export interface GolfShot {
  angle: number;
  power: number;
  milliseconds: number;
  candidates: number;
}
function clear(a: Point, b: Point, c: Course) {
  const steps = Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 5);
  for (let i = 0; i <= steps; i++) {
    const x = a.x + ((b.x - a.x) * i) / (steps || 1),
      y = a.y + ((b.y - a.y) * i) / (steps || 1);
    if (
      c.obstacles.some(
        (o) =>
          x > o.x - 9 && x < o.x + o.w + 9 && y > o.y - 9 && y < o.y + o.h + 9,
      )
    )
      return false;
  }
  return true;
}
function route(c: Course) {
  const points: Point[] = [c.hole];
  for (const o of c.obstacles)
    for (const x of [o.x - 12, o.x + o.w + 12])
      for (const y of [o.y - 12, o.y + o.h + 12])
        if (x > 8 && x < 332 && y > 8 && y < 392) points.push({ x, y });
  const distances = points.map((_, i) => (i ? Infinity : 0)),
    visited = new Set<number>();
  for (let k = 0; k < points.length; k++) {
    let at = -1;
    for (let i = 0; i < points.length; i++)
      if (!visited.has(i) && (at === -1 || distances[i] < distances[at]))
        at = i;
    if (at < 0) break;
    visited.add(at);
    points.forEach((p, i) => {
      if (clear(points[at], p, c))
        distances[i] = Math.min(
          distances[i],
          distances[at] + Math.hypot(p.x - points[at].x, p.y - points[at].y),
        );
    });
  }
  return {
    points,
    cost: (p: Point) =>
      Math.min(
        ...points.map((q, i) =>
          clear(p, q, c)
            ? Math.hypot(p.x - q.x, p.y - q.y) + distances[i]
            : Infinity,
        ),
      ),
  };
}
export function planGolfShot(
  c: Course,
  ball: GolfBall,
  difficulty: Difficulty,
  random = Math.random,
): GolfShot {
  const start = performance.now(),
    cfg = {
      medium: { ms: 45, angles: 16, powers: 5, error: 0.1 },
      hard: { ms: 140, angles: 36, powers: 8, error: 0.025 },
      impossible: { ms: 300, angles: 64, powers: 10, error: 0 },
    }[difficulty],
    routing = route(c),
    candidates: { angle: number; power: number }[] = [];
  for (const p of routing.points) {
    const angle = Math.atan2(p.y - ball.y, p.x - ball.x),
      power = Math.sqrt(2 * FRICTION * Math.hypot(p.x - ball.x, p.y - ball.y));
    for (const factor of [0.96, 1, 1.04, 1.18])
      candidates.push({ angle, power: Math.min(MAX_POWER, power * factor) });
  }
  for (let i = 0; i < cfg.angles; i++)
    for (let j = 1; j <= cfg.powers; j++)
      candidates.push({
        angle: (i * Math.PI * 2) / cfg.angles,
        power: 70 + (j * (MAX_POWER - 70)) / cfg.powers,
      });
  let best = candidates[0],
    value = Infinity,
    n = 0;
  const finalists: { shot: typeof best; ball: GolfBall; cost: number }[] = [];
  for (const shot of candidates) {
    if (n > 8 && performance.now() - start > cfg.ms * 0.75) break;
    n++;
    const next = simulate(c, ball, shot.angle, shot.power),
      cost = next.holed
        ? -100000 + shot.power * 0.001
        : routing.cost(next) + shot.power * 0.002;
    if (cost < value) {
      value = cost;
      best = shot;
    }
    if (difficulty === "impossible" && !next.holed && Number.isFinite(cost))
      finalists.push({ shot, ball: next, cost });
    if (next.holed) break;
  }
  // Evaluate a direct second putt from promising landing positions, within the same budget.
  if (difficulty === "impossible" && value > 0)
    for (const f of finalists.sort((a, b) => a.cost - b.cost).slice(0, 6)) {
      if (performance.now() - start > cfg.ms) break;
      const angle = Math.atan2(c.hole.y - f.ball.y, c.hole.x - f.ball.x),
        power = Math.sqrt(
          2 * FRICTION * Math.hypot(c.hole.x - f.ball.x, c.hole.y - f.ball.y),
        ),
        end = simulate(c, f.ball, angle, power);
      if (end.holed && f.cost < value + 60) {
        best = f.shot;
        break;
      }
    }
  return {
    angle: best.angle + (random() - 0.5) * cfg.error,
    power: Math.max(
      20,
      Math.min(MAX_POWER, best.power * (1 + (random() - 0.5) * cfg.error)),
    ),
    milliseconds: performance.now() - start,
    candidates: n,
  };
}
