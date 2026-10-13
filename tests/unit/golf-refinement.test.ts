import { describe, it, expect } from "vitest";
import { courses } from "../../src/games/mini-golf/ultimate/courses";
import { GolfPhysics } from "../../src/games/mini-golf/ultimate/GolfPhysics";
import {
  GolfView,
  shotVector,
} from "../../src/games/mini-golf/ultimate/GolfInput";
import { LocalVersusMode } from "../../src/games/mini-golf/ultimate/modes/LocalVersusMode";
import {
  winner,
  seedFor,
} from "../../src/games/mini-golf/ultimate/modes/CompetitionRules";
import { planShot } from "../../src/games/mini-golf/ultimate/ai/ShotPlanner";
import { golfSolutions } from "../fixtures/golf-solutions";
describe("Golf refinement", () => {
  it("uses a uniform invertible camera across phone and landscape sizes", () => {
    for (const [w, h] of [
      [288, 512],
      [290, 390],
      [358, 686],
      [1200, 600],
      [810, 245],
    ]) {
      const v = new GolfView();
      v.configure({ x: 14, y: 70, w, h });
      for (const focus of [false, true]) {
        if (focus) v.focus(courses[3].start);
        v.follow(courses[3].start, 1);
        for (const p of [
          courses[3].start,
          { x: 960, y: 575 },
          courses[3].hole,
        ]) {
          const q = v.unproject(v.project(p));
          expect(q.x).toBeCloseTo(p.x, 8);
          expect(q.y).toBeCloseTo(p.y, 8);
        }
        const a = v.project({ x: 200, y: 300 }),
          b = v.project({ x: 300, y: 300 }),
          c = v.project({ x: 200, y: 400 });
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(
          Math.hypot(a.x - c.x, a.y - c.y),
          8,
        );
        expect(shotVector(v.unproject(a), v.unproject(b)).x).toBeCloseTo(
          -312.5,
          8,
        );
      }
    }
  });
  it("every portal exit has ball clearance on its destination platform", () => {
    for (const c of courses)
      for (const p of c.portals ?? []) {
        const a = (p.angle * Math.PI) / 180,
          x = p.to.x + Math.cos(a) * 35,
          y = p.to.y + Math.sin(a) * 35;
        const w = new GolfPhysics(c);
        for (const [dx, dy] of [
          [0, 0],
          [7, 0],
          [-7, 0],
          [0, 7],
          [0, -7],
        ])
          expect(w.dynamics.safe({ x: x + dx, y: y + dy })).toBe(true);
      }
  });
  it("repeats UFO visits and provides a warning before a visit", () => {
    const w = new GolfPhysics(courses[2], 1, 123);
    const cfg = courses[2].ufo!;
    w.dynamics.time = cfg.first - 0.5;
    w.tick(1 / 240);
    expect(w.dynamics.ufo.warning).toBe(true);
    w.dynamics.time = cfg.first;
    w.tick(1 / 240);
    expect(w.dynamics.ufo.active).toBe(true);
    expect(w.dynamics.ufo.event).toBe(0);
    w.dynamics.ufo.active = false;
    w.dynamics.time = cfg.first + cfg.interval;
    w.tick(1 / 240);
    expect(w.dynamics.ufo.event).toBe(1);
  });
  it("seeded obstacle sequences and simulation restoration are reproducible", () => {
    const a = new GolfPhysics(courses[2], 0, 432),
      b = new GolfPhysics(courses[2], 0, 432);
    for (let i = 0; i < 12000; i++) {
      a.tick(1 / 240);
      b.tick(1 / 240);
    }
    expect(a.exportState()).toEqual(b.exportState());
    const clone = new GolfPhysics(courses[2], 0, 432);
    clone.restoreSimulation(a.exportState());
    for (let i = 0; i < 1000; i++) {
      a.tick(1 / 240);
      clone.tick(1 / 240);
    }
    expect(a.exportState()).toEqual(clone.exportState());
  });
  it("hot-seat pauses menus, resets identical conditions, and scores only one attempt", () => {
    const m = new LocalVersusMode([3], 123);
    m.update(10);
    expect(m.elapsed).toBe(0);
    m.begin();
    expect(m.world.seed).toBe(seedFor(123, 3));
    m.update(0.1);
    m.forfeit();
    m.forfeit();
    expect(m.attempts[0]).toHaveLength(1);
    expect(m.phase).toBe("ready");
    m.update(10);
    m.begin();
    expect(m.elapsed).toBe(0);
    expect(m.world.ball).toMatchObject(courses[3].start);
    expect(m.world.strokes).toBe(0);
    expect(m.world.seed).toBe(seedFor(123, 3));
    m.forfeit();
    expect(m.phase).toBe("complete");
    expect(m.winner).toBe("draw");
  });
  it("compares completion, elapsed time, strokes and simultaneous finishes explicitly", () => {
    const a = { time: 25, strokes: 4, completed: true };
    expect(winner(a, { ...a, time: 26, strokes: 2 })).toBe(1);
    expect(winner(a, { ...a, time: 25.05, strokes: 3 })).toBe(2);
    expect(winner(a, { ...a, time: 25.05 })).toBe("draw");
    expect(winner(a, { ...a, completed: false })).toBe(1);
    expect(winner({ ...a, completed: false }, { ...a, completed: false })).toBe(
      "draw",
    );
  });
  it("all four real completion routes remain valid at different fixed frame rates", () => {
    for (const fps of [30, 60, 120])
      for (let c = 0; c < 4; c++) {
        const w = new GolfPhysics(courses[c], 0, () => 0.9);
        for (const [wait, vx, vy] of golfSolutions[c]) {
          for (let t = 0; t < Math.round(wait * 240); t++) w.tick(1 / 240);
          expect(w.shoot(vx, vy)).toBe(true);
          for (let t = 0; t < 12 * fps; t++) {
            // Stop at the precise resting step, as an input can arrive at any simulation boundary.
            for (let step = 0; step < 240 / fps; step++) {
              w.tick(1 / 240);
              if (w.stopped || w.status !== "playing") break;
            }
            if (w.stopped || w.status !== "playing") break;
          }
        }
        expect(w.status).toBe("won");
        expect(w.recoveries).toBe(0);
      }
  });
  it("each AI difficulty produces bounded legal shots from real course state", () => {
    for (const difficulty of ["medium", "hard", "impossible"] as const)
      for (const c of courses) {
        const w = new GolfPhysics(c, 0, 123);
        const p = planShot({
          state: w.exportState(),
          difficulty,
          waypoint: 0,
          delay: 0.8,
        });
        expect(Math.hypot(p.vx, p.vy)).toBeLessThanOrEqual(650.001);
        expect(p.candidates).toBeGreaterThan(0);
        expect(p.milliseconds).toBeLessThan(550);
        expect(w.shoot(p.vx, p.vy)).toBe(true);
        expect(w.strokes).toBe(1);
      }
  });
});
