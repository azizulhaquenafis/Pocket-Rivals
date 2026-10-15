import { it, expect } from "vitest";
import { GravityMatch } from "../../src/games/gravity-runner/Rules";
import { GravityAI } from "../../src/games/gravity-runner/AI";
it("shared gaps have sufficient transit clearance and simultaneous falls replay", () => {
  const m = new GravityMatch(1);
  for (let i = 1; i < m.gaps.length; i++)
    expect(
      m.gaps[i].x - (m.gaps[i - 1].x + m.gaps[i - 1].width),
    ).toBeGreaterThan(240);
  m.players.forEach((p) => {
    p.y = 193;
  });
  m.gaps = [{ x: 0, width: 1000, side: 1 }];
  m.step(1 / 120);
  expect(m.scores).toEqual([0, 0]);
  expect(m.between).toBeGreaterThan(0);
});
it("100 seeded predictive opponents survive legal routes and beat idle humans", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new GravityMatch(seed),
      ai = new GravityAI("impossible", seed);
    for (let i = 0; i < 36000 && !m.winner; i++) {
      if (ai.update(m)) m.flip(1);
      m.step(1 / 120);
    }
    expect(m.winner).toBe(2);
    expect(m.scores[1]).toBe(5);
  }
});
it("predictive Hard and Impossible can legally traverse 80-second generated courses", () => {
  for (const d of ["hard", "impossible"] as const)
    for (let seed = 0; seed < 100; seed++) {
      const m = new GravityMatch(seed),
        a = new GravityAI(d, seed);
      for (let i = 0; i < 9600; i++) {
        if (a.update(m)) {
          m.flip(1);
          m.flip(0);
        }
        m.step(1 / 120);
      }
      expect(m.round).toBe(1);
      expect(m.players[1].alive).toBe(true);
    }
});
