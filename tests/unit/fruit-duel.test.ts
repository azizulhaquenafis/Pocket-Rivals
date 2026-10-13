import { it, expect } from "vitest";
import { FruitMatch } from "../../src/games/fruit-duel/Rules";
import { FruitAI } from "../../src/games/fruit-duel/AI";
it("Fruit Duel awards correct responses and penalizes wrong or premature taps exactly once", () => {
  const m = new FruitMatch(() => 0);
  m.tap(0);
  m.tap(0);
  m.update(0.02);
  expect(m.scores).toEqual([0, 1]);
  m.update(1);
  m.update(1);
  m.present();
  const matching = m.current === m.target;
  m.tap(0);
  m.update(0.02);
  expect(m.scores).toEqual(matching ? [1, 1] : [0, 2]);
});
it("Fruit Duel guarantees the target appears, replays ties and reaches ten", () => {
  const m = new FruitMatch(() => 0.5);
  for (let round = 0; round < 10; round++) {
    for (let frames = 0; frames < 1000; frames++) {
      m.update(0.02);
      m.present();
      if (m.phase === "active" && m.current === m.target) break;
    }
    expect(m.current).toBe(m.target);
    m.tap(0);
    m.update(0.02);
  }
  expect(m.winner).toBe(1);
  expect(m.scores).toEqual([10, 0]);
  m.tap(1);
  m.update(1);
  expect(m.scores).toEqual([10, 0]);
  const tie = new FruitMatch(() => 0);
  tie.tap(0);
  tie.tap(1);
  tie.update(0.02);
  expect(tie.scores).toEqual([0, 0]);
});
it("Impossible Fruit AI only scores after a displayed match and legal delay", () => {
  const m = new FruitMatch(() => 0.5),
    ai = new FruitAI("impossible", () => 0.5);
  for (let i = 0; i < 3000; i++) {
    m.update(0.01);
    ai.update(m);
    m.present();
    if (m.scores[1]) break;
  }
  expect(m.scores).toEqual([0, 1]);
});
