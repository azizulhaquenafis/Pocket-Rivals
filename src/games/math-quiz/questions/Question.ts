export interface MathQuestion {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionLatex: string;
  optionsLatex: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanationLatex: string;
  estimatedSeconds: number;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a), y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function simplifyFrac(num: number, den: number): [number, number] {
  if (den === 0) return [num, 1];
  const sign = (num < 0 ? -1 : 1) * (den < 0 ? -1 : 1);
  const d = gcd(num, den);
  return [(Math.abs(num) / d) * sign, Math.abs(den) / d];
}

export function fracLatex(num: number, den: number): string {
  const [n, d] = simplifyFrac(num, den);
  if (d === 1) return String(n);
  if (n < 0) return String.raw`-\frac{${Math.abs(n)}}{${d}}`;
  return String.raw`\frac{${n}}{${d}}`;
}

export function shuffled<T>(items: readonly T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleAnswers(q: MathQuestion, random = Math.random): MathQuestion {
  const order = shuffled([0, 1, 2], random);
  return {
    ...q,
    optionsLatex: order.map(i => q.optionsLatex[i]) as MathQuestion['optionsLatex'],
    correctIndex: order.indexOf(q.correctIndex) as 0 | 1 | 2,
  };
}
