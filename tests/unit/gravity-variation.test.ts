import { it, expect } from "vitest";
import {
  CourseStream,
  TRAPS,
} from "../../src/games/gravity-runner/CourseStream";
import { GravityMatch } from "../../src/games/gravity-runner/Rules";
import { GravityAI } from "../../src/games/gravity-runner/AI";
import {
  obstacleBounds,
  obstacleOutline,
  touchesTrap,
} from "../../src/games/gravity-runner/ObstacleGeometry";
import {
  advanceRunner,
  type Gap,
  type Obstacle,
} from "../../src/games/gravity-runner/RunnerPhysics";
it("each map generates only its own signature traps and nonperiodic seeded combinations", () => {
  for (const map of Object.keys(TRAPS)) {
    const openings = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const stream = new CourseStream(seed, map),
        gaps: Gap[] = [],
        obstacles: Obstacle[] = [],
        sequence: string[] = [];
      for (let i = 0; i < 80; i++) {
        stream.append(gaps, obstacles);
        sequence.push(stream.history.at(-1)!);
      }
      const kinds = new Set(
        obstacles.filter((o) => o.kind !== "platform").map((o) => o.kind),
      );
      expect(kinds).toEqual(new Set([...TRAPS[map].side, TRAPS[map].center]));
      expect(new Set(sequence).size).toBeGreaterThanOrEqual(6);
      for (let period = 1; period <= 10; period++)
        expect(
          sequence.every((s, i) => i < period || s === sequence[i - period]),
        ).toBe(false);
      for (let i = 1; i < sequence.length; i++)
        expect(sequence[i]).not.toBe(sequence[i - 1]);
      openings.add(sequence.slice(0, 8).join(","));
      expect(stream.history.length).toBeLessThanOrEqual(16);
      const replay = new CourseStream(seed, map),
        rg: Gap[] = [],
        ro: Obstacle[] = [];
      for (let i = 0; i < 80; i++) replay.append(rg, ro);
      expect(ro).toEqual(obstacles);
      expect(rg).toEqual(gaps);
    }
    expect(openings.size).toBeGreaterThan(70);
  }
});
it("speed has a calm start, smooth staged increases and a safe endless ceiling", () => {
  const m = new GravityMatch(7);
  expect(m.speed(0)).toBe(120);
  expect(m.speed(8)).toBe(120);
  expect(m.speed(9.5)).toBe(132);
  expect(m.speed(11)).toBe(144);
  expect(m.speed(27)).toBe(144);
  expect(m.speed(31)).toBe(168);
  expect(m.speed(111)).toBe(264);
  expect(m.speed(1000000)).toBe(264);
  for (let age = 7; age < 112; age += 0.1)
    expect(m.speed(age + 0.01) - m.speed(age)).toBeLessThan(0.121);
});
it("later sections vary spacing and raise hazard density without shortening legal transit below 245", () => {
  const stream = new CourseStream(42, "green"),
    gaps: Gap[] = [],
    obstacles: Obstacle[] = [];
  let early = 0,
    late = 0;
  for (let i = 0; i < 150; i++) {
    const x = stream.next;
    stream.append(gaps, obstacles);
    if (i < 20) early += stream.next - x;
    if (i >= 130) late += stream.next - x;
  }
  expect(late).toBeLessThan(early);
  // Exclude deliberately overlapping rail/pinch supports; every other pair has room to transfer.
  const hazards = obstacles.filter((o) => o.kind !== "platform");
  for (let i = 1; i < hazards.length; i++)
    if (hazards[i].x !== hazards[i - 1].x)
      expect(
        hazards[i].x - hazards[i - 1].x - hazards[i - 1].width,
      ).toBeGreaterThanOrEqual(245 - 1e-6);
});
it("jets pulse, phase gates really open, and visual polygons match legal collisions", () => {
  const jet: Obstacle = {
    x: 100,
    width: 60,
    side: 1,
    depth: 44,
    kind: "jet",
    period: 4,
    phase: 0,
  };
  expect(obstacleBounds(jet, 1).high - obstacleBounds(jet, 1).low).toBeCloseTo(
    44,
  );
  expect(obstacleBounds(jet, 3).high - obstacleBounds(jet, 3).low).toBeCloseTo(
    8.8,
  );
  const gate: Obstacle = { ...jet, side: 0, kind: "phase" };
  expect(obstacleBounds(gate, 1).active).toBe(true);
  expect(obstacleBounds(gate, 3).active).toBe(false);
  for (const age of [1, 3]) {
    const p = { y: 85, vy: 0, gravity: 1 as const, alive: true, cooldown: 0 };
    advanceRunner(p, 130, 1 / 120, [], [gate], age);
    expect(p.alive).toBe(age === 3);
  }
  const icicle: Obstacle = { ...jet, side: -1, kind: "icicle" };
  expect(obstacleOutline(icicle, 0)).toHaveLength(3);
  expect(touchesTrap(icicle, 130, 40, 0)).toBe(true);
  expect(touchesTrap(icicle, 95, 40, 0)).toBe(false); // Empty triangular corner is genuinely safe.
  expect(touchesTrap(jet, 300, 160, 0)).toBe(false);
});
it("100 Impossible routes per map establish legal two-minute paths through all trap families", () => {
  for (const map of Object.keys(TRAPS))
    for (let seed = 0; seed < 100; seed++) {
      const m = new GravityMatch(seed, map),
        ai = new GravityAI("impossible", seed);
      for (let i = 0; i < 14400; i++) {
        if (ai.update(m)) {
          expect(m.flip(1)).toBe(true);
          m.flip(0);
        }
        m.step(1 / 120);
        if (m.between) break;
      }
      expect(m.age, `${map} seed ${seed}`).toBeGreaterThan(119);
      expect(m.players[1].alive, `${map} seed ${seed}`).toBe(true);
    }
}, 120000);
