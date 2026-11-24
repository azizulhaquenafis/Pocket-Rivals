import { it, expect } from "vitest";
import { ColorWorld, START_Y } from "../../src/arcade/color-switch/Rules";

it.each(["medium", "hard", "impossible"] as const)(
  "%s: one hop rises, peaks, falls and settles at the starting pad",
  (tier) => {
    const w = new ColorWorld(tier);
    const step = (ticks: number) => {
      for (let i = 0; i < ticks; i++) w.step(1 / 120);
    };
    step(120);
    expect(w.y).toBe(START_Y);
    w.hop();
    step(24);
    expect(w.y).toBeLessThan(START_Y - 30);
    expect(w.vy).toBeLessThan(0);
    step(24);
    expect(w.vy).toBeGreaterThan(0);
    const falling = w.y;
    step(14);
    expect(w.y).toBeGreaterThan(falling);
    w.hop();
    step(24);
    expect(w.y).toBeLessThan(falling);
    step(120);
    expect(w.y).toBe(START_Y);
    expect(w.lives).toBe(3);
  },
);
