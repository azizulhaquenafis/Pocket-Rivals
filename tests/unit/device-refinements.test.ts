import { it, expect, vi, afterEach } from "vitest";
import katex from "katex";
import { oppositeSideLayout } from "../../src/shared/utilities/DeviceLayout";
import { selectMap, MAPS } from "../../src/games/spike-attacks/Maps";
import { basicQuestion } from "../../src/games/math-quiz/questions/Basic";
import { LumberMatch } from "../../src/games/lumberjack/Rules";
afterEach(() => vi.unstubAllGlobals());
it("desktop and hybrid mouse devices stay upright; touch-primary phones/tablets face opponents", () => {
  for (const [coarse, hover, expected] of [
    [false, true, false],
    [true, true, false],
    [true, false, true],
    [false, false, false],
  ]) {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("coarse") ? coarse : hover,
    }));
    expect(oppositeSideLayout()).toBe(expected);
  }
});
it("automatic maps have equal seeded coverage", () => {
  const counts = Object.fromEntries(MAPS.map((m) => [m.id, 0]));
  for (let seed = 0; seed < 3000; seed++)
    counts[selectMap("random", seed).id]++;
  expect(Object.values(counts)).toEqual([1000, 1000, 1000]);
});
it("a next-segment head strike animates that branch without awarding a chop", () => {
  const m = new LumberMatch(4);
  m.pattern[0] = 0;
  m.pattern[1] = -1;
  expect(m.chop(0, -1)).toBe(false);
  expect(m.players[0]).toMatchObject({ alive: false, hitNext: true, score: 0 });
  expect(m.winner).toBe(2);
  const n = new LumberMatch(4);
  n.pattern[0] = -1;
  expect(n.chop(0, -1)).toBe(false);
  expect(n.players[0].hitNext).toBe(false);
});
it("four additional basic families have correct answers and valid distinct options", () => {
  for (let cat = 7; cat <= 10; cat++)
    for (let seed = 0; seed < 100; seed++) {
      let n = 0,
        s = seed;
      const random = () =>
        n++ === 0
          ? (cat + 0.1) / 11
          : (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32;
      const q = basicQuestion(seed, random);
      const [, family, sa, sb, sk] = q.id.split("-"),
        a = +sa,
        b = +sb,
        k = +sk;
      const expected: Record<string, number> = {
        equation: b,
        power: a * a - b,
        ratio: a * k,
        average: (a + (a + b) + (a + 2 * b)) / 3,
      };
      expect(Number(q.optionsLatex[q.correctIndex])).toBe(expected[family]);
      expect(new Set(q.optionsLatex).size).toBe(3);
      for (const text of [
        q.questionLatex,
        q.explanationLatex,
        ...q.optionsLatex,
      ])
        expect(() =>
          katex.renderToString(text, { strict: "error", throwOnError: true }),
        ).not.toThrow();
    }
});
