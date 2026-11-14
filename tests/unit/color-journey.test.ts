import { it, expect } from "vitest";
import {
  ColorWorld,
  COLOR_TIERS,
  SHAPES,
} from "../../src/arcade/color-switch/Rules";
import type { Difficulty } from "../../src/shared/contracts/AIController";

function route(tier: Difficulty, level: number, axes = [0]) {
  const start = new ColorWorld(tier);
  start.level = level;
  start.color = (level - 1) % 4;
  start.x = start.laneX;
  let beam = [start];
  for (let frame = 0; frame < 500; frame++) {
    const states = new Map<string, ColorWorld>();
    for (const w of beam)
      for (const axis of axes)
        for (const hop of [false, true]) {
          const c = Object.assign(new ColorWorld(tier), w);
          if (hop) c.hop();
          for (let i = 0; i < 12; i++) c.step(1 / 120, axis);
          if (c.lives !== 3) continue;
          if (c.level > level) return frame / 10;
          const key = `${Math.round(c.x / 5)}:${Math.round(c.y / 3)}:${Math.round(c.vy / 25)}:${Math.round(c.vx / 70)}`;
          if (!states.has(key)) states.set(key, c);
        }
    beam = [...states.values()]
      .sort((a, b) => a.y - b.y)
      .slice(0, axes.length === 1 ? 100 : 220);
    if (!beam.length) break;
  }
  return null;
}
it.each(["medium", "hard", "impossible"] as const)(
  "%s: every shape has a legal hop-and-steer route",
  (tier) => {
    for (let level = 1; level <= 20; level++) {
      const seconds = route(tier, level) ?? route(tier, level, [-1, 0, 1]);
      console.log(tier, level, SHAPES[(level - 1) % 5], seconds);
      expect(seconds, `${tier} stage ${level}`).not.toBeNull();
    }
  },
  60000,
);
it("tiers differ in speed, steering width, barrier thickness and guidance", () => {
  expect(COLOR_TIERS.medium.rotation).toBeLessThan(COLOR_TIERS.hard.rotation);
  expect(COLOR_TIERS.hard.rotation).toBeLessThan(
    COLOR_TIERS.impossible.rotation,
  );
  expect(COLOR_TIERS.medium.lane).toBeGreaterThan(COLOR_TIERS.hard.lane);
  expect(COLOR_TIERS.hard.lane).toBeGreaterThan(COLOR_TIERS.impossible.lane);
});

it("wave movement stays continuous across a full rotation and every shape uses collidable drawn segments", () => {
  const w = new ColorWorld("impossible");
  w.level = 5;
  w.angle = Math.PI * 2 - 0.001;
  const before = w.segments();
  w.step(1 / 120);
  const after = w.segments();
  expect(w.angle).toBeGreaterThan(Math.PI * 2);
  // Fixed curve samples at x=0 remain continuous, even at an old wrap boundary.
  const near = (segments: ReturnType<ColorWorld["segments"]>) =>
    segments.find((s) => Math.abs(s.x1 - w.laneX) < 0.001)!;
  expect(Math.abs(near(before).y1 - near(after).y1)).toBeLessThan(1);
  for (let level = 2; level <= 5; level++) {
    w.level = level;
    w.angle = 0.3;
    const segments = w.segments();
    expect(new Set(segments.map((s) => s.color)).size).toBe(4);
    for (const s of segments) {
      w.color = (s.color + 1) % 4;
      expect(w.touchesWrongColor((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2)).toBe(
        true,
      );
    }
  }
});
