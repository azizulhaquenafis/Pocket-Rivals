import { it, expect } from "vitest";
import { ChickenMatch } from "../../src/games/chicken-jump/Rules";
import { ChickenAI } from "../../src/games/chicken-jump/AI";
it("geometric landings stack ten; misses cannot score; duplicate stops rejected", () => {
  const m = new ChickenMatch(3);
  m.players[0].block = 100;
  expect(m.stop(0)).toBe(true);
  expect(m.stop(0)).toBe(false);
  for (let i = 0; i < 100; i++) m.step(1 / 120);
  expect(m.players[0].score).toBe(1);
  m.players[0].block = 175;
  m.stop(0);
  for (let i = 0; i < 180; i++) m.step(1 / 120);
  expect(m.players[0].score).toBe(1);
});
it("100 seeded Impossible opponents legally complete and freeze after the result", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new ChickenMatch(seed),
      ai = new ChickenAI("impossible", seed);
    for (let i = 0; i < 180 * 120 && !m.winner; i++) {
      if (ai.update(1 / 120, m)) m.stop(1);
      m.step(1 / 120);
    }
    expect(m.winner).toBe(2);
    expect(m.players[1].score).toBe(10);
    const s = JSON.stringify(m.players);
    m.step(1);
    expect(m.stop(0)).toBe(false);
    expect(JSON.stringify(m.players)).toBe(s);
  }
});
it("Medium retries vary their alignment rather than repeating an impossible offset forever", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new ChickenMatch(seed),
      a = new ChickenAI("medium", seed);
    for (let i = 0; i < 21600 && !m.winner; i++) {
      if (a.update(1 / 120, m)) m.stop(1);
      m.step(1 / 120);
    }
    expect(m.players[1].score).toBe(10);
  }
});
