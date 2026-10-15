import { it, expect } from "vitest";
import { CarMatch } from "../../src/games/car-duel/Rules";
import { CarAI } from "../../src/games/car-duel/AI";
import { head, terrain, integrate } from "../../src/games/car-duel/Physics";
it("idle cars settle stably and retain legal wheel contact", () => {
  const m = new CarMatch();
  for (let i = 0; i < 1200; i++) m.step(1 / 120, [0, 0]);
  for (const c of m.cars) {
    expect(c.alive).toBe(true);
    expect(Math.abs(c.vy)).toBeLessThan(2);
    expect(Math.abs(c.omega)).toBeLessThan(0.1);
    expect(head(c).y + 7).toBeLessThan(terrain(c.x));
  }
});
it("head contact loses the round and simultaneous head impacts replay", () => {
  const m = new CarMatch();
  m.between = 0;
  m.cars[0].angle = Math.PI;
  m.cars[0].y = 250;
  m.step(1 / 120, [0, 0]);
  expect(m.scores).toEqual([0, 1]);
  const tie = new CarMatch();
  tie.between = 0;
  tie.cars.forEach((c) => {
    c.angle = Math.PI;
    c.y = 250;
  });
  tie.step(1 / 120, [0, 0]);
  expect(tie.scores).toEqual([0, 0]);
  expect(tie.between).toBeGreaterThan(0);
});
it("100 seeded duel simulations remain finite with bounded controls and resolve matches", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new CarMatch(),
      a = new CarAI("impossible", seed);
    for (let i = 0; i < 28810 && !m.winner; i++) {
      const control = a.update(1 / 120, m);
      expect(Math.abs(control)).toBeLessThanOrEqual(1);
      m.step(1 / 120, [Math.sin(i / 140) > 0 ? 1 : -1, control]);
      for (const c of m.cars)
        if (!Number.isFinite(c.x + c.y + c.angle + c.vx + c.vy + c.omega))
          throw new Error(`nonfinite seed ${seed}`);
    }
    expect(m.winner).not.toBeNull();
  }
});
