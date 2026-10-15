import type { MathQuestion } from './Question';
import { shuffleAnswers, shuffled } from './Question';
import { getAllProceduralQuestions } from './ProceduralUniversity';
import { globalQuestionHistory } from './History';
import data from './university.json';

export const university = data as MathQuestion[];

// Combine verified static bank with all procedural questions
const rawCombined: MathQuestion[] = [...university, ...getAllProceduralQuestions()];

// Deduplicate by canonical ID
const uniqueMap = new Map<string, MathQuestion>();
for (const q of rawCombined) {
  uniqueMap.set(q.id, q);
}

export const allUniversityQuestions: MathQuestion[] = Array.from(uniqueMap.values());

/**
 * Creates an interleaved topic deck of university challenge questions.
 * Prioritizes questions not recently seen in persistent history.
 * Never freezes or loops: falls back to full pool when all variations are exhausted.
 */
export function universityDeck(random = Math.random): MathQuestion[] {
  const topics = shuffled([...new Set(allUniversityQuestions.map(q => q.topic))], random);

  // Group questions by topic, separating unplayed from recently played
  const groups: MathQuestion[][] = topics.map(t => {
    const topicPool = allUniversityQuestions.filter(q => q.topic === t);
    const unplayed = topicPool.filter(q => !globalQuestionHistory.has(q.id));
    // Fallback: if all questions in this topic were recently played, use the full topic pool
    const candidates = unplayed.length > 0 ? unplayed : topicPool;
    return shuffled(candidates, random);
  });

  const deck: MathQuestion[] = [];
  while (groups.some(g => g.length > 0)) {
    for (const g of groups) {
      const q = g.pop();
      if (q) {
        deck.push(shuffleAnswers(q, random));
      }
    }
  }

  return deck;
}
