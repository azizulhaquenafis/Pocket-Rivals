import type { MathQuestion } from "./Question";
import { shuffleAnswers, shuffled } from "./Question";
import { getAllProceduralQuestions } from "./ProceduralUniversity";
import { globalQuestionHistory } from "./History";
import data from "./university.json";
import { extendedUniversity } from "./ExtendedUniversity";

export const university = data as MathQuestion[];

// Combine verified static bank with all procedural questions
const rawCombined: MathQuestion[] = [
  ...university,
  ...getAllProceduralQuestions(),
  ...extendedUniversity(),
];

// Deduplicate by canonical ID
const uniqueMap = new Map<string, MathQuestion>();
const prompts = new Set<string>();
for (const q of rawCombined) {
  const key = q.questionLatex.replace(/\s+/g, "");
  if (!prompts.has(key)) {
    uniqueMap.set(q.id, q);
    prompts.add(key);
  }
}

export const allUniversityQuestions: MathQuestion[] = Array.from(
  uniqueMap.values(),
);

/**
 * Creates an interleaved topic deck of university challenge questions.
 * Prioritizes questions not recently seen in persistent history.
 * Never freezes or loops: falls back to full pool when all variations are exhausted.
 */
export function universityDeck(random = Math.random): MathQuestion[] {
  let available = allUniversityQuestions.filter(
    (q) => !globalQuestionHistory.has(q.id),
  );
  if (available.length === 0) {
    // A finite bank can repeat only after the entire bank has been used.
    globalQuestionHistory.forget(allUniversityQuestions.map((q) => q.id));
    available = allUniversityQuestions;
  }
  const topics = shuffled([...new Set(available.map((q) => q.topic))], random);
  const groups = topics.map((t) =>
    shuffled(
      available.filter((q) => q.topic === t),
      random,
    ),
  );

  const deck: MathQuestion[] = [];
  while (groups.some((g) => g.length > 0)) {
    for (const g of groups) {
      const q = g.pop();
      if (q) {
        deck.push(shuffleAnswers(q, random));
      }
    }
  }

  return deck;
}
