import { it, expect } from "vitest";
import { ColorWorld } from "../../src/arcade/color-switch/Rules";
it.each(["medium", "hard", "impossible"] as const)(
  "%s: three Color Switch rings admit a timed sequence of legal hops without damage",
  (tier) => {
    let beam = [new ColorWorld(tier)],
      max = 0;
    for (let t = 0; t < 800 && max < 4; t++) {
      const states = new Map<string, ColorWorld>();
      for (const w of beam)
        for (const hop of [false, true]) {
          const c = new ColorWorld(tier);
          Object.assign(c, w);
          if (hop) c.hop();
          for (let i = 0; i < 12; i++) c.step(1 / 120);
          if (c.lives !== 3) continue;
          max = Math.max(max, c.level);
          const key = `${c.level}:${Math.round(c.y / 3)}:${Math.round(c.vy / 25)}`;
          if (!states.has(key)) states.set(key, c);
        }
      beam = [...states.values()]
        .sort(
          (a, b) =>
            b.score * 10 + b.floor - b.y - (a.score * 10 + a.floor - a.y),
        )
        .slice(0, 80);
    }
    expect(max).toBeGreaterThanOrEqual(4);
  },
);
