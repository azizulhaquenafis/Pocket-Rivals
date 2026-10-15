import { it, expect } from "vitest";
import { ArcheryMatch } from "../../src/games/archery-duel/Rules";
import { ArcheryAI } from "../../src/games/archery-duel/AI";
it("debounces stages and scores only real circle hits once", () => {
  const m = new ArcheryMatch(1);
  expect(m.tap(0)).toBe(true);
  expect(m.tap(0)).toBe(false);
  m.step(0.13);
  m.tap(0);
  m.step(0.13);
  const p = m.players[0];
  p.x = p.targets[1].x;
  p.y = p.targets[1].y;
  m.tap(0);
  for (let i = 0; i < 60; i++) m.step(1 / 120);
  expect(p.score).toBe(2);
  for (let i = 0; i < 120; i++) m.step(1 / 120);
  expect(p.score).toBe(2);
  expect(p.stage).toBe("ready");
});
it("100 Impossible matches finish through legal timed taps with seed-varying targets", () => {
  const positions = new Set();
  for (let seed = 0; seed < 100; seed++) {
    const m = new ArcheryMatch(seed),
      a = new ArcheryAI("impossible", seed);
    positions.add(m.players[1].targets[1].x);
    expect(m.players[0].targets).toEqual(m.players[1].targets);
    for (let i = 0; i < 21600 && !m.winner; i++) {
      if (a.update(m)) m.tap(1);
      m.step(1 / 120);
    }
    expect(m.winner).toBe(2);
    expect(m.players[1].score).toBeGreaterThanOrEqual(10);
  }
  expect(positions.size).toBe(100);
});
