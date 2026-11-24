import { it, expect } from "vitest";
import {
  DESK,
  pens,
  strike,
  physicsStep,
  stopped,
  touchDistance,
  MAX_SPEED,
  type Pen,
} from "../../src/games/penfight/PenPhysics";
import {
  deskForShots,
  PenMatch,
  powerLimit,
  shotFromPull,
  simulateShot,
} from "../../src/games/penfight/PenRules";
import { planShot, fallbackShot } from "../../src/games/penfight/PenAI";
import { MatchRandom } from "../../src/shared/ai/MatchRandom";
const settle = (m: PenMatch) => {
  for (let i = 0; i < 900 && m.phase === "moving"; i++) m.step(1 / 120);
};

it("only the active pen can flick, invalid shots are rejected, and power is bounded", () => {
  const m = new PenMatch(),
    shot = { angle: -Math.PI / 2, power: 0.4, offset: 0 };
  expect(m.shoot(1, shot)).toBe(false);
  expect(m.shoot(0, { ...shot, power: NaN })).toBe(false);
  expect(m.shoot(0, { ...shot, power: 0 })).toBe(false);
  expect(m.shoot(0, { ...shot, power: Infinity })).toBe(false);
  expect(m.shoot(0, { ...shot, power: 99, offset: 999 })).toBe(true);
  expect(Math.hypot(m.bodies[0].vx, m.bodies[0].vy)).toBeLessThanOrEqual(
    MAX_SPEED,
  );
  expect(Math.abs(m.bodies[0].w)).toBeLessThanOrEqual(14);
  expect(m.shoot(0, shot)).toBe(false);
});
it("friction settles missed shots before the other player's turn", () => {
  const m = new PenMatch();
  m.shoot(0, { angle: 0, power: 0.2, offset: 0 });
  m.step(0.01);
  expect(m.phase).toBe("moving");
  settle(m);
  expect(m.phase).toBe("aim");
  expect(m.turn).toBe(1);
  expect(m.bodies.every(stopped)).toBe(true);
  expect(m.scores).toEqual([0, 0]);
});
it("side hits transfer momentum and tip flicks produce physical spin", () => {
  const pair = pens();
  Object.assign(pair[0], { x: 210, y: 420, a: 0, vy: -400 });
  Object.assign(pair[1], { x: 225, y: 360, a: 0 });
  let impacts = 0;
  for (let i = 0; i < 90; i++) impacts += physicsStep(pair, 1 / 240);
  expect(impacts).toBeGreaterThan(0);
  expect(pair[1].y).toBeLessThan(350);
  const centered = pens()[0],
    tip = { ...centered };
  strike(centered, { angle: -Math.PI / 2, power: 0.5, offset: 0 });
  strike(tip, { angle: -Math.PI / 2, power: 0.5, offset: 25 });
  expect(centered.w).toBeCloseTo(0);
  expect(Math.abs(tip.w)).toBeGreaterThan(4);
});
it("rotated pen hit-testing follows the capsule rather than its bounding square", () => {
  const p = pens()[0];
  p.a = Math.PI / 2;
  expect(touchDistance(p, p.x, p.y + 30)).toBeLessThan(0.001);
  expect(touchDistance(p, p.x + 30, p.y)).toBeCloseTo(30);
});
it("self-outs award the rival, double-outs replay and round starters alternate", () => {
  for (const double of [false, true]) {
    const m = new PenMatch();
    if (double) Object.assign(m.bodies[1], { y: 170 });
    m.shoot(0, { angle: Math.PI / 2, power: 1, offset: 0 });
    settle(m);
    expect(m.roundWinner).toBe(double ? "draw" : 1);
    expect(m.scores).toEqual(double ? [0, 0] : [0, 1]);
    m.step(1.31);
    expect(m.round).toBe(2);
    expect(m.turn).toBe(1);
    expect(m.bodies.every((p) => !p.out)).toBe(true);
  }
});
it("collision knockouts score once and first to three ends the match", () => {
  const m = new PenMatch();
  for (let round = 0; round < 3; round++) {
    m.turn = 0;
    Object.assign(m.bodies[0], { x: 210, y: 250, a: 0 });
    Object.assign(m.bodies[1], { x: 210, y: 190, a: 0 });
    expect(m.shoot(0, { angle: -Math.PI / 2, power: 0.8, offset: 0 })).toBe(
      true,
    );
    settle(m);
    expect(m.scores).toEqual([round + 1, 0]);
    if (round < 2) m.step(1.31);
  }
  expect(m.winner).toBe(1);
  const before = m.snapshot();
  m.step(10);
  m.shoot(0, { angle: 0, power: 1, offset: 0 });
  expect(m.snapshot()).toEqual(before);
});
it("a long no-contact round and repeated drawn rounds have explicit terminal handling", () => {
  const m = new PenMatch();
  for (let i = 0; i < 3; i++) {
    for (let flick = 0; flick < 18; flick++) {
      expect(m.shoot(m.turn, { angle: 0, power: 0.01, offset: 0 })).toBe(true);
      settle(m);
    }
    expect(m.roundWinner).toBe("draw");
    expect(m.roundReason).toBe("even");
    if (i < 2) m.step(1.31);
  }
  expect(m.winner).toBe("draw");
  expect(m.scores).toEqual([0, 0]);
});
it("a hundred seeded physical matches finish with finite state and legal scores", () => {
  for (let seed = 0; seed < 100; seed++) {
    const random = new MatchRandom(seed),
      m = new PenMatch();
    for (let turn = 0; turn < 400 && !m.winner; turn++) {
      if (m.phase === "between") {
        m.step(1.31);
        continue;
      }
      const s = fallbackShot(m.bodies, m.turn);
      m.shoot(m.turn, {
        ...s,
        angle: s.angle + (random.next() - 0.5) * 0.4,
        power: 0.45 + random.next() * 0.55,
        offset: (random.next() - 0.5) * 30,
      });
      settle(m);
      expect(
        m.bodies.every((p) =>
          [p.x, p.y, p.a, p.vx, p.vy, p.w].every(Number.isFinite),
        ),
      ).toBe(true);
    }
    expect(m.winner, `seed ${seed}`).not.toBe(null);
    expect(m.scores.every((s) => s >= 0 && s <= 3)).toBe(true);
  }
}, 30000);
it("all three AI levels return legal physics-simulated shots and leave observations unchanged", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const) {
    const openings = new Set<string>();
    for (let seed = 0; seed < 8; seed++) {
      const bodies = pens(),
        before = JSON.stringify(bodies);
      const result = planShot({ bodies, difficulty, seed });
      expect(JSON.stringify(bodies)).toBe(before);
      expect(result.shot.power).toBeGreaterThan(0);
      expect(result.shot.power).toBeLessThanOrEqual(1);
      expect(Math.abs(result.shot.offset)).toBeLessThanOrEqual(34);
      expect(Number.isFinite(result.shot.angle)).toBe(true);
      expect(result.milliseconds).toBeLessThan(1000);
      const after = simulateShot(bodies, 1, result.shot);
      expect(after[1].out).toBe(false);
      openings.add(JSON.stringify(result.shot));
    }
    expect(openings.size).toBeGreaterThan(2);
  }
}, 30000);
it("high-speed repeated and initially overlapping contacts remain stable", () => {
  for (let seed = 0; seed < 100; seed++) {
    const bodies = pens();
    Object.assign(bodies[0], {
      x: 210,
      y: 380,
      a: seed / 11,
      vx: 500,
      vy: 100,
      w: 10,
    });
    Object.assign(bodies[1], {
      x: 210,
      y: 380,
      a: -seed / 9,
      vx: -500,
      vy: -100,
      w: -10,
    });
    for (let i = 0; i < 700; i++) physicsStep(bodies, 1 / 240);
    expect(
      bodies.every((p) =>
        [p.x, p.y, p.a, p.vx, p.vy, p.w].every(Number.isFinite),
      ),
    ).toBe(true);
    expect(bodies.every(stopped)).toBe(true);
  }
});
it("time resolves the accepted flick, then uses the score lead or a draw", () => {
  const tied = new PenMatch();
  tied.advanceClock(120);
  expect(tied.winner).toBe("draw");
  const leading = new PenMatch();
  leading.scores[1] = 1;
  leading.advanceClock(119.9);
  expect(leading.shoot(0, { angle: Math.PI / 2, power: 1, offset: 0 })).toBe(
    true,
  );
  leading.advanceClock(0.1);
  expect(leading.winner).toBeNull();
  expect(leading.remaining).toBe(0);
  settle(leading);
  expect(leading.scores).toEqual([0, 2]);
  expect(leading.winner).toBe(2);
  expect(leading.shoot(0, { angle: 0, power: 1, offset: 0 })).toBe(false);
});

it("tip impulses trade forward travel for spin without creating free energy", () => {
  const a = pens()[0],
    b = { ...a };
  strike(a, { angle: -Math.PI / 2, power: 1, offset: 0 });
  strike(b, { angle: -Math.PI / 2, power: 1, offset: 30 });
  const energy = (p: Pen) => p.vx * p.vx + p.vy * p.vy + 610 * p.w * p.w;
  expect(energy(b)).toBeCloseTo(energy(a));
  expect(Math.hypot(b.vx, b.vy)).toBeLessThan(Math.hypot(a.vx, a.vy));
  expect(Math.abs(b.w)).toBeGreaterThan(5);
});
it("opening full-power shots cannot knock the opponent straight off the desk", () => {
  for (let i = -12; i <= 12; i++)
    for (const offset of [-34, -17, 0, 17, 34]) {
      const pair = simulateShot(pens(), 0, {
        angle: -Math.PI / 2 + i * 0.025,
        power: 1,
        offset,
      });
      expect(pair[1].out).toBe(false);
    }
});
it("striking different parts of the rival produces different displacement and rotation", () => {
  const impact = (x: number) => {
    const b = pens();
    Object.assign(b[0], { x, y: 390, a: Math.PI / 2 });
    Object.assign(b[1], { x: 210, y: 300, a: 0 });
    return simulateShot(b, 0, {
      angle: -Math.PI / 2,
      power: 0.75,
      offset: 0,
    })[1];
  };
  const centre = impact(210),
    tip = impact(239);
  expect(Math.abs(centre.a)).toBeLessThan(0.01);
  expect(Math.abs(tip.a)).toBeGreaterThan(0.1);
  expect(centre.y).toBeLessThan(tip.y);
});

it("an ordinary opening pull makes contact and both players have the same opening cap", () => {
  const m = new PenMatch();
  const targetY = m.bodies[1].y;
  const shot = shotFromPull(0, -62, 0)!;
  expect(m.shoot(0, shot)).toBe(true);
  settle(m);
  expect(m.impacts).toBeGreaterThan(0);
  expect(m.bodies[1].y).toBeLessThan(targetY - 10);
  expect(m.pressure[0]).toBeGreaterThan(10);
  expect(m.phase).toBe("aim");
  expect(m.turn).toBe(1);
  expect(m.shoot(1, { angle: 0, power: 1, offset: 0 })).toBe(true);
  expect(Math.hypot(m.bodies[1].vx, m.bodies[1].vy)).toBeCloseTo(
    MAX_SPEED * powerLimit(1),
  );
  expect(powerLimit(1)).toBe(powerLimit(0));
  expect(powerLimit(2)).toBe(1);
});

it("closed desk edges take effect after the flick and simulated outcomes use the same boundary", () => {
  const m = new PenMatch();
  const quiet = { angle: 0, power: 0.01, offset: 0 };
  for (let flick = 0; flick < 5; flick++) {
    m.shoot(m.turn, quiet);
    settle(m);
  }
  expect(m.nextShrink?.inFlicks).toBe(1);
  expect(m.desk).toEqual(DESK);
  m.bodies[0].x = DESK.left + 8;
  const predicted = simulateShot(m.bodies, m.turn, quiet, m.shots);
  expect(predicted[0].out).toBe(true);
  expect(m.shoot(m.turn, quiet)).toBe(true);
  expect(m.desk).toEqual(DESK);
  settle(m);
  expect(m.desk).toEqual(deskForShots(6));
  expect(m.roundWinner).toBe(1);
  expect(m.roundReason).toBe("smaller-desk");
  expect(m.bodies.map((pen) => pen.out)).toEqual(
    predicted.map((pen) => pen.out),
  );
  m.step(1.01);
  expect(m.desk).toEqual(DESK);
  expect(m.bodies).toEqual(pens(2));
});

it("a real push wins at the flick limit when both pens are still on the desk", () => {
  const m = new PenMatch();
  m.shoot(0, shotFromPull(0, -62, 0)!);
  settle(m);
  for (let i = 1; i < 18; i++) {
    expect(m.shoot(m.turn, { angle: 0, power: 0.01, offset: 0 })).toBe(true);
    settle(m);
  }
  expect(m.bodies.every((pen) => !pen.out)).toBe(true);
  expect(m.scores).toEqual([1, 0]);
  expect(m.roundReason).toBe("pressure");
  expect(m.pressure[0]).toBeGreaterThan(m.pressure[1]);
});

it("the AI on each difficulty uses the opening cap and makes a useful attack when in reach", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const) {
    for (let completed = 0; completed < 2; completed++) {
      const bodies = pens();
      const plan = planShot({ bodies, difficulty, seed: 47, completed });
      const after = simulateShot(bodies, 1, plan.shot, completed);
      expect(plan.shot.power).toBeLessThanOrEqual(powerLimit(completed));
      expect(after[0].y - bodies[0].y).toBeGreaterThan(10);
      expect(after[1].out).toBe(false);
    }
  }
});
