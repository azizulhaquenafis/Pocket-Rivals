import { it, expect } from "vitest";
import { LumberMatch, branches } from "../../src/games/lumberjack/Rules";
import { LumberAI } from "../../src/games/lumberjack/AI";
it("seeded branches always leave a legal chopping side", () => {
  for (let seed = 0; seed < 100; seed++) {
    const a = branches(seed);
    expect(a).toEqual(branches(seed));
    for (let i = 0; i < a.length - 1; i++)
      expect(
        (a[i] !== -1 && a[i + 1] !== -1) || (a[i] !== 1 && a[i + 1] !== 1),
      ).toBe(true);
  }
});
it("waiting has no penalty; a branch hit immediately awards the rival", () => {
  const m = new LumberMatch(4);
  m.update(1000);
  expect(m.players.every((p) => p.alive)).toBe(true);
  expect(m.chop(0, -1)).toBe(true);
  expect(m.chop(0, -1)).toBeNull();
  m.update(0.1);
  m.pattern[1] = -1;
  expect(m.chop(0, -1)).toBe(false);
  expect(m.winner).toBe(2);
  expect(m.phase).toBe("done");
  expect(m.chop(1, 1)).toBeNull();
  expect(m.totals).toEqual([1, 0]);
});
it("the first player to chop 100 wins without further rounds", () => {
  for (const p of [0, 1] as const) {
    const m = new LumberMatch(4);
    for (let i = 0; i < 100; i++) {
      m.update(0.1);
      expect(m.chop(p, m.safe(p, -1) ? -1 : 1)).toBe(true);
    }
    expect(m.winner).toBe(p + 1);
    expect(m.totals[p]).toBe(100);
    m.update(100);
    expect(m.round).toBe(1);
    expect(m.chop(p, 1)).toBeNull();
  }
});
it("all AI levels finish legally; strongest AI reaches 100 without deliberate errors", () => {
  for (const d of ["medium", "hard", "impossible"] as const)
    for (let seed = 0; seed < 20; seed++) {
      const m = new LumberMatch(seed),
        ai = new LumberAI(d, seed);
      for (let i = 0; i < 10000 && !m.winner; i++) {
        m.update(1 / 60);
        const side = ai.update(1 / 60, m);
        if (side) m.chop(1, side);
      }
      expect(m.winner).not.toBeNull();
      expect(m.players[1].score).toBeLessThanOrEqual(100);
      if (d === "impossible") {
        expect(m.winner).toBe(2);
        expect(m.totals[1]).toBe(100);
      }
    }
});
