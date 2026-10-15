import { it, expect } from "vitest";
import { BirdsMatch } from "../../src/games/happy-birds/Rules";
import { BirdsAI } from "../../src/games/happy-birds/AI";
it("flaps obey cooldown and geometry kills both birds consistently", () => {
  const m = new BirdsMatch(1);
  for (let i = 0; i < 150; i++) m.step(1 / 120);
  expect(m.flap(0)).toBe(true);
  expect(m.flap(0)).toBe(false);
  expect(m.players[0].vy).toBe(-195);
  m.players.forEach((p) => (p.y = 170));
  m.step(1 / 120);
  expect(m.scores).toEqual([0, 0]);
  expect(m.between).toBeGreaterThan(0);
});
it("100 Impossible seeds fly a full 80-second course using the same legal controls", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new BirdsMatch(seed),
      ai = new BirdsAI("impossible", seed);
    for (let i = 0; i < 80 * 120; i++) {
      if (ai.update(1 / 120, m)) {
        m.flap(1);
        m.flap(0);
      }
      m.step(1 / 120);
    }
    expect(m.round).toBe(1);
    expect(m.players[1].alive).toBe(true);
    expect(m.distance).toBeGreaterThan(10000);
  }
});
