import { it, expect } from "vitest";
import katex from "katex";
import { extendedUniversity } from "../../src/games/math-quiz/questions/ExtendedUniversity";
import {
  allUniversityQuestions,
  universityDeck,
} from "../../src/games/math-quiz/questions/Bank";
import { globalQuestionHistory as history } from "../../src/games/math-quiz/questions/History";
function numeric(s: string) {
  const f = s.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/);
  return f ? ((f[1] ? -1 : 1) * Number(f[2])) / Number(f[3]) : Number(s);
}
it("all 4,608 new questions have independently checked exact answers, distinct options and valid LaTeX", () => {
  const questions = extendedUniversity();
  expect(questions).toHaveLength(4608);
  for (const q of questions) {
    const [, family, sa, sb] = q.id.split("-"),
      a = Number(sa),
      b = Number(sb);
    const expected: Record<string, number> = {
      series: Array.from({ length: a }, (_, k) => b * (k + 1) + a).reduce(
        (x, y) => x + y,
        0,
      ),
      log: b + 0.5,
      vector: a * b + b * (a + 1),
      mod: a * a - b * Math.floor((a * a) / b),
      limit: (a * a) / 2 + b,
      derivative: 2 * b - a * a,
      integral: 1 + b / 2,
      trig: Math.cos(2 * Math.atan(a / b)),
      roots: a * a - 2 * b,
      matrix: a * (a + 1) - b * b,
      complex: a * a - b * b,
      probability: (a / (a + b)) * ((a - 1) / (a + b - 1)),
    };
    const options = q.optionsLatex.map(numeric);
    expect(options[q.correctIndex], q.id).toBeCloseTo(expected[family], 10);
    expect(new Set(options).size).toBe(3);
    expect(options.every(Number.isFinite)).toBe(true);
    for (const latex of [
      q.questionLatex,
      ...q.optionsLatex,
      q.explanationLatex,
    ])
      expect(
        () =>
          katex.renderToString(latex, {
            throwOnError: true,
            strict: "error",
            trust: false,
          }),
        q.id,
      ).not.toThrow();
  }
});
it("seen topics do not repeat while any unseen question remains; only full exhaustion starts a new cycle", () => {
  history.clear();
  const seen = allUniversityQuestions.filter((q) => q.topic === "Limits");
  seen.forEach((q) => history.record(q.id));
  const deck = universityDeck(() => 0.42);
  expect(deck.every((q) => q.topic !== "Limits")).toBe(true);
  expect(deck.length).toBe(allUniversityQuestions.length - seen.length);
  deck.forEach((q) => history.record(q.id));
  expect(universityDeck(() => 0.42)).toHaveLength(
    allUniversityQuestions.length,
  );
  expect(history.size()).toBe(0);
  expect(
    new Set(
      allUniversityQuestions.map((q) => q.questionLatex.replace(/\s+/g, "")),
    ).size,
  ).toBe(allUniversityQuestions.length);
  history.clear();
});
