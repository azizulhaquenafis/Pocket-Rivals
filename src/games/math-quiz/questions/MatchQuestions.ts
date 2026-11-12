import { basicQuestion } from "./Basic";
import { universityDeck } from "./Bank";
import { globalQuestionHistory } from "./History";
import type { MathQuestion } from "./Question";

const KEY = "pocket-rivals.math-matches.v1";
export const promptKey = (q: MathQuestion) =>
  q.questionLatex.replace(/\s+/g, "");
/** Match boundaries protect prompts, independently of answer order or question IDs. */
export class RecentMatches {
  private matches: string[][] = [];
  constructor(private storage?: Pick<Storage, "getItem" | "setItem">) {
    try {
      const data: unknown = JSON.parse(storage?.getItem(KEY) ?? "[]");
      if (Array.isArray(data))
        this.matches = data
          .slice(-3)
          .filter(Array.isArray)
          .map((m) =>
            m.filter((x): x is string => typeof x === "string").slice(-20000),
          );
    } catch {
      /* Private browsing retains in-memory history. */
    }
  }
  begin() {
    this.matches = this.matches.slice(-2);
    const used = new Set(this.matches.flat());
    const current: string[] = [];
    this.matches.push(current);
    this.save();
    return {
      used,
      record: (q: MathQuestion) => {
        const key = promptKey(q);
        used.add(key);
        current.push(key);
        this.save();
      },
    };
  }
  private save() {
    try {
      this.storage?.setItem(KEY, JSON.stringify(this.matches));
    } catch {
      /* memory fallback */
    }
  }
}
let storage: Storage | undefined;
try {
  if (typeof window !== "undefined") storage = window.localStorage;
} catch {
  /* optional */
}
const recent = new RecentMatches(storage);
export function matchQuestions(
  university: boolean,
  random = Math.random,
  history = recent,
) {
  const session = history.begin();
  let serial = 0,
    fallback = 0;
  let deck = university ? universityDeck(random, session.used) : [];
  return (): MathQuestion => {
    let q: MathQuestion | undefined;
    if (university) {
      if (!deck.length) deck = universityDeck(random, session.used);
      q = deck.shift();
    } else {
      for (let i = 0; i < 32; i++) {
        const candidate = basicQuestion(serial++, random);
        if (!session.used.has(promptKey(candidate))) {
          q = candidate;
          break;
        }
      }
      // Bounded deterministic fallback, even if a supplied RNG repeats forever.
      for (let i = 0; !q && i < 118 * 118; i++) {
        const n = fallback++ % (118 * 118);
        const values = [
          0,
          (Math.floor(n / 118) + 0.5) / 118,
          ((n % 118) + 0.5) / 118,
        ];
        const candidate = basicQuestion(serial++, () => values.shift() ?? 0.5);
        if (!session.used.has(promptKey(candidate))) q = candidate;
      }
    }
    if (!q)
      throw new Error("No unseen questions remain in this three-match window.");
    session.record(q);
    globalQuestionHistory.record(q.id);
    return q;
  };
}
