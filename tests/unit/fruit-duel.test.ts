import { it, expect } from "vitest";
import { FruitMatch, isFruit } from "../../src/games/fruit-duel/Rules";
import { FruitAI } from "../../src/games/fruit-duel/AI";
it("empty swings and all three decoys cause cooldown, never points", () => {
  for (const kind of [-1, 7, 8, 9]) {
    const m = new FruitMatch(() => 0);
    m.current = kind;
    if (kind >= 0) m.phase = "active";
    expect(m.tap(0)).toBe(true);
    expect(m.tap(0)).toBe(false);
    m.update(0.02);
    expect(m.scores).toEqual([0, 0]);
    expect(m.canTap(0)).toBe(false);
    expect(m.missed[0]).toBe(true);
    m.update(1.4);
    expect(m.canTap(0)).toBe(true);
  }
});
it("all seven real fruits score once, judgment survives object changes, ties replay", () => {
  for (let kind = 0; kind < 7; kind++) {
    const m = new FruitMatch(() => 0);
    m.current = kind;
    m.phase = "active";
    m.tap(0);
    m.current = 8;
    m.update(0.02);
    expect(m.scores).toEqual([1, 0]);
    expect(m.capturedKind).toBe(kind);
    expect(m.tap(0)).toBe(false);
  }
  const tie = new FruitMatch();
  tie.current = 0;
  tie.phase = "active";
  tie.tap(0);
  tie.tap(1);
  tie.update(0.02);
  expect(tie.scores).toEqual([0, 0]);
  expect(tie.phase).toBe("between");
});
it("real fruit is guaranteed within three reveals and a legal ten-slice match ends", () => {
  const m = new FruitMatch(() => 0.99);
  let reveals = 0;
  for (let i = 0; i < 20000 && !m.winner; i++) {
    m.update(0.02);
    if (m.phase === "show") {
      reveals++;
      if (isFruit(m.current)) {
        expect(reveals).toBeLessThanOrEqual(3);
        reveals = 0;
      }
      m.present();
    }
    if (m.phase === "active" && isFruit(m.current)) m.tap(0);
  }
  expect(m.winner).toBe(1);
  expect(m.scores).toEqual([10, 0]);
  expect(m.tap(1)).toBe(false);
});
it("100 seeds per difficulty keep AI actions legal and Impossible avoids decoys", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const)
    for (let seed = 0; seed < 100; seed++) {
      let n = seed + 1;
      const random = () => {
        n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
        return n / 4294967296;
      };
      const m = new FruitMatch(random),
        ai = new FruitAI(difficulty, seed);
      for (let step = 0; step < 18000 && !m.winner; step++) {
        m.update(1 / 120);
        const before = m.attemptSerial[1];
        ai.update(m);
        if (m.attemptSerial[1] !== before) {
          expect(m.time - m.visibleAt).toBeGreaterThanOrEqual(0.12);
          if (difficulty === "impossible")
            expect(isFruit(m.current)).toBe(true);
        }
        m.present();
      }
      expect(m.winner).toBe(2);
      expect(m.scores[0]).toBe(0);
    }
});

it("sword return is the input cooldown, returns to its original side, and mirrors fairly", async () => {
  const { swordPose, HIT_RECOVERY, MISS_RECOVERY } =
    await import("../../src/games/fruit-duel/SwordMotion");
  for (const valid of [false, true]) {
    const m = new FruitMatch(() => 0);
    m.current = valid ? 0 : 7;
    m.phase = "active";
    m.tap(0);
    const duration = valid ? HIT_RECOVERY : MISS_RECOVERY;
    expect(m.recoveryDuration[0]).toBe(duration);
    const start = swordPose(0, 1, 0, duration),
      end = swordPose(0, 1, duration, duration);
    expect(start.x).toBeGreaterThan(300);
    expect(end).toEqual(start);
    m.update(duration - 0.001);
    expect(m.canTap(0)).toBe(false);
    expect(swordPose(0, 1, duration - 0.001, duration).x).toBeCloseTo(end.x, 2);
    m.update(0.002);
    expect(m.canTap(0)).toBe(true);
    for (let i = 0; i <= 100; i++) {
      const age = (i / 100) * duration,
        a = swordPose(0, 1, age, duration),
        b = swordPose(1, 1, age, duration);
      expect(a.x + b.x).toBeCloseTo(420);
      expect(a.y + b.y).toBeCloseTo(762);
      expect(b.angle - a.angle).toBeCloseTo(Math.PI);
    }
    expect(swordPose(0, 2, 0, duration)).toEqual(end);
    expect(swordPose(0, 2, duration, duration)).toEqual(start);
  }
});

it("each mirrored sweep reaches the fruit and the final sword finishes returning", async () => {
  const { swordPose, SWING_IMPACT, HIT_RECOVERY } =
    await import("../../src/games/fruit-duel/SwordMotion");
  for (const player of [0, 1] as const)
    for (const attempt of [1, 2]) {
      const p = swordPose(player, attempt, SWING_IMPACT, HIT_RECOVERY);
      const x = p.x - 139 * Math.cos(p.angle) + 154 * Math.sin(p.angle),
        y = p.y - 139 * Math.sin(p.angle) - 154 * Math.cos(p.angle);
      expect(Math.hypot(x - 210, y - 381)).toBeLessThan(49);
    }
  const m = new FruitMatch();
  m.scores[0] = 9;
  m.current = 0;
  m.phase = "active";
  m.tap(0);
  m.update(0.02);
  expect(m.winner).toBe(1);
  m.update(HIT_RECOVERY);
  expect(m.time - m.swingStartedAt[0]).toBeGreaterThanOrEqual(HIT_RECOVERY);
  expect(m.tap(0)).toBe(false);
  expect(m.scores).toEqual([10, 0]);
});
