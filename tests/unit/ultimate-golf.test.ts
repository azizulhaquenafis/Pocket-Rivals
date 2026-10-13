import { describe, it, expect } from "vitest";
import { courses } from "../../src/games/mini-golf/ultimate/courses";
import { GolfPhysics } from "../../src/games/mini-golf/ultimate/GolfPhysics";
import {
  hitRect,
  hitCircle,
  hitRotated,
} from "../../src/games/mini-golf/ultimate/GolfCollision";
import {
  GolfView,
  shotVector,
} from "../../src/games/mini-golf/ultimate/GolfInput";
import {
  strokeLimit,
  scoreFor,
} from "../../src/games/mini-golf/ultimate/GolfRules";
const run = (w: GolfPhysics, seconds: number, fps = 60) => {
  for (let i = 0; i < Math.round(seconds * fps); i++) w.advance(1 / fps);
};
describe("Ultimate Golf native port", () => {
  it("retains all four original layouts, starts, cups and limits", () => {
    expect(courses.map((c) => c.name)).toEqual([
      "Foundry",
      "Shoreline",
      "Event Horizon",
      "Lost Temple",
    ]);
    expect(courses.map((c) => strokeLimit(c, 1))).toEqual([20, 28, 22, 20]);
    expect(courses.map((c) => strokeLimit(c, 0))).toEqual([27, 38, 30, 27]);
    expect(courses[3].walls).toHaveLength(13);
    expect(courses[2].ground).toHaveLength(11);
    expect(courses[1].ground).toHaveLength(10);
    expect(scoreFor(courses[0], 10, 1)).toBe(500);
  });
  it("has identical simulation at 30, 60 and 120 FPS", () => {
    const states = [30, 60, 120].map((fps) => {
      const w = new GolfPhysics(courses[0]);
      w.shoot(40, -350);
      run(w, 4, fps);
      return w.snapshot();
    });
    expect(states[0]).toEqual(states[1]);
    expect(states[1]).toEqual(states[2]);
  });
  it("rejects duplicate shots and illegal powers and settles with linear friction", () => {
    const w = new GolfPhysics(courses[0]);
    expect(w.shoot(NaN, 0)).toBe(false);
    expect(w.shoot(1, 1)).toBe(false);
    expect(w.shoot(0, -150)).toBe(true);
    expect(w.shoot(0, -150)).toBe(false);
    run(w, 2);
    expect(w.stopped).toBe(true);
    expect(w.strokes).toBe(1);
    expect(w.ball.y).toBeCloseTo(879.4, 0);
  });
  it("uses separating normals, including embedded centres and rotated colliders", () => {
    const b = { x: 50, y: 50, vx: 200, vy: 0 };
    hitRect(b, { x: 40, y: 40, w: 20, h: 20 });
    expect(b.x).toBeLessThan(34);
    expect(b.vx).toBe(-200);
    hitRect(b, { x: 40, y: 40, w: 20, h: 20 });
    expect(b.vx).toBe(-200);
    Object.assign(b, { x: 0, y: 0, vx: 0, vy: 200 });
    hitCircle(b, { x: 0, y: 0 }, 30);
    expect(b.y).toBeLessThan(-36);
    expect(b.vy).toBe(-200);
    Object.assign(b, { x: 0, y: 0, vx: 200, vy: 200 });
    hitRotated(b, { x: 0, y: 0 }, 100, 12, 0.5, 2);
    expect(Number.isFinite(b.x + b.y + b.vx + b.vy)).toBe(true);
  });
  it("never tunnels through a thin wall at maximum speed", () => {
    const w = new GolfPhysics(courses[3]);
    Object.assign(w.ball, { x: 1100, y: 200 });
    w.shoot(650, 0);
    run(w, 0.2);
    expect(w.ball.x).toBeLessThan(1145);
    expect(w.ball.vx).toBeLessThan(0);
  });
  it("captures every cup and allows a win on the final stroke", () => {
    for (const c of courses) {
      const w = new GolfPhysics(c);
      w.strokes = w.limit - 1;
      Object.assign(w.ball, { x: c.hole.x - 25, y: c.hole.y });
      expect(w.shoot(80, 0)).toBe(true);
      run(w, 1);
      expect(w.status, c.id).toBe("won");
      expect(w.strokes).toBe(w.limit);
      expect(w.score).toBe(250);
    }
  });
  it("ends after the last missed stroke stops", () => {
    const w = new GolfPhysics(courses[0]);
    w.strokes = w.limit - 1;
    w.shoot(0, -70);
    run(w, 2);
    expect(w.status).toBe("lost");
    expect(w.shoot(0, -100)).toBe(false);
  });
  it("returns hazards to the prior shot without charging another stroke", () => {
    const w = new GolfPhysics(courses[1]);
    Object.assign(w.ball, { x: 70, y: 900 });
    w.shoot(-200, 0);
    run(w, 0.3);
    expect(w.recoveries).toBe(1);
    expect(w.strokes).toBe(1);
    expect(w.ball.x).toBe(70);
    expect(w.stopped).toBe(true);
  });
  it("tides flood and drain, ford flows, and contacts do not change the tide clock", () => {
    const w = new GolfPhysics(courses[1]),
      d = w.dynamics;
    d.time = 3.4;
    expect(d.safe({ x: 520, y: 450 })).toBe(true);
    d.time = 4;
    expect(d.safe({ x: 520, y: 450 })).toBe(false);
    expect(d.safe({ x: 900, y: 600 })).toBe(true);
    d.time = 7.6;
    expect(d.safe({ x: 520, y: 450 })).toBe(true);
    Object.assign(w.ball, { x: 900, y: 600 });
    run(w, 0.1);
    expect(w.ball.vx).toBeGreaterThan(0);
  });
  it("portals route with a cooldown and preserve speed", () => {
    const w = new GolfPhysics(courses[2]);
    Object.assign(w.ball, { x: 1840, y: 700, vx: 0, vy: 100 });
    w.tick(1 / 240);
    expect(w.ball.x).toBeLessThan(1300);
    expect(w.ball.y).toBeCloseTo(340);
    expect(w.ball.vx).toBeLessThan(-99);
    expect(w.dynamics.portalCooldown).toBe(0.5);
  });
  it("UFO lifts once, drops onto a legal platform and releases controls", () => {
    const w = new GolfPhysics(courses[2], 1, () => 0.1);
    const u = w.dynamics.ufo;
    Object.assign(u, { active: true, done: true, x: 140, y: 990, hover: 0.79 });
    w.tick(0.02);
    expect(u.carry).toBeGreaterThan(0);
    expect(w.shootable).toBe(false);
    for (let i = 0; i < 300; i++) w.tick(1 / 240);
    expect(u.carry).toBeLessThanOrEqual(0);
    expect(u.used).toBe(true);
    expect(w.dynamics.safe(w.ball)).toBe(true);
  });
  it("temple bridge cracks, regenerates, plates open doors and recovery clears outer plates", () => {
    const w = new GolfPhysics(courses[3]),
      d = w.dynamics;
    Object.assign(w.ball, { x: 630, y: 200 });
    w.tick(1 / 240);
    expect(d.planks[0]).toBeGreaterThan(0);
    run(w, 0.6);
    expect(w.recoveries).toBeGreaterThan(0);
    run(w, 5);
    expect(d.planks[0]).toBe(0);
    Object.assign(w.ball, { x: 1000, y: 570 });
    run(w, 0.6);
    expect(d.doors[0]).toBe(1);
    Object.assign(w.ball, { x: 1810, y: 200 });
    w.tick(1 / 240);
    Object.assign(w.ball, { x: 1810, y: 950 });
    run(w, 0.6);
    expect(d.doors[1]).toBe(1);
    Object.assign(w.ball, { x: 690, y: 500 });
    w.tick(1 / 240);
    expect(d.plates.slice(1)).toEqual([false, false]);
  });
  it("quicksand recovery waits three stationary seconds", () => {
    const w = new GolfPhysics(courses[3]);
    Object.assign(w.ball, { x: 930, y: 770 });
    run(w, 2.9);
    expect(w.recoveries).toBe(0);
    run(w, 0.2);
    expect(w.recoveries).toBe(1);
  });
  it("rotation/inverse transforms and power are resolution-independent in 9:16 and focus views", () => {
    const v = new GolfView();
    expect(v.bounds.w / v.bounds.h).toBe(9 / 16);
    for (const zoom of [1, 2.5]) {
      v.zoom = zoom;
      v.follow(courses[0].start, 1);
      const a = { x: 800, y: 300 },
        b = { x: 900, y: 320 };
      expect(v.unproject(v.project(a)).x).toBeCloseTo(a.x);
      expect(v.unproject(v.project(a)).y).toBeCloseTo(a.y);
      expect(
        shotVector(v.unproject(v.project(a)), v.unproject(v.project(b))).x,
      ).toBeCloseTo(-312.5);
    }
  });
  it("survives prolonged moving-obstacle simulation at every difficulty", () => {
    for (const c of courses)
      for (const difficulty of [0, 1, 2] as const) {
        const w = new GolfPhysics(c, difficulty, () => 0.5);
        for (let i = 0; i < 240 * 90; i++) {
          if (w.shootable && i % 240 === 0)
            w.shoot(Math.sin(i) * 650, Math.cos(i) * 650);
          w.tick(1 / 240);
          expect(
            Number.isFinite(w.ball.x + w.ball.y + w.ball.vx + w.ball.vy),
          ).toBe(true);
          expect(Math.hypot(w.ball.vx, w.ball.vy)).toBeLessThanOrEqual(650.001);
        }
      }
  });
});
