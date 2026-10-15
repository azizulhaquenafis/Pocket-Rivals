import { shuffleAnswers, fracLatex, simplifyFrac, type MathQuestion } from './Question';

export function basicQuestion(serial: number, random = Math.random): MathQuestion {
  // Category selection across all 7 required basic math categories:
  // 0: Addition, 1: Subtraction, 2: Multiplication, 3: Division,
  // 4: Fractions, 5: Percentages, 6: Operator Precedence
  const cat = Math.floor(random() * 7);

  if (cat === 0) {
    // Addition: 2-digit sums
    const a = 11 + Math.floor(random() * 78);
    const b = 11 + Math.floor(random() * 78);
    const correct = a + b;
    // Misconceptions: off-by-one, digit carry mistake (off by 10)
    const d1 = correct + (random() < 0.5 ? 1 : -1);
    const d2 = correct + (random() < 0.5 ? 10 : -10);
    const options: [string, string, string] = [
      String(correct),
      String(d1),
      String(d2 === correct || d2 === d1 ? correct + 2 : d2),
    ];
    const q: MathQuestion = {
      id: `basic-add-${a}-${b}`,
      topic: 'Arithmetic',
      difficulty: 'easy',
      questionLatex: `${a} + ${b} = ?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: `${a} + ${b} = ${correct}`,
      estimatedSeconds: 6,
    };
    return shuffleAnswers(q, random);
  }

  if (cat === 1) {
    // Subtraction
    const a = 25 + Math.floor(random() * 74);
    const b = 12 + Math.floor(random() * (a - 5));
    const correct = a - b;
    const d1 = correct + (random() < 0.5 ? 1 : -1);
    const d2 = correct + (random() < 0.5 ? 10 : -10);
    const options: [string, string, string] = [
      String(correct),
      String(d1),
      String(d2 === correct || d2 === d1 ? (correct > 2 ? correct - 2 : correct + 3) : d2),
    ];
    const q: MathQuestion = {
      id: `basic-sub-${a}-${b}`,
      topic: 'Arithmetic',
      difficulty: 'easy',
      questionLatex: `${a} - ${b} = ?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: `${a} - ${b} = ${correct}`,
      estimatedSeconds: 7,
    };
    return shuffleAnswers(q, random);
  }

  if (cat === 2) {
    // Multiplication
    const a = 4 + Math.floor(random() * 12);
    const b = 4 + Math.floor(random() * 12);
    const correct = a * b;
    // Misconceptions: addition instead of multiplication, off-by-a, off-by-one
    const d1 = correct + a;
    const d2 = correct - b;
    const options: [string, string, string] = [
      String(correct),
      String(d1),
      String(d2 > 0 && d2 !== correct && d2 !== d1 ? d2 : correct + 1),
    ];
    const q: MathQuestion = {
      id: `basic-mul-${a}-${b}`,
      topic: 'Arithmetic',
      difficulty: 'easy',
      questionLatex: String.raw`${a} \times ${b} = ?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`${a} \times ${b} = ${correct}`,
      estimatedSeconds: 7,
    };
    return shuffleAnswers(q, random);
  }

  if (cat === 3) {
    // Division: exact integer
    const b = 3 + Math.floor(random() * 9);
    const correct = 4 + Math.floor(random() * 12);
    const dividend = b * correct;
    const d1 = correct + 1;
    const d2 = correct - 1 > 0 ? correct - 1 : correct + 2;
    const options: [string, string, string] = [
      String(correct),
      String(d1),
      String(d2),
    ];
    const q: MathQuestion = {
      id: `basic-div-${dividend}-${b}`,
      topic: 'Arithmetic',
      difficulty: 'easy',
      questionLatex: String.raw`\frac{${dividend}}{${b}} = ?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{${dividend}}{${b}} = ${correct}`,
      estimatedSeconds: 8,
    };
    return shuffleAnswers(q, random);
  }

  if (cat === 4) {
    // Fractions: Addition with common denominator
    const den = 3 + Math.floor(random() * 7); // 3..9
    const a = 1 + Math.floor(random() * (den - 2));
    const b = 1 + Math.floor(random() * (den - a));
    const correctNum = a + b;
    const correctStr = fracLatex(correctNum, den);
    // Misconceptions: added denominators (a+b)/(2*den), or forgot to add numerators
    const d1 = fracLatex(correctNum, den * 2);
    const d2 = fracLatex(correctNum + 1, den);
    const optSet = new Set([correctStr]);
    const validD1 = !optSet.has(d1) ? d1 : fracLatex(Math.max(1, correctNum - 1), den);
    optSet.add(validD1);
    const validD2 = !optSet.has(d2) ? d2 : fracLatex(correctNum + 2, den);
    const options: [string, string, string] = [correctStr, validD1, validD2];

    const q: MathQuestion = {
      id: `basic-frac-${a}-${b}-${den}`,
      topic: 'Fractions',
      difficulty: 'easy',
      questionLatex: String.raw`\frac{${a}}{${den}} + \frac{${b}}{${den}} = ?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{${a}+${b}}{${den}} = ${correctStr}`,
      estimatedSeconds: 10,
    };
    return shuffleAnswers(q, random);
  }

  if (cat === 5) {
    // Percentages: 10%, 20%, 25%, 50%, 75%
    const pOptions = [10, 20, 25, 50, 75];
    const pct = pOptions[Math.floor(random() * pOptions.length)];
    // Pick base that gives clean integer
    const mult = pct === 10 ? 10 : pct === 20 ? 5 : pct === 50 ? 2 : 4;
    const k = 2 + Math.floor(random() * 8);
    const base = k * mult;
    const correct = (pct * base) / 100;
    // Misconceptions: off-by-base/10, forgot percentage multiplier
    const d1 = correct + mult;
    const d2 = correct > mult ? correct - mult : correct + mult * 2;
    const options: [string, string, string] = [
      String(correct),
      String(d1),
      String(d2 === correct || d2 === d1 ? correct + 5 : d2),
    ];
    const q: MathQuestion = {
      id: `basic-pct-${pct}-${base}`,
      topic: 'Percentages',
      difficulty: 'easy',
      questionLatex: `${pct}\\% \\text{ of } ${base} = ?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{${pct}}{100} \times ${base} = ${correct}`,
      estimatedSeconds: 9,
    };
    return shuffleAnswers(q, random);
  }

  // cat === 6: Operator Precedence: a + b * c
  const a = 2 + Math.floor(random() * 8);
  const b = 2 + Math.floor(random() * 6);
  const c = 2 + Math.floor(random() * 6);
  const correct = a + b * c;
  // Misconception: (a + b) * c (evaluated left to right without precedence!)
  const dPrecedence = (a + b) * c;
  const dOff = correct + 1;
  const options: [string, string, string] = [
    String(correct),
    String(dPrecedence !== correct ? dPrecedence : correct + b),
    String(dOff !== correct && dOff !== dPrecedence ? dOff : correct - 1),
  ];
  const q: MathQuestion = {
    id: `basic-prec-${a}-${b}-${c}`,
    topic: 'Precedence',
    difficulty: 'easy',
    questionLatex: String.raw`${a} + ${b} \times ${c} = ?`,
    optionsLatex: options,
    correctIndex: 0,
    explanationLatex: String.raw`${a} + (${b}\times${c}) = ${a}+${b * c} = ${correct}`,
    estimatedSeconds: 8,
  };
  return shuffleAnswers(q, random);
}
