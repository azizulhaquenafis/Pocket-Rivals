import { it, expect } from "vitest";
import { FixedStep } from "../../src/shared/physics/FixedStep";
import { ChickenMatch } from "../../src/future-games/chicken-jump/Rules";
import { ChickenAI } from "../../src/future-games/chicken-jump/AI";
import { ArcheryMatch } from "../../src/future-games/archery-duel/Rules";
import { ArcheryAI } from "../../src/future-games/archery-duel/AI";
import { GravityMatch } from "../../src/games/gravity-runner/Rules";
import { GravityAI } from "../../src/games/gravity-runner/AI";
import { BirdsMatch } from "../../src/games/happy-birds/Rules";
import { BirdsAI } from "../../src/games/happy-birds/AI";
import { SpikeMatch } from "../../src/games/spike-attacks/Rules";
import { SpikeAI } from "../../src/games/spike-attacks/AI";
import { FlappyMatch } from "../../src/future-games/flappy-jump/Rules";
import { FlappyAI } from "../../src/future-games/flappy-jump/AI";
import { CarMatch } from "../../src/future-games/car-duel/Rules";
import { CarAI } from "../../src/future-games/car-duel/AI";
it("all seven seeded simulations produce identical outcomes at 30, 60 and 120 render FPS", () => {
  const outcomes = [30, 60, 120].map((fps) => {
    const c = new ChickenMatch(18),
      ca = new ChickenAI("hard", 18),
      a = new ArcheryMatch(18),
      aa = new ArcheryAI("hard", 18),
      g = new GravityMatch(18),
      ga = new GravityAI("hard", 18),
      b = new BirdsMatch(18),
      ba = new BirdsAI("hard", 18),
      s = new SpikeMatch(18),
      sa = new SpikeAI("hard", 18),
      f = new FlappyMatch(18),
      fa = new FlappyAI("hard", 18),
      v = new CarMatch(),
      va = new CarAI("hard", 18),
      fixed = new FixedStep();
    for (let i = 0; i < fps * 20; i++)
      fixed.advance(1 / fps, (h) => {
        if (ca.update(h, c)) c.stop(1);
        c.step(h);
        if (aa.update(a)) a.tap(1);
        a.step(h);
        if (ga.update(g, h)) g.flip(1);
        g.step(h);
        if (ba.update(h, b)) b.flap(1);
        b.step(h);
        sa.update(h, s);
        s.step(h);
        if (fa.update(h, f)) f.jump(1);
        f.step(h);
        v.step(h, [1, va.update(h, v)]);
      });
    return JSON.stringify([
      c.players,
      a.players,
      g.players,
      g.scores,
      b.players,
      b.scores,
      s.players,
      s.scores,
      f.players,
      v.cars,
      v.scores,
    ]);
  });
  expect(outcomes[0]).toBe(outcomes[1]);
  expect(outcomes[1]).toBe(outcomes[2]);
});
