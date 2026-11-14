import { describe, expect, it } from "vitest";
import { QuizAI } from "../../src/games/math-quiz/AI";
import { QuizMatch } from "../../src/games/math-quiz/Rules";
import type { MathQuestion } from "../../src/games/math-quiz/questions/Question";
import type { Difficulty } from "../../src/shared/contracts/AIController";

const question = (estimatedSeconds = 40): MathQuestion => ({
  id: "reusable-key",
  topic: "Algebra",
  difficulty: "hard",
  questionLatex: "2+3",
  optionsLatex: ["4", "5", "6"],
  correctIndex: 1,
  explanationLatex: "2+3=5",
  estimatedSeconds,
});

function play(difficulty: Difficulty, seed: number) {
  let serial = 0;
  // Reusing an ID is intentional: a tie/rematch must still receive a response.
  const m = new QuizMatch(() => question([5, 12, 40][serial++ % 3]));
  const ai = new QuizAI(difficulty, seed);
  const actions: { round: number; delay: number; correct: boolean }[] = [];
  let previous = 0;
  for (let frame = 0; frame < 30000 && !m.winner; frame++) {
    m.present();
    ai.update(m);
    m.update(1 / 60);
    if (m.round !== previous) {
      actions.push({
        round: m.round,
        delay: ai.snapshot().delay,
        correct: m.message === "CORRECT!",
      });
      previous = m.round;
    }
  }
  return {
    actions,
    scores: [...m.scores],
    winner: m.winner,
    time: m.time,
    identity: ai.snapshot(),
  };
}

it("only answers presented questions, once, and never acts after completion", () => {
  const m = new QuizMatch(() => question());
  const ai = new QuizAI("impossible", 14);
  m.update(30);
  ai.update(m);
  expect(ai.snapshot().tapped).toBe(false);
  m.present();
  for (let n = 0; n < 69; n++) {
    ai.update(m);
    m.update(0.01);
  }
  expect(m.scores).toEqual([0, 0]);
  for (let n = 0; n < 70; n++) {
    ai.update(m);
    m.update(0.01);
  }
  expect(m.scores).toEqual([0, 1]);
  for (let n = 0; n < 50; n++) ai.update(m);
  expect(m.scores).toEqual([0, 1]);
  m.phase = "done";
  const state = ai.snapshot();
  m.update(100);
  ai.update(m);
  expect(ai.snapshot()).toEqual(state);
});

it("foreground-time pause does not consume an AI response or change its decision", () => {
  const m = new QuizMatch(() => question());
  const ai = new QuizAI("impossible", 22);
  m.present();
  ai.update(m);
  const before = ai.snapshot();
  // No Match.update while host is paused; even accidental duplicate AI polls
  // must not advance the response clock or consume new randomness.
  for (let n = 0; n < 10000; n++) ai.update(m);
  expect(ai.snapshot()).toEqual(before);
  expect(m.scores).toEqual([0, 0]);
});

it("same-frame human answer still ties a legal Impossible answer", () => {
  const m = new QuizMatch(() => question());
  const ai = new QuizAI("impossible", 3);
  m.present();
  ai.update(m);
  m.update(ai.snapshot().delay);
  m.answer(0, m.question.correctIndex);
  ai.update(m);
  m.update(0.02);
  expect(m.scores).toEqual([0, 0]);
  expect(m.message).toContain("SAME INSTANT");
  m.update(2);
  m.present();
  ai.update(m);
  m.update(ai.snapshot().delay + 0.01);
  ai.update(m);
  m.update(0.02);
  expect(m.scores).toEqual([0, 1]);
});

const records: Record<string, ReturnType<typeof play>[]> = {};
for (const difficulty of ["medium", "hard", "impossible"] as const) {
  describe(difficulty, () => {
    it("completes 100 reproducible seeded matches with legal, varied decisions", () => {
      const runs = Array.from({ length: 100 }, (_, seed) =>
        play(difficulty, seed),
      );
      records[difficulty] = runs;
      expect(runs.every((r) => r.winner !== null)).toBe(true);
      expect(
        runs.every((r) => r.actions.length >= 10 && r.actions.length <= 19),
      ).toBe(true);
      expect(new Set(runs.map((r) => r.identity.profile)).size).toBeGreaterThan(
        15,
      );
      expect(
        new Set(runs.map((r) => JSON.stringify(r.actions))).size,
      ).toBeGreaterThan(90);
      expect(play(difficulty, 42)).toEqual(runs[42]);
      if (difficulty === "impossible") {
        expect(runs.every((r) => r.scores[0] === 0 && r.scores[1] === 10)).toBe(
          true,
        );
        expect(
          runs.every((r) =>
            r.actions.every((a) => a.delay >= 0.7 && a.delay <= 1.25),
          ),
        ).toBe(true);
      }
    });
  });
}

it("difficulty has distinctly faster timing and higher accuracy across the same seeds", () => {
  const summarize = (difficulty: Difficulty) => {
    const actions = records[difficulty].flatMap((r) => r.actions);
    return {
      delay: actions.reduce((sum, a) => sum + a.delay, 0) / actions.length,
      accuracy: actions.filter((a) => a.correct).length / actions.length,
    };
  };
  const medium = summarize("medium"),
    hard = summarize("hard"),
    impossible = summarize("impossible");
  expect(medium.accuracy).toBeGreaterThan(0.65);
  expect(medium.accuracy).toBeLessThan(0.83);
  expect(hard.accuracy).toBeGreaterThan(0.9);
  expect(hard.accuracy).toBeLessThan(0.99);
  expect(impossible.accuracy).toBe(1);
  expect(medium.delay).toBeGreaterThan(hard.delay * 1.5);
  expect(hard.delay).toBeGreaterThan(impossible.delay * 1.5);
  console.info("Math AI: 100 seeded complete matches per tier", {
    medium,
    hard,
    impossible,
  });
});
