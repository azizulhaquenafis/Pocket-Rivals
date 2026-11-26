import { expect, it } from "vitest";
import type { Difficulty } from "../../src/shared/contracts/AIController";
import { LumberAI } from "../../src/games/lumberjack/AI";
import { LumberMatch } from "../../src/games/lumberjack/Rules";

function play(difficulty: Difficulty, seed: number, hz = 120) {
  const match = new LumberMatch(seed),
    ai = new LumberAI(difficulty, seed);
  const actions: { side: number; time: number; ok: boolean }[] = [];
  let mistakes = 0;
  for (let frame = 0; frame < hz * 110 && match.phase === "playing"; frame++) {
    match.update(1 / hz);
    const side = ai.update(1 / hz, match);
    if (side !== null) {
      const ok = match.chop(1, side);
      expect(ok).not.toBeNull();
      if (!ok) mistakes++;
      actions.push({ side, time: match.time, ok: !!ok });
    }
  }
  expect(match.winner).toBe(2);
  expect(match.players[1].score).toBe(100);
  expect(actions.filter((a) => a.ok)).toHaveLength(100);
  expect(ai.update(10, match)).toBeNull();
  for (let i = 1; i < actions.length; i++)
    expect(actions[i].time - actions[i - 1].time).toBeGreaterThanOrEqual(
      (actions[i - 1].ok ? 0.085 : 3) - 1e-6,
    );
  return {
    seed,
    profile: ai.personality.profile,
    difficulty,
    actions,
    mistakes,
    time: match.time,
  };
}

it("100 seeds per tier finish cleanly with human-feeling errors and distinct pacing", () => {
  const samples = (["medium", "hard", "impossible"] as const).map(
    (difficulty) => {
      const runs = Array.from({ length: 100 }, (_, seed) =>
        play(difficulty, seed),
      );
      const times = runs.map((r) => r.time).sort((a, b) => a - b);
      const avgMistakes =
        runs.reduce((sum, r) => sum + r.mistakes, 0) / runs.length;
      const maxMistakes = Math.max(...runs.map((r) => r.mistakes));
      if (difficulty === "impossible") {
        expect(maxMistakes).toBeLessThanOrEqual(1);
        expect(runs.some((r) => r.mistakes === 0)).toBe(true);
        expect(runs.some((r) => r.mistakes === 1)).toBe(true);
      } else if (difficulty === "hard") {
        expect(maxMistakes).toBeLessThanOrEqual(3);
        expect(avgMistakes).toBeGreaterThan(0.8);
      } else {
        expect(maxMistakes).toBeLessThanOrEqual(6);
        expect(avgMistakes).toBeGreaterThan(2.0);
      }
      expect(new Set(runs.map((r) => r.profile)).size).toBeGreaterThanOrEqual(
        20,
      );
      expect(
        new Set(
          runs.map((r) =>
            r.actions
              .slice(0, 10)
              .map((a) => a.side)
              .join(","),
          ),
        ).size,
      ).toBeGreaterThan(8);
      expect(times[99] - times[0]).toBeGreaterThan(1.0);
      console.info(
        `Lumberjack ${difficulty}: 100/100 complete; median ${times[50].toFixed(2)}s (min ${times[0].toFixed(2)} / max ${times[99].toFixed(2)}); avg mistakes ${avgMistakes.toFixed(2)}`,
      );
      return { times, avgMistakes };
    },
  );
  // Distinct, enjoyable difficulty hierarchy: Impossible < Hard < Medium
  expect(samples[2].times[50]).toBeGreaterThan(15);
  expect(samples[2].times[50]).toBeLessThan(24);
  expect(samples[2].times[50]).toBeLessThan(samples[1].times[50] - 6);
  expect(samples[1].times[50]).toBeLessThan(samples[0].times[50] - 8);
  expect(samples[2].avgMistakes).toBeLessThan(samples[1].avgMistakes);
  expect(samples[1].avgMistakes).toBeLessThan(samples[0].avgMistakes);
});

it("replays decisions and cadence exactly from the match seed", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const)
    expect(play(difficulty, 810)).toEqual(play(difficulty, 810));
});

it("keeps completion speed stable at 30, 60 and 120 Hz", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const)
    for (let seed = 0; seed < 10; seed++) {
      const times = [30, 60, 120].map((hz) => play(difficulty, seed, hz).time);
      expect(Math.max(...times) - Math.min(...times)).toBeLessThan(0.5);
    }
});

it("does not plan from branches beyond the seven visible segments", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const) {
    const first = new LumberAI(difficulty, 401),
      second = new LumberAI(difficulty, 401);
    const a = new LumberMatch(401),
      b = new LumberMatch(401);
    b.pattern.fill(1, 7);
    for (let i = 0; i < 120; i++)
      expect(first.update(1 / 120, a)).toBe(second.update(1 / 120, b));
  }
});

it("waits for contact cooldown and rejects invalid time deltas", () => {
  const ai = new LumberAI("impossible", 10),
    match = new LumberMatch(10);
  const initial = ai.snapshot();
  for (const dt of [0, -1, NaN, Infinity])
    expect(ai.update(dt, match)).toBeNull();
  expect(ai.snapshot()).toEqual(initial);
  match.players[1].cooldown = 0.085;
  for (let i = 0; i < 10; i++) expect(ai.update(0.1, match)).toBeNull();
  expect(match.players[1].score).toBe(0);
});
