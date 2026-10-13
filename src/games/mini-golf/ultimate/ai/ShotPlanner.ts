import { GolfPhysics } from "../GolfPhysics";
import { courses } from "../courses";
import { routes } from "./routes";
import type { Difficulty } from "../../../../shared/contracts/AIController";
export interface PlanInput {
  state: ReturnType<GolfPhysics["exportState"]>;
  difficulty: Difficulty;
  waypoint: number;
  delay: number;
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
  const start = performance.now(),
    ci = courses.findIndex((c) => c.id === input.state.course),
    route = routes[ci];
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
          wait * 2;
    // Preserve the two latched temple switches before advancing toward its final gate.
    if (ci === 3 && waypoint === 7 && !trial.dynamics.plates[1]) cost += 200;
    if (ci === 3 && waypoint === 8 && !trial.dynamics.plates[2]) cost += 200;
    if (cost < best) {
      best = cost;
      shot = { vx, vy, wait };
    }
  };
  const estimate = Math.max(45, Math.min(650, Math.sqrt(distance * 220)));
  const powers = [
    estimate,
    ...Array.from({ length: 25 }, (_, i) => 50 + i * 25),
  ];
  outer: for (const wait of [0, 0.6, 1.2, 2, 3, 4, 5, 6])
    for (const da of [0, -0.035, 0.035, -0.09, 0.09, -0.18, 0.18])
      for (const p of powers) {
        evaluate(angle + da, p, wait);
        if (best < 1 || performance.now() - start > budget * 0.7) break outer;
      }
  // Refine the strongest physically simulated shot (no authored velocities).
  const center = { ...shot },
    pa = Math.atan2(center.vy, center.vx),
    pp = Math.hypot(center.vx, center.vy);
  refine: for (const da of [0, -0.018, 0.018, -0.009, 0.009])
    for (const dp of [0, -12, 12, -6, 6, -3, 3]) {
      evaluate(pa + da, Math.max(44, Math.min(650, pp + dp)), center.wait);
      if (best < 0.5 || performance.now() - start > budget) break refine;
    }
  // Medium chooses a slightly less efficient but still legal angle on alternate shots.
  if (input.difficulty === "medium" && input.state.strokes % 3 === 1) {
    const a = Math.atan2(shot.vy, shot.vx) + 0.016,
      p = Math.hypot(shot.vx, shot.vy);
    shot.vx = Math.cos(a) * p;
    shot.vy = Math.sin(a) * p;
  }
  return {
    ...shot,
    origin,
    waypoint,
    milliseconds: performance.now() - start,
    candidates,
  };
}
