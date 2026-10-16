import { it, expect } from "vitest";
import { GolfPhysics } from "../../src/games/mini-golf/ultimate/GolfPhysics";
import { temple } from "../../src/games/mini-golf/ultimate/courses/temple";
import { planShot } from "../../src/games/mini-golf/ultimate/ai/ShotPlanner";
import {
  courseRoutes,
  getRoute,
} from "../../src/games/mini-golf/ultimate/ai/routes";
import { MatchRandom } from "../../src/shared/ai/MatchRandom";
import { seedFor } from "../../src/games/mini-golf/ultimate/modes/CompetitionRules";
import { overlaps } from "../../src/games/mini-golf/ultimate/GolfCollision";
it("Temple AI resting waypoints clear permanent colliders, quicksand and the moving-boulder sweep", () => {
  for (const route of courseRoutes[3])
    for (const [x, y] of route) {
      const p = { x, y };
      expect(
        temple.circles.every((c) => Math.hypot(x - c.x, y - c.y) > c.r + 7),
      ).toBe(true);
      expect(temple.walls.every((r) => !overlaps(p, r))).toBe(true);
      expect(
        temple.surfaces.every(
          (s) =>
            s.kind !== "quicksand" ||
            !(x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h),
        ),
      ).toBe(true);
    }
});
for (const difficulty of ["medium", "hard", "impossible"] as const)
  for (const seed of [11, 42, 123])
    it(`${difficulty} Temple seed ${seed} completes with real legal planned shots`, () => {
      const w = new GolfPhysics(temple, 0, seedFor(seed, 3)),
        r = new MatchRandom(seed);
      let waypoint = 0,
        repeats = 0;
      const history: any[] = [];
      for (let shot = 0; shot < w.limit && w.status === "playing"; shot++) {
        const delay = r.sample(
          { medium: 2.2, hard: 1.6, impossible: 1.2 }[difficulty] *
            (0.9 + r.tempo * 0.1),
          0.15,
          0.9,
        );
        const before = { x: w.ball.x, y: w.ball.y };
        const p = planShot({
          state: w.exportState(),
          difficulty,
          waypoint,
          delay,
          seed,
          replay: true,
        });
        waypoint = p.waypoint;
        expect(Math.hypot(p.vx, p.vy)).toBeLessThanOrEqual(650.001);
        for (let i = 0; i < Math.round((delay + p.wait) * 240); i++)
          w.tick(1 / 240);
        if (!w.shootable) {
          for (
            let i = 0;
            i < 240 * 12 && !w.shootable && w.status === "playing";
            i++
          )
            w.tick(1 / 240);
        }
        expect(w.shoot(p.vx, p.vy), JSON.stringify(history)).toBe(true);
        for (let i = 0; i < 240 * 12; i++) {
          w.tick(1 / 240);
          if (w.stopped || w.status !== "playing") break;
        }
        history.push({
          waypoint,
          x: Math.round(w.ball.x),
          y: Math.round(w.ball.y),
          recoveries: w.recoveries,
        });
        repeats =
          Math.hypot(w.ball.x - before.x, w.ball.y - before.y) < 20
            ? repeats + 1
            : 0;
        expect(repeats, JSON.stringify(history)).toBeLessThan(5);
      }
      expect(w.status, JSON.stringify(history)).toBe("won");
      expect(w.dynamics.plates.slice(1)).toEqual([true, true]);
      expect(w.strokes).toBeLessThanOrEqual(w.limit);
    }, 30000);
it("reached Temple waypoints are recorded before forecasting movement during reaction time", () => {
  const seed = 123,
    r = new MatchRandom(seed),
    route = getRoute(3, "impossible", seed, r.role),
    w = new GolfPhysics(temple, 0, seed);
  Object.assign(w.ball, { x: route[5][0], y: route[5][1], vx: 100, vy: 0 });
  const p = planShot({
    state: w.exportState(),
    difficulty: "impossible",
    waypoint: 5,
    delay: 1.2,
    seed,
    replay: true,
  });
  expect(p.waypoint).toBeGreaterThan(5);
});
