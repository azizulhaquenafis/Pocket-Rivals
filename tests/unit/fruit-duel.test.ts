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
    m.update(2.2);
    expect(m.canTap(0)).toBe(false);
    m.update(0.25);
    expect(m.canTap(0)).toBe(true);
  }
});
it("pauses on an empty board between consecutive unsliced objects", () => {
  const m = new FruitMatch(() => 0.99);
  for (let i = 0; i < 60 && m.phase !== "show"; i++) m.update(0.05);
  expect(m.phase).toBe("show");
  m.present();
  expect(m.phase).toBe("active");
  m.update(1.5);
  expect(m.phase).toBe("preview");
  expect(m.current).toBe(-1);
  m.update(0.4);
  expect(m.phase).toBe("preview");
  m.update(0.8);
  expect(m.phase).toBe("show");
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

it("reacting slightly late to a rival fruit slice uses normal swing recovery instead of a 2.4s stun", async () => {
  const { HIT_RECOVERY, MISS_RECOVERY, swordPose } =
    await import("../../src/games/fruit-duel/SwordMotion");
  const m = new FruitMatch(() => 0);
  m.current = 2; // Watermelon
  m.phase = "active";
  expect(m.tap(0)).toBe(true);
  m.update(0.02); // P1 captures fruit; phase becomes "between"
  expect(m.phase).toBe("between");
  expect(m.capturedBy).toBe(0);
  // P2 reacts 40ms later while the fruit hasn't even visually finished slicing
  m.update(0.04);
  expect(m.tap(1)).toBe(true);
  expect(m.missed[1]).toBe(false);
  expect(m.hitDecoy[1]).toBe(false);
  expect(m.recoveryDuration[1]).toBe(HIT_RECOVERY);

  // Hitting an actual decoy still incurs MISS_RECOVERY and flags hitDecoy for recoil
  const d = new FruitMatch(() => 0);
  d.current = 8; // Medal decoy
  d.phase = "active";
  expect(d.tap(0)).toBe(true);
  expect(d.missed[0]).toBe(true);
  expect(d.hitDecoy[0]).toBe(true);
  expect(d.recoveryDuration[0]).toBe(MISS_RECOVERY);
  // Decoy recoil pose still mirrors fairly and returns cleanly to rest
  const r0 = swordPose(0, 1, 0.25, MISS_RECOVERY, true);
  const r1 = swordPose(1, 1, 0.25, MISS_RECOVERY, true);
  expect(r0.x + r1.x).toBeCloseTo(420);
  expect(r0.y + r1.y).toBeCloseTo(762);
  expect(swordPose(0, 1, MISS_RECOVERY, MISS_RECOVERY, true)).toEqual(
    swordPose(0, 1, 0, MISS_RECOVERY, true),
  );
});

it("intense 2P / Impossible cadence lowers real-fruit frequency while still guaranteeing a fruit within 3 reveals", () => {
  const sampleRatio = (config?: {
    fruitChance?: number;
    activeMin?: number;
    activeSpan?: number;
  }) => {
    let n = 1337;
    const rng = () => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return n / 4294967296;
    };
    const m = new FruitMatch(rng, config);
    let fruits = 0,
      decoys = 0,
      streak = 0,
      maxStreak = 0;
    for (let i = 0; i < 40000 && fruits + decoys < 120; i++) {
      m.update(0.05);
      if (m.phase === "show") {
        if (isFruit(m.current)) {
          fruits++;
          streak = 0;
        } else {
          decoys++;
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        }
        m.present();
      }
    }
    return { fruits, decoys, maxStreak };
  };
  const normal = sampleRatio();
  const intense = sampleRatio({
    fruitChance: 0.28,
    activeMin: 0.72,
    activeSpan: 0.28,
  });
  expect(intense.maxStreak).toBeLessThanOrEqual(2);
  expect(intense.fruits).toBeLessThan(normal.fruits);
  expect(intense.decoys).toBeGreaterThan(normal.decoys);
});
