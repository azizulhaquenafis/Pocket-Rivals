import { it, expect } from "vitest";
import { FlappyMatch } from "../../src/future-games/flappy-jump/Rules";
import { FlappyAI } from "../../src/future-games/flappy-jump/AI";
it("only legal descending hoop crossings score once", () => {
  const m = new FlappyMatch(1),
    p = m.players[0];
  p.ball = {
    x: p.hoop.x,
    y: p.hoop.y - 1,
    vx: 0,
    vy: 150,
    age: 0,
    scored: false,
  };
  m.step(1 / 120);
  expect(p.score).toBe(1);
  for (let i = 0; i < 10; i++) m.step(1 / 120);
  expect(p.score).toBe(1);
  p.ball = {
    x: p.hoop.x,
    y: p.hoop.y + 1,
    vx: 0,
    vy: -150,
    age: 0,
    scored: false,
  };
  m.step(1 / 120);
  expect(p.score).toBe(1);
});
it("rim collision reflects only approaching motion and duplicate jumps fail", () => {
  const m = new FlappyMatch(1),
    p = m.players[0];
  expect(m.jump(0)).toBe(true);
  expect(m.jump(0)).toBe(false);
  p.ball = {
    x: p.hoop.x - 21,
    y: p.hoop.y - 10,
    vx: 0,
    vy: 200,
    age: 0,
    scored: false,
  };
  m.step(1 / 120);
  expect(p.ball.vy).toBeLessThan(0);
});
it("100 Impossible seeds complete ten baskets through simulated legal shots", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new FlappyMatch(seed),
      a = new FlappyAI("impossible", seed);
    for (let i = 0; i < 28800 && !m.winner; i++) {
      if (a.update(1 / 120, m)) m.jump(1);
      m.step(1 / 120);
    }
    expect(m.players[1].score, `seed ${seed}`).toBe(10);
    expect(m.winner).toBe(2);
  }
});
