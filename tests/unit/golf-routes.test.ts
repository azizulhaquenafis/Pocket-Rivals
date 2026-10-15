import { it, expect } from "vitest";
import { courses } from "../../src/games/mini-golf/ultimate/courses";
import { GolfPhysics } from "../../src/games/mini-golf/ultimate/GolfPhysics";
import { golfSolutions } from "../fixtures/golf-solutions";
import {
  getRoute,
  courseRoutes,
} from "../../src/games/mini-golf/ultimate/ai/routes";
import { AIChallengeMode } from "../../src/games/mini-golf/ultimate/modes/AIChallengeMode";

for (let course = 0; course < 4; course++)
  it(`completes ${courses[course].name} from its tee using legal shots`, () => {
    const w = new GolfPhysics(courses[course], 0, () => 0.9);
    for (const [wait, vx, vy] of golfSolutions[course]) {
      for (let i = 0; i < wait * 240; i++) w.tick(1 / 240);
      expect(w.shoot(vx, vy)).toBe(true);
      for (let i = 0; i < 240 * 12; i++) {
        w.tick(1 / 240);
        if (w.stopped || w.status !== "playing") break;
      }
    }
    expect(w.status).toBe("won");
    expect(w.strokes).toBeLessThanOrEqual(w.limit);
    expect(w.recoveries).toBe(0);
  });

it("AI selects multiple different routes across all 3 difficulties and seeds", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const) {
    for (let c = 0; c < 4; c++) {
      const distinctRoutes = new Set<string>();
      for (let seed = 0; seed < 12; seed++) {
        const route = getRoute(c, difficulty, seed * 7 + 1, seed % 4);
        distinctRoutes.add(JSON.stringify(route));
      }
      expect(distinctRoutes.size).toBeGreaterThanOrEqual(2);
      expect(courseRoutes[c].length).toBe(3);
    }
  }
});

it("AIChallengeMode allows human to finish when AI finishes first and awards win on strokes", () => {
  const mode = new AIChallengeMode([0], 42, "medium", () => {});
  mode.begin();
  // Simulate AI completing in 4 strokes at 15 seconds
  const aiWorld = mode.worlds[1];
  aiWorld.strokes = 4;
  Object.assign(aiWorld.ball, courses[0].hole);
  // Human ball is still playing with 1 stroke at 10 seconds
  const humanWorld = mode.worlds[0];
  humanWorld.strokes = 1;
  Object.assign(humanWorld.ball, { x: 500, y: 500, vx: 0, vy: 0 });

  // Advance simulation past AI finish
  mode.update(0.2);

  // Human must NOT be cut off; match must still be playing
  expect(mode.phase).toBe("playing");
  expect(mode.attempts[1]).toHaveLength(1);
  expect(mode.attempts[1][0].completed).toBe(true);
  expect(mode.attempts[1][0].strokes).toBe(4);
  expect(mode.attempts[0]).toHaveLength(0); // Human still playing!

  // Human sinks putt on 2nd stroke at 25 seconds
  humanWorld.strokes = 2;
  Object.assign(humanWorld.ball, courses[0].hole);
  mode.update(0.2);

  // Now both are done; match completes
  expect(mode.phase).toBe("complete");
  expect(mode.attempts[0]).toHaveLength(1);
  expect(mode.attempts[0][0].completed).toBe(true);
  expect(mode.attempts[0][0].strokes).toBe(2);

  // Human has fewer strokes (2 < 4), so human (1) wins even though AI finished first in time!
  expect(mode.winner).toBe(1);
});

it("AIChallengeMode breaks ties on time only when strokes are equal", () => {
  const mode = new AIChallengeMode([0], 77, "hard", () => {});
  mode.begin();
  // Both finish in 3 strokes, but AI took 18s and Human took 22s
  mode.attempts[0].push({ time: 22, strokes: 3, completed: true });
  mode.attempts[1].push({ time: 18, strokes: 3, completed: true });
  // Equal strokes: AI (2) wins because of faster time
  expect(mode.winner).toBe(2);

  // If Human took 2 strokes and AI took 3 strokes: Human (1) wins regardless of time
  const mode2 = new AIChallengeMode([0], 77, "hard", () => {});
  mode2.attempts[0].push({ time: 35, strokes: 2, completed: true });
  mode2.attempts[1].push({ time: 18, strokes: 3, completed: true });
  expect(mode2.winner).toBe(1);
});

