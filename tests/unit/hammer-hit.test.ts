import { it, expect } from "vitest";
import { HammerMatch, strikeScore } from "../../src/games/hammer-hit/Rules";
import { HammerAI } from "../../src/games/hammer-hit/AI";
it("Hammer compares arithmetic means using exact integer totals", () => {
  const m = new HammerMatch();
  m.scores = [
    [80, 60, 100],
    [75, 90, 90],
  ];
  expect(m.averages).toEqual([80, 85]);
  expect(m.winner).toBe(2);
  m.scores = [
    [100, 100, 0],
    [67, 67, 67],
  ];
  expect(m.winner).toBe(2);
  m.scores = [
    [100, 50, 50],
    [0, 100, 100],
  ];
  expect(m.winner).toBe("draw");
});
it("Hammer allows exactly three legal strikes and rejects duplicate taps", () => {
  const m = new HammerMatch();
  expect(m.hit(0)).toBeNull();
  for (let i = 0; i < 3; i++) {
    m.update(1.2);
    expect(m.hit(0)).not.toBeNull();
    expect(m.hit(0)).toBeNull();
  }
  m.update(2);
  expect(m.hit(0)).toBeNull();
  expect(m.scores[0]).toHaveLength(3);
  expect(m.done).toBe(false);
  expect(strikeScore(0)).toBe(100);
  expect(strikeScore(1)).toBe(0);
});
it("Hammer AI completes every difficulty at different frame rates using real timing", () => {
  for (const fps of [30, 60, 120])
    for (const difficulty of ["medium", "hard", "impossible"] as const) {
      const m = new HammerMatch(),
        ai = new HammerAI(difficulty, () => 0.5);
      for (let i = 0; i < fps * 15; i++) {
        m.update(1 / fps);
        if (ai.update(m)) m.hit(1);
      }
      expect(m.scores[1]).toHaveLength(3);
      expect(m.scores[1].every((s) => s >= 50 && s <= 100)).toBe(true);
      if (difficulty === "impossible") expect(m.totals[1]).toBeGreaterThan(270);
    }
});
