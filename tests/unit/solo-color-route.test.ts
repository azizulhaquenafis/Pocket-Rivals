import { it, expect } from "vitest";
import { ColorWorld } from "../../src/arcade/color-switch/Rules";
function cross(start: ColorWorld, axes: number[]) {
  let beam = [start];
  for (let t = 0; t < 800; t++) {
    const states = new Map<string, ColorWorld>();
    for (const w of beam)
      for (const axis of axes)
        for (const hop of [false, true]) {
          const c = Object.assign(new ColorWorld(start.difficulty), w);
          if (hop) c.hop();
          for (let i = 0; i < 12; i++) c.step(1 / 120, axis);
          if (c.lives !== 3) continue;
          if (c.level > start.level) return c;
          const key = `${Math.round(c.x / 5)}:${Math.round(c.y / 3)}:${Math.round(c.vy / 25)}:${Math.round(c.vx / 70)}`;
          if (!states.has(key)) states.set(key, c);
        }
    // Retain safe waiting options instead of pruning every state below the lead.
    const waiting = [...states.values()]
      .filter((w) => w.y === w.floor && w.vy === 0)
      .slice(0, 3);
    beam = [
      ...waiting,
      ...[...states.values()]
        .sort((a, b) => a.y - b.y)
        .slice(0, axes.length === 1 ? 100 : 220),
    ];
    if (!beam.length) break;
  }
  return null;
}
it.each(["medium", "hard", "impossible"] as const)(
  "%s: three consecutive shapes admit legal hops/steering with no damage or state shortcuts",
  (tier) => {
    let w = new ColorWorld(tier);
    for (let level = 1; level <= 3; level++) {
      const next = cross(w, [0]) ?? cross(w, [-1, 0, 1]);
      expect(next, `${tier} stage ${level}`).not.toBeNull();
      w = next!;
      while (w.transition > 0) w.step(1 / 120);
      expect(w.lives).toBe(3);
    }
    expect(w.level).toBe(4);
    expect(w.score).toBe(300);
  },
  60000,
);
