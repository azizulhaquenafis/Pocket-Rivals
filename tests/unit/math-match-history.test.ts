import { it, expect } from "vitest";
import {
  RecentMatches,
  matchQuestions,
  promptKey,
} from "../../src/games/math-quiz/questions/MatchQuestions";
import {
  allUniversityQuestions,
  universityDeck,
} from "../../src/games/math-quiz/questions/Bank";
import { globalQuestionHistory } from "../../src/games/math-quiz/questions/History";
for (const university of [false, true])
  it(`${university ? "university" : "basic"}: no repeats over three matches, including reload and repeated RNG`, () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    const seen = new Set<string>();
    for (let game = 0; game < 3; game++) {
      const next = matchQuestions(
        university,
        () => 0.5,
        new RecentMatches(storage),
      );
      for (let i = 0; i < 60; i++) {
        const q = next();
        expect(seen.has(promptKey(q))).toBe(false);
        seen.add(promptKey(q));
        expect(new Set(q.optionsLatex).size).toBe(3);
      }
    }
  });
it("full-bank exhaustion keeps recent prompts protected", () => {
  const protectedPrompts = new Set(
    allUniversityQuestions.slice(0, 60).map(promptKey),
  );
  for (const q of allUniversityQuestions) globalQuestionHistory.record(q.id);
  const deck = universityDeck(() => 0.5, protectedPrompts);
  expect(deck.length).toBe(allUniversityQuestions.length - 60);
  expect(deck.every((q) => !protectedPrompts.has(promptKey(q)))).toBe(true);
  globalQuestionHistory.clear();
});
it("only the latest two completed matches protect the next match", () => {
  const h = new RecentMatches();
  const q = allUniversityQuestions[0];
  h.begin().record(q);
  expect(h.begin().used.has(promptKey(q))).toBe(true);
  expect(h.begin().used.has(promptKey(q))).toBe(true);
  expect(h.begin().used.has(promptKey(q))).toBe(false);
});
