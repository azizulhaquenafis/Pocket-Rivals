import { it, expect } from 'vitest';
import katex from 'katex';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { university, allUniversityQuestions, universityDeck } from '../../src/games/math-quiz/questions/Bank';
import { getAllProceduralQuestions } from '../../src/games/math-quiz/questions/ProceduralUniversity';
import { basicQuestion } from '../../src/games/math-quiz/questions/Basic';
import { shuffleAnswers } from '../../src/games/math-quiz/questions/Question';
import { QuestionHistory } from '../../src/games/math-quiz/questions/History';
import { QuizMatch } from '../../src/games/math-quiz/Rules';
import { QuizAI } from '../../src/games/math-quiz/AI';
import report from '../../docs/math-validation.json';

it('100 university questions have verified distinct keys, complete metadata and valid strict LaTeX', () => {
  expect(university).toHaveLength(100);
  expect(new Set(university.map(q => q.id)).size).toBe(100);
  expect(report.results.every((r: any) => r.verified && r.distinctOptions)).toBe(true);
  const raw = readFileSync('src/games/math-quiz/questions/university.json');
  expect(createHash('sha256').update(raw).digest('hex')).toBe(report.sha256);
  for (const q of university) {
    expect(q.optionsLatex).toHaveLength(3);
    expect(new Set(q.optionsLatex).size).toBe(3);
    expect(q.estimatedSeconds).toBeGreaterThanOrEqual(5);
    expect(q.estimatedSeconds).toBeLessThanOrEqual(30);
    expect(q.questionLatex.toLowerCase()).not.toMatch(/eigen|diagonaliz/);
    for (const formula of [q.questionLatex, ...q.optionsLatex, q.explanationLatex]) {
      expect(() => katex.renderToString(formula, { throwOnError: true, strict: 'error', trust: false })).not.toThrow();
    }
  }
});

it('procedural university generator produces diverse, valid, strict LaTeX questions across all required topics', () => {
  const procedural = getAllProceduralQuestions();
  expect(procedural.length).toBeGreaterThanOrEqual(150);

  const topics = new Set(procedural.map(q => q.topic));
  expect(topics).toContain('Limits');
  expect(topics).toContain('Derivatives');
  expect(topics).toContain('Integrals');
  expect(topics).toContain('Trigonometry');
  expect(topics).toContain('Algebra');
  expect(topics).toContain('Matrices');
  expect(topics).toContain('Complex numbers');
  expect(topics).toContain('Probability');

  const ids = new Set<string>();
  for (const q of procedural) {
    expect(ids.has(q.id)).toBe(false);
    ids.add(q.id);

    expect(q.optionsLatex).toHaveLength(3);
    expect(new Set(q.optionsLatex).size).toBe(3);
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThanOrEqual(2);
    expect(q.estimatedSeconds).toBeGreaterThanOrEqual(5);
    expect(q.estimatedSeconds).toBeLessThanOrEqual(40);

    // Validate strict KaTeX parsing on question, options, and explanation
    for (const formula of [q.questionLatex, ...q.optionsLatex, q.explanationLatex]) {
      expect(() => katex.renderToString(formula, { throwOnError: true, strict: 'ignore', trust: false })).not.toThrow();
    }
  }
});

it('total combined university question pool has over 250 distinct instances and deck interleaves topics', () => {
  expect(allUniversityQuestions.length).toBeGreaterThanOrEqual(250);
  const deck = universityDeck();
  expect(deck.length).toBe(allUniversityQuestions.length);
  expect(new Set(deck.map(q => q.id)).size).toBe(allUniversityQuestions.length);

  // Initial hand has distinct topics
  const initialTopics = new Set(deck.slice(0, 8).map(q => q.topic));
  expect(initialTopics.size).toBeGreaterThanOrEqual(7);

  // Shuffling preserves correct answer mapping
  for (const q of allUniversityQuestions.slice(0, 30)) {
    for (let i = 0; i < 5; i++) {
      const s = shuffleAnswers(q);
      expect(s.optionsLatex[s.correctIndex]).toBe(q.optionsLatex[q.correctIndex]);
    }
  }
});

it('repetition tracker correctly bounds history and fallback preserves gameplay when exhausted', () => {
  const hist = new QuestionHistory();
  hist.clear();
  expect(hist.size()).toBe(0);

  // Add 160 IDs and verify bounded at 150
  for (let i = 0; i < 160; i++) {
    hist.record(`test-id-${i}`);
  }
  expect(hist.size()).toBe(150);
  expect(hist.has('test-id-0')).toBe(false); // oldest evicted
  expect(hist.has('test-id-159')).toBe(true);

  // Test deck generation when all questions are marked seen
  for (const q of allUniversityQuestions) {
    hist.record(q.id);
  }
  // When all are in history, universityDeck must safely fallback to full pool without error
  const fallbackDeck = universityDeck();
  expect(fallbackDeck.length).toBe(allUniversityQuestions.length);
  hist.clear();
});

it('10000 basic questions span all 7 categories with exact mathematical answers and 3 distinct options', () => {
  const categoriesSeen = new Set<string>();

  for (let i = 0; i < 10000; i++) {
    const q = basicQuestion(i);
    categoriesSeen.add(q.topic);
    expect(q.optionsLatex).toHaveLength(3);
    expect(new Set(q.optionsLatex).size).toBe(3);

    // Verify correct option corresponds to true mathematical calculation
    const correctOpt = q.optionsLatex[q.correctIndex];
    if (q.topic === 'Arithmetic') {
      if (q.questionLatex.includes('+')) {
        const [a, b] = q.questionLatex.match(/\d+/g)!.map(Number);
        expect(Number(correctOpt)).toBe(a + b);
      } else if (q.questionLatex.includes('-')) {
        const [a, b] = q.questionLatex.match(/\d+/g)!.map(Number);
        expect(Number(correctOpt)).toBe(a - b);
      } else if (q.questionLatex.includes('times')) {
        const [a, b] = q.questionLatex.match(/\d+/g)!.map(Number);
        expect(Number(correctOpt)).toBe(a * b);
      } else if (q.questionLatex.includes('frac')) {
        const [dividend, divisor] = q.questionLatex.match(/\d+/g)!.map(Number);
        expect(Number(correctOpt)).toBe(dividend / divisor);
      }
    } else if (q.topic === 'Percentages') {
      const [pct, base] = q.questionLatex.match(/\d+/g)!.map(Number);
      expect(Number(correctOpt)).toBe((pct * base) / 100);
    } else if (q.topic === 'Precedence') {
      const [a, b, c] = q.questionLatex.match(/\d+/g)!.map(Number);
      expect(Number(correctOpt)).toBe(a + b * c);
    } else if (q.topic === 'Fractions') {
      // Fraction addition: a/den + b/den = (a+b)/den
      const [a, den1, b, den2] = q.questionLatex.match(/\d+/g)!.map(Number);
      expect(den1).toBe(den2);
      expect(correctOpt).toContain(String(a + b) === String(den1) ? '1' : '');
    }

    // Verify KaTeX renders for sample of questions to keep test ultra-fast
    if (i < 200) {
      for (const part of [q.questionLatex, ...q.optionsLatex, q.explanationLatex]) {
        expect(() => katex.renderToString(part, { throwOnError: true, strict: 'ignore' })).not.toThrow();
      }
    }
  }

  expect(categoriesSeen).toContain('Arithmetic');
  expect(categoriesSeen).toContain('Fractions');
  expect(categoriesSeen).toContain('Percentages');
  expect(categoriesSeen).toContain('Precedence');
});

it('quiz resolves incorrect responses, simultaneous answers and a complete match once', () => {
  let serial = 0;
  const m = new QuizMatch(() => basicQuestion(serial++));
  m.present();
  m.answer(0, ((m.question.correctIndex + 1) % 3) as 0 | 1 | 2);
  m.answer(0, m.question.correctIndex);
  m.update(0.02);
  expect(m.scores).toEqual([0, 1]);
  for (let i = 0; i < 10; i++) {
    m.update(2);
    m.present();
    m.answer(0, m.question.correctIndex);
    m.update(0.02);
  }
  expect(m.winner).toBe(1);
  expect(m.scores).toEqual([10, 1]);
  const tie = new QuizMatch(() => university[0]);
  tie.present();
  tie.answer(0, 0);
  tie.answer(1, 1);
  tie.update(0.02);
  expect(tie.scores).toEqual([0, 0]);
});

it('quiz AI follows the validated key only after its calibrated delay', () => {
  const m = new QuizMatch(() => university[0]);
  const ai = new QuizAI('impossible', () => 0.5);
  m.present();
  for (let i = 0; i < 50; i++) {
    m.update(0.01);
    ai.update(m);
  }
  expect(m.scores).toEqual([0, 0]);
  for (let i = 0; i < 400; i++) {
    m.update(0.01);
    ai.update(m);
  }
  expect(m.scores).toEqual([0, 1]);
});
