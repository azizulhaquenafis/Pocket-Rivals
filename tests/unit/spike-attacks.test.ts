import { it, expect } from "vitest";
import {
  SpikeMatch,
  contact,
  STONES,
} from "../../src/games/spike-attacks/Rules";
import { SpikeAI } from "../../src/games/spike-attacks/AI";
it("swept collisions hit stones before protected players, even at high speed", () => {
  expect(contact(0, 85, 300, 0, 85, 85, 20)).toBeCloseTo(65 / 300);
  const m = new SpikeMatch(1);
  m.warning = 0;
  m.players[0].x = 117;
  m.players[0].y = 85;
  m.players[0].tx = 117;
  m.players[0].ty = 85;
  m.players[0].shots = [{ x: 0, y: 85, vx: 30000, vy: 0 }];
  m.step(1 / 120);
  expect(m.players[0].alive).toBe(true);
  expect(m.players[0].shots).toHaveLength(0);
});
it("movement is bounded and cannot enter stones", () => {
  const m = new SpikeMatch(1);
  m.target(0, 85, 85);
  for (let i = 0; i < 120; i++) m.step(1 / 120);
  const p = m.players[0];
  for (const s of STONES)
    expect(Math.hypot(p.x - s.x, p.y - s.y)).toBeGreaterThanOrEqual(
      s.r + 9 - 1e-6,
    );
});
it("100 seeded AI cover choices survive all four incoming directions", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new SpikeMatch(seed),
      a = new SpikeAI("impossible", seed);
    for (let i = 0; i < 120 * 60 && !m.winner; i++) {
      a.update(1 / 120, m);
      m.players[0].tx = m.players[1].tx;
      m.players[0].ty = m.players[1].ty;
      m.step(1 / 120);
      expect(m.players[1].alive, `seed ${seed}, wave ${m.wave}`).toBe(true);
    }
    expect(m.wave).toBeGreaterThan(8);
  }
});
