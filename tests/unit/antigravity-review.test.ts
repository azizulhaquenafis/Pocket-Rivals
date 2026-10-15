import { describe, it, expect } from "vitest";
import { TimerClock } from "../../src/games/perfect-timer/TimerClock";
import { PerfectTimerMatch } from "../../src/games/perfect-timer/PerfectTimerRules";
import { WaterGuessMatch } from "../../src/games/water-guess/WaterGuessRules";
describe("formal review regressions", () => {
  it("excludes repeated pause/background intervals from high-resolution timing", () => {
    const c = new TimerClock();
    c.start(100);
    expect(c.elapsed(123.4)).toBeCloseTo(23.4);
    c.pause(1100);
    c.pause(9000);
    expect(c.elapsed(10000)).toBe(1000);
    c.resume(10100);
    c.resume(10900);
    expect(c.elapsed(11100)).toBe(2000);
    c.pause(11100);
    c.resume(12100);
    expect(c.elapsed(12200)).toBe(2100);
    c.start(20000);
    expect(c.elapsed(20100)).toBe(100);
  });
  it("resolves each timer round exactly once and rejects nonfinite time", () => {
    const m = new PerfectTimerMatch();
    expect(m.nextRound()).toBe(false);
    expect(() => m.recordStop(0, NaN)).toThrow();
    expect(() => m.recordStop(0, Infinity)).toThrow();
    m.recordStop(0, m.target * 10);
    m.recordStop(1, m.target * 10 + 100);
    const result = m.resolveRound();
    expect(m.resolveRound()).toBe(result);
    expect(m.scores).toEqual([1, 0]);
    expect(m.history).toHaveLength(1);
    expect(m.nextRound()).toBe(true);
  });
  it("resolves each water round exactly once and rejects invalid guesses", () => {
    const m = new WaterGuessMatch();
    expect(m.nextRound()).toBe(false);
    expect(m.submit(0, NaN)).toBe(false);
    expect(m.submit(0, Infinity)).toBe(false);
    m.submit(0, m.actual);
    m.submit(1, 0);
    const result = m.resolveRound();
    expect(m.resolveRound()).toBe(result);
    expect(m.history).toHaveLength(1);
    expect(m.scores).toEqual([1, 0]);
  });
});
import { PerfectTimerAI } from "../../src/games/perfect-timer/PerfectTimerAI";
import { WaterGuessAI } from "../../src/games/water-guess/WaterGuessAI";
it("100 seeds replay diverse targets and increasingly accurate AI without forced Impossible errors", () => {
  const openings = new Set<number>(),
    means: number[] = [];
  for (const difficulty of ["medium", "hard", "impossible"] as const) {
    let error = 0;
    for (let seed = 0; seed < 100; seed++) {
      const a = new WaterGuessAI(difficulty, seed),
        b = new WaterGuessAI(difficulty, seed);
      const guess = a.estimate(5731);
      expect(b.estimate(5731)).toBe(guess);
      error += Math.abs(guess - 5731);
      expect(guess).toBeGreaterThanOrEqual(0);
      expect(guess).toBeLessThanOrEqual(10000);
      const timer = new PerfectTimerAI(difficulty, seed);
      const m = new PerfectTimerMatch(timer.personality.next);
      openings.add(m.target);
      timer.scheduleRound(m.target, 0);
      if (difficulty === "impossible") {
        expect(timer.shouldStop(m.target * 10 - 1)).toBe(false);
        expect(timer.shouldStop(m.target * 10)).toBe(true);
      }
    }
    means.push(error / 100);
  }
  expect(openings.size).toBe(5);
  expect(means[0]).toBeGreaterThan(means[1] * 2);
  expect(means[1]).toBeGreaterThan(means[2] * 2);
});
