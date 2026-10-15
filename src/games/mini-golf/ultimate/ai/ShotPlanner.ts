import { MatchRandom } from "../../../../shared/ai/MatchRandom";
import { GolfPhysics } from "../GolfPhysics";
import { courses } from "../courses";
import { getRoute, routes } from "./routes";
import type { Difficulty } from "../../../../shared/contracts/AIController";
export interface PlanInput {
  state: ReturnType<GolfPhysics["exportState"]>;
  difficulty: Difficulty;
  waypoint: number;
  delay: number;
  seed?: number;
  replay?: boolean;
}
export interface ShotPlan {
  vx: number;
  vy: number;
  wait: number;
  waypoint: number;
  origin: { x: number; y: number };
  milliseconds: number;
  candidates: number;
}
/** Bounded, deterministic candidate ordering. Simulations use the actual 240 Hz engine. */
export function planShot(input: PlanInput): ShotPlan {
  const style = new MatchRandom(input.seed ?? input.state.seed);
  const candidateLimit = { medium: 180, hard: 420, impossible: 800 }[
    input.difficulty
  ];
  const start = performance.now(),
    ci = courses.findIndex((c) => c.id === input.state.course),
    route = getRoute(ci, input.difficulty, style.seed, style.role);
  const budget = { medium: 65, hard: 140, impossible: 240 }[input.difficulty];
  const base = new GolfPhysics(
    courses[ci],
    input.state.difficulty,
    input.state.seed ?? 1,
  );
  base.restoreSimulation(input.state);
  for (let i = 0; i < input.delay * 240; i++) base.tick(1 / 240);
  let waypoint = Math.min(input.waypoint, route.length - 1);
  while (waypoint < route.length - 1) {
    const t = route[waypoint];
    if (
      Math.hypot(base.ball.x - (t[2] ?? t[0]), base.ball.y - (t[3] ?? t[1])) >
      25
    )
      break;
    waypoint++;
  }
  const [tx, ty, gx = tx, gy = ty] = route[waypoint],
    angle = Math.atan2(ty - base.ball.y, tx - base.ball.x),
    distance = Math.hypot(tx - base.ball.x, ty - base.ball.y);
  const origin = { x: base.ball.x, y: base.ball.y },
    snapshot = base.exportState();
  let best = Infinity,
    candidates = 0,
    shot = { vx: Math.cos(angle) * 200, vy: Math.sin(angle) * 200, wait: 0 };
  const trial = new GolfPhysics(
    courses[ci],
    input.state.difficulty,
    input.state.seed ?? 1,
  );
  const tolerance = { medium: 8, hard: 3, impossible: 1.5 }[input.difficulty];
  let alternatives: {
    vx: number;
    vy: number;
    wait: number;
    cost: number;
    rank: number;
  }[] = [];
  const evaluate = (a: number, p: number, wait: number) => {
    trial.restoreSimulation(snapshot);
    trial.recoveries = 0;
    trial.impacts = 0;
    for (let i = 0; i < wait * 240; i++) trial.tick(1 / 240);
    const vx = Math.cos(a) * p,
      vy = Math.sin(a) * p;
    if (!trial.shoot(vx, vy)) return;
    for (let i = 0; i < 240 * 10; i++) {
      trial.tick(1 / 240);
      if (trial.stopped || trial.status !== "playing") break;
    }
    candidates++;
    let cost =
      trial.status === "won"
        ? -1e6
        : Math.hypot(trial.ball.x - gx, trial.ball.y - gy) +
          (trial.recoveries ? 10000 : 0) +
          (!trial.stopped ? 2000 : 0) +
          wait * [3.5, 1.5, 2.5, 2][style.role] +
          Math.min(12, trial.impacts) * [0.03, 0.22, 0.1, 0.06][style.role];
    // Preserve the two latched temple switches before advancing toward its final gate.
    if (ci === 3) {
      if (Math.hypot(tx - 1810, ty - 200) < 60 && !trial.dynamics.plates[1])
        cost += 200;
      if (Math.hypot(tx - 1810, ty - 950) < 60 && !trial.dynamics.plates[2])
        cost += 200;
    }
    if (cost < best) {
      best = cost;
      shot = { vx, vy, wait };
    }
    if (cost <= best + tolerance) {
      const rank = style.rank(
        Math.round(a * 100000) +
          Math.round(p * 100) * 17 +
          Math.round(wait * 100) +
          input.state.strokes * 101,
      );
      alternatives = alternatives.filter(
        (v) =>
          v.cost <= best + tolerance &&
          !(
            Math.abs(v.vx - vx) < 0.001 &&
            Math.abs(v.vy - vy) < 0.001 &&
            v.wait === wait
          ),
      );
      alternatives.push({ vx, vy, wait, cost, rank });
      alternatives.sort((a, b) => a.cost - b.cost || a.rank - b.rank);
      alternatives.length = Math.min(16, alternatives.length);
    }
  };
  const estimate = Math.max(45, Math.min(650, Math.sqrt(distance * 220)));
  const powers = [
    Math.max(45, Math.min(650, estimate + (style.tempo - 1) * 4)),
    estimate,
    ...Array.from({ length: 25 }, (_, i) => 50 + i * 25),
  ];
  outer: for (const wait of [0, 0.6, 1.2, 2, 3, 4, 5, 6])
    for (const da of [
      0,
      -0.035 * style.side,
      0.035 * style.side,
      -0.09 * style.side,
      0.09 * style.side,
      -0.18 * style.side,
      0.18 * style.side,
    ])
      for (const p of powers) {
        evaluate(angle + da, p, wait);
        if (
          best < 1 ||
          (input.replay
            ? candidates >= candidateLimit * 0.7
            : performance.now() - start > budget * 0.7)
        )
          break outer;
      }
  // Refine the strongest physically simulated shot (no authored velocities).
  const center = { ...shot },
    pa = Math.atan2(center.vy, center.vx),
    pp = Math.hypot(center.vx, center.vy);
  refine: for (const da of [0, -0.018, 0.018, -0.009, 0.009])
    for (const dp of [0, -12, 12, -6, 6, -3, 3]) {
      evaluate(pa + da, Math.max(44, Math.min(650, pp + dp)), center.wait);
      if (
        input.replay
          ? candidates >= candidateLimit * 0.9
          : performance.now() - start > budget * 0.9
      )
        break refine;
    }
  // Fine refinement around the updated winner (not the original coarse sample)
  // exposes truly comparable landings and improves precision near narrow routes.
  const fine = { ...shot },
    fineAngle = Math.atan2(fine.vy, fine.vx),
    finePower = Math.hypot(fine.vx, fine.vy);
  polish: for (const da of [0, -0.002, 0.002])
    for (const dp of [-1, 1, -0.5, 0.5]) {
      if (
        input.replay
          ? candidates >= candidateLimit
          : performance.now() - start >= budget
      )
        break polish;
      evaluate(
        fineAngle + da,
        Math.max(44, Math.min(650, finePower + dp)),
        fine.wait,
      );
    }
  // Only choose among simulated, comparably good landings. Never substitute an
  // untested angular error. A winning shot excludes every non-winning candidate.
  const comparable = alternatives
    .filter((v) => v.cost <= best + tolerance)
    .sort((a, b) => a.rank - b.rank);
  if (comparable.length) {
    const v = comparable[0];
    shot = { vx: v.vx, vy: v.vy, wait: v.wait };
  }
  return {
    ...shot,
    origin,
    waypoint,
    milliseconds: performance.now() - start,
    candidates,
  };
}
