import { fracLatex, simplifyFrac, shuffleAnswers, type MathQuestion } from './Question';

function buildUniqueOptions(correct: string, distractors: string[], fallbackOffset = 1): [string, string, string] {
  const chosen: string[] = [correct];
  for (const d of distractors) {
    if (!chosen.includes(d)) {
      chosen.push(d);
      if (chosen.length === 3) break;
    }
  }
  let step = fallbackOffset;
  while (chosen.length < 3) {
    const num = Number(correct);
    const candidate = !isNaN(num) ? String(num + step) : `${correct}+${step}`;
    if (!chosen.includes(candidate)) {
      chosen.push(candidate);
    }
    step += step > 0 ? -2 * step : -2 * step + 1;
  }
  return [chosen[0], chosen[1], chosen[2]];
}

// -------------------------------------------------------------
// 1. LIMITS TEMPLATES
// -------------------------------------------------------------
function generateLimitsTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // L1: lim_{x->0} sin(ax)/(bx) = a/b
  for (let a = 2; a <= 7; a++) {
    for (let b = 2; b <= 7; b++) {
      if (a === b) continue;
      const [an, bn] = simplifyFrac(a, b);
      const correct = fracLatex(an, bn);
      const d1 = fracLatex(bn, an);
      const d2 = '1';
      const d3 = '0';
      const options = buildUniqueOptions(correct, [d1, d2, d3]);
      list.push({
        id: `limits-sin-${a}-${b}`,
        topic: 'Limits',
        difficulty: 'medium',
        questionLatex: String.raw`\lim_{x\to0}\frac{\sin(${a}x)}{${b}x}`,
        optionsLatex: options,
        correctIndex: 0,
        explanationLatex: String.raw`\sin(kx)\sim kx \implies \frac{${a}x}{${b}x} = ${correct}`,
        estimatedSeconds: 12,
      });
    }
  }

  // L2: lim_{x->0} (1 - cos(ax))/x^2 = a^2 / 2
  for (let a = 2; a <= 6; a++) {
    const a2 = a * a;
    const correct = fracLatex(a2, 2);
    const d1 = String(a2);
    const d2 = fracLatex(a, 2);
    const d3 = String(a);
    const options = buildUniqueOptions(correct, [d1, d2, d3]);
    list.push({
      id: `limits-cos-${a}`,
      topic: 'Limits',
      difficulty: 'hard',
      questionLatex: String.raw`\lim_{x\to0}\frac{1-\cos(${a}x)}{x^2}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`1-\cos u \sim \frac{u^2}{2} \implies \frac{${a2}x^2}{2x^2} = ${correct}`,
      estimatedSeconds: 16,
    });
  }

  // L3: lim_{x->0} tan(ax)/sin(bx) = a/b
  for (let a = 2; a <= 5; a++) {
    for (let b = 2; b <= 5; b++) {
      if (a === b) continue;
      const [an, bn] = simplifyFrac(a, b);
      const correct = fracLatex(an, bn);
      const d1 = fracLatex(bn, an);
      const d2 = '1';
      const d3 = '0';
      const options = buildUniqueOptions(correct, [d1, d2, d3]);
      list.push({
        id: `limits-tan-sin-${a}-${b}`,
        topic: 'Limits',
        difficulty: 'medium',
        questionLatex: String.raw`\lim_{x\to0}\frac{\tan(${a}x)}{\sin(${b}x)}`,
        optionsLatex: options,
        correctIndex: 0,
        explanationLatex: String.raw`\frac{\tan(${a}x)}{\sin(${b}x)} \sim \frac{${a}x}{${b}x} = ${correct}`,
        estimatedSeconds: 12,
      });
    }
  }

  // L4: lim_{x->inf} (1 + a/x)^{bx} = e^{ab}
  for (let a = 1; a <= 3; a++) {
    for (let b = 1; b <= 3; b++) {
      const p = a * b;
      const correct = p === 1 ? 'e' : `e^{${p}}`;
      const d1 = `e^{${a + b}}`;
      const d2 = '1';
      const d3 = `e^{${p + 1}}`;
      const options = buildUniqueOptions(correct, [d1, d2, d3]);
      list.push({
        id: `limits-exp-pow-${a}-${b}`,
        topic: 'Limits',
        difficulty: 'hard',
        questionLatex: String.raw`\lim_{x\to\infty}\left(1+\frac{${a}}{x}\right)^{${b === 1 ? '' : b}x}`,
        optionsLatex: options,
        correctIndex: 0,
        explanationLatex: String.raw`\lim_{x\to\infty}\left(1+\frac{a}{x}\right)^{bx} = e^{ab} = ${correct}`,
        estimatedSeconds: 18,
      });
    }
  }

  // L5: Hard limits with Taylor series
  list.push({
    id: 'limits-hard-taylor-1',
    topic: 'Limits',
    difficulty: 'hard',
    questionLatex: String.raw`\lim_{x\to0}\frac{\sin x - x\cos x}{x^3}`,
    optionsLatex: [String.raw`\frac13`, String.raw`\frac16`, String.raw`\frac12`],
    correctIndex: 0,
    explanationLatex: String.raw`\sin x - x\cos x \approx (x - \frac{x^3}{6}) - x(1 - \frac{x^2}{2}) = \frac{x^3}{3} \implies \frac13`,
    estimatedSeconds: 22,
  });

  list.push({
    id: 'limits-hard-taylor-2',
    topic: 'Limits',
    difficulty: 'hard',
    questionLatex: String.raw`\lim_{x\to0}\frac{x - \sin x}{x^3}`,
    optionsLatex: [String.raw`\frac16`, String.raw`\frac13`, String.raw`\frac12`],
    correctIndex: 0,
    explanationLatex: String.raw`x - \sin x \approx \frac{x^3}{6} \implies \frac16`,
    estimatedSeconds: 20,
  });

  return list;
}

// -------------------------------------------------------------
// 2. DERIVATIVES TEMPLATES
// -------------------------------------------------------------
function generateDerivativesTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // D1: d/dx sin(ax)|_{x=0} = a
  for (let a = 2; a <= 7; a++) {
    const correct = String(a);
    const options = buildUniqueOptions(correct, ['0', '1', String(-a), String(a + 1)]);
    list.push({
      id: `deriv-sin-${a}`,
      topic: 'Derivatives',
      difficulty: 'easy',
      questionLatex: String.raw`\left.\frac{d}{dx}\sin(${a}x)\right|_{x=0}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`${a}\cos(0) = ${a}`,
      estimatedSeconds: 8,
    });
  }

  // D2: d/dx cos(ax)|_{x=0} = 0
  for (let a = 2; a <= 6; a++) {
    list.push({
      id: `deriv-cos-${a}`,
      topic: 'Derivatives',
      difficulty: 'easy',
      questionLatex: String.raw`\left.\frac{d}{dx}\cos(${a}x)\right|_{x=0}`,
      optionsLatex: ['0', String(-a), String(a)],
      correctIndex: 0,
      explanationLatex: String.raw`-${a}\sin(0) = 0`,
      estimatedSeconds: 8,
    });
  }

  // D3: d/dx ln(1+ax)|_{x=0} = a
  for (let a = 2; a <= 6; a++) {
    const correct = String(a);
    const options = buildUniqueOptions(correct, ['1', fracLatex(1, a), String(a + 1)]);
    list.push({
      id: `deriv-ln-${a}`,
      topic: 'Derivatives',
      difficulty: 'medium',
      questionLatex: String.raw`\left.\frac{d}{dx}\ln(1+${a}x)\right|_{x=0}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{${a}}{1+${a}(0)} = ${a}`,
      estimatedSeconds: 10,
    });
  }

  // D4: d/dx ln(sin x)|_{x=pi/4} = cot(pi/4) = 1
  list.push({
    id: 'deriv-ln-sin-pi4',
    topic: 'Derivatives',
    difficulty: 'medium',
    questionLatex: String.raw`f(x)=\ln(\sin x).\quad f'\left(\frac\pi4\right)=?`,
    optionsLatex: ['1', String.raw`\sqrt2`, String.raw`\frac12`],
    correctIndex: 0,
    explanationLatex: String.raw`\cot\left(\frac\pi4\right) = 1`,
    estimatedSeconds: 14,
  });

  // D5: d/dx ln(cos x)|_{x=pi/4} = -tan(pi/4) = -1
  list.push({
    id: 'deriv-ln-cos-pi4',
    topic: 'Derivatives',
    difficulty: 'medium',
    questionLatex: String.raw`f(x)=\ln(\cos x).\quad f'\left(\frac\pi4\right)=?`,
    optionsLatex: ['-1', '1', String.raw`-\sqrt2`],
    correctIndex: 0,
    explanationLatex: String.raw`-\tan\left(\frac\pi4\right) = -1`,
    estimatedSeconds: 14,
  });

  // D6: d^2/dx^2 e^{ax}|_{x=0} = a^2
  for (let a = 2; a <= 6; a++) {
    const a2 = a * a;
    const correct = String(a2);
    const d1 = String(a);
    const d2 = 2 * a === a2 ? String(a2 + 2) : String(2 * a);
    const options = buildUniqueOptions(correct, [d1, d2, String(a2 + 4)]);
    list.push({
      id: `deriv-exp-second-${a}`,
      topic: 'Derivatives',
      difficulty: 'medium',
      questionLatex: String.raw`\left.\frac{d^2}{dx^2}e^{${a}x}\right|_{x=0}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`${a}^2 e^0 = ${a2}`,
      estimatedSeconds: 10,
    });
  }

  // D7: d/dx arctan(ax)|_{x=0} = a
  for (let a = 2; a <= 6; a++) {
    const correct = String(a);
    const options = buildUniqueOptions(correct, ['1', fracLatex(1, a), String(a + 2)]);
    list.push({
      id: `deriv-arctan-${a}`,
      topic: 'Derivatives',
      difficulty: 'medium',
      questionLatex: String.raw`\left.\frac{d}{dx}\arctan(${a}x)\right|_{x=0}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{${a}}{1+(${a}\cdot 0)^2} = ${a}`,
      estimatedSeconds: 10,
    });
  }

  return list;
}

// -------------------------------------------------------------
// 3. INTEGRALS TEMPLATES
// -------------------------------------------------------------
function generateIntegralsTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // I1: Odd function on symmetric interval = 0
  for (let k = 2; k <= 6; k++) {
    const d1 = String(k);
    const d2 = fracLatex(k * k, 2) === d1 ? String(k + 2) : fracLatex(k * k, 2);
    const options = buildUniqueOptions('0', [d1, d2, String(k + 3)]);
    list.push({
      id: `int-odd-${k}`,
      topic: 'Integrals',
      difficulty: 'easy',
      questionLatex: String.raw`\int_{-${k}}^{${k}}\frac{x^3}{1+x^2}\,dx`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\text{Integrand is odd on }[-${k}, ${k}] \implies 0`,
      estimatedSeconds: 8,
    });
  }

  // I2: Symmetry with odd power * cos^2
  list.push({
    id: 'int-odd-trig-pi',
    topic: 'Integrals',
    difficulty: 'medium',
    questionLatex: String.raw`\int_{-\pi}^{\pi}x^3\cos^2x\,dx`,
    optionsLatex: ['0', String.raw`\frac{\pi^4}{2}`, String.raw`-\frac{\pi^4}{2}`],
    correctIndex: 0,
    explanationLatex: String.raw`x^3\cos^2x\text{ is odd} \implies \int_{-\pi}^{\pi}=0`,
    estimatedSeconds: 12,
  });

  // I3: int_0^pi sin^2(kx) dx = pi/2
  for (let k = 1; k <= 4; k++) {
    list.push({
      id: `int-sin2-${k}`,
      topic: 'Integrals',
      difficulty: 'medium',
      questionLatex: String.raw`\int_0^\pi\sin^2(${k === 1 ? '' : k}x)\,dx`,
      optionsLatex: [String.raw`\frac\pi2`, String.raw`\pi`, '0'],
      correctIndex: 0,
      explanationLatex: String.raw`\text{Average of }\sin^2 \text{ over full periods is }\frac12 \implies \frac\pi2`,
      estimatedSeconds: 12,
    });
  }

  // I4: int_0^1 k x^{k-1} dx = 1
  for (let k = 2; k <= 6; k++) {
    const options = buildUniqueOptions('1', [String(k), fracLatex(1, k), String(k + 1)]);
    list.push({
      id: `int-power-${k}`,
      topic: 'Integrals',
      difficulty: 'easy',
      questionLatex: String.raw`\int_0^1 ${k}x^{${k - 1}}\,dx`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`[x^{${k}}]_0^1 = 1 - 0 = 1`,
      estimatedSeconds: 8,
    });
  }

  // I5: int_0^{ln k} e^x dx = k - 1
  for (let k = 2; k <= 6; k++) {
    const correct = String(k - 1);
    const options = buildUniqueOptions(correct, [String(k), String(k + 1), String(k + 2)]);
    list.push({
      id: `int-exp-${k}`,
      topic: 'Integrals',
      difficulty: 'easy',
      questionLatex: String.raw`\int_0^{\ln ${k}} e^x\,dx`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`e^{\ln ${k}} - e^0 = ${k} - 1`,
      estimatedSeconds: 9,
    });
  }

  // I6: int_0^1 (1-x)^k dx = 1/(k+1)
  for (let k = 2; k <= 5; k++) {
    const correct = fracLatex(1, k + 1);
    const d1 = fracLatex(1, k);
    const d2 = '1';
    const options = buildUniqueOptions(correct, [d1, d2, fracLatex(1, k + 2)]);
    list.push({
      id: `int-one-minus-x-${k}`,
      topic: 'Integrals',
      difficulty: 'medium',
      questionLatex: String.raw`\int_0^1(1-x)^{${k}}\,dx`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\left[-\frac{(1-x)^{${k + 1}}}{${k + 1}}\right]_0^1 = ${correct}`,
      estimatedSeconds: 12,
    });
  }

  return list;
}

// -------------------------------------------------------------
// 4. TRIGONOMETRY TEMPLATES
// -------------------------------------------------------------
function generateTrigTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // T1: cos^2(pi/8) - sin^2(pi/8) = cos(pi/4) = sqrt(2)/2
  list.push({
    id: 'trig-cos2-sin2-pi8',
    topic: 'Trigonometry',
    difficulty: 'medium',
    questionLatex: String.raw`\cos^2\left(\frac\pi8\right)-\sin^2\left(\frac\pi8\right)`,
    optionsLatex: [String.raw`\frac{\sqrt2}{2}`, String.raw`\frac12`, '1'],
    correctIndex: 0,
    explanationLatex: String.raw`\cos^2\theta-\sin^2\theta = \cos(2\theta) = \cos(\pi/4) = \frac{\sqrt2}{2}`,
    estimatedSeconds: 14,
  });

  // T2: 2 sin(pi/12) cos(pi/12) = sin(pi/6) = 1/2
  list.push({
    id: 'trig-double-sin-pi12',
    topic: 'Trigonometry',
    difficulty: 'medium',
    questionLatex: String.raw`2\sin\left(\frac\pi{12}\right)\cos\left(\frac\pi{12}\right)`,
    optionsLatex: [String.raw`\frac12`, String.raw`\frac{\sqrt3}{2}`, String.raw`\frac{\sqrt2}{2}`],
    correctIndex: 0,
    explanationLatex: String.raw`2\sin\theta\cos\theta = \sin(2\theta) = \sin(\pi/6) = \frac12`,
    estimatedSeconds: 12,
  });

  // T3: 2 sin(pi/8) cos(pi/8) = sin(pi/4) = sqrt(2)/2
  list.push({
    id: 'trig-double-sin-pi8',
    topic: 'Trigonometry',
    difficulty: 'medium',
    questionLatex: String.raw`2\sin\left(\frac\pi8\right)\cos\left(\frac\pi8\right)`,
    optionsLatex: [String.raw`\frac{\sqrt2}{2}`, String.raw`\frac12`, '1'],
    correctIndex: 0,
    explanationLatex: String.raw`\sin(2\pi/8) = \sin(\pi/4) = \frac{\sqrt2}{2}`,
    estimatedSeconds: 12,
  });

  // T4: cos^2(pi/6) - sin^2(pi/6) = cos(pi/3) = 1/2
  list.push({
    id: 'trig-cos2-sin2-pi6',
    topic: 'Trigonometry',
    difficulty: 'easy',
    questionLatex: String.raw`\cos^2\left(\frac\pi6\right)-\sin^2\left(\frac\pi6\right)`,
    optionsLatex: [String.raw`\frac12`, String.raw`\frac{\sqrt3}{2}`, '0'],
    correctIndex: 0,
    explanationLatex: String.raw`\cos(\pi/3) = \frac12`,
    estimatedSeconds: 10,
  });

  // T5: sin^2(x) + cos^2(x) + tan^2(x) at x = pi/4
  list.push({
    id: 'trig-identity-sum-pi4',
    topic: 'Trigonometry',
    difficulty: 'easy',
    questionLatex: String.raw`\sin^2\left(\frac\pi4\right)+\cos^2\left(\frac\pi4\right)+\tan^2\left(\frac\pi4\right)`,
    optionsLatex: ['2', '1', '3'],
    correctIndex: 0,
    explanationLatex: String.raw`1 + \tan^2(\pi/4) = 1 + 1 = 2`,
    estimatedSeconds: 9,
  });

  return list;
}

// -------------------------------------------------------------
// 5. ALGEBRA TEMPLATES
// -------------------------------------------------------------
function generateAlgebraTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // A1: x + 1/x = k => x^2 + 1/x^2 = k^2 - 2
  for (let k = 3; k <= 7; k++) {
    const k2 = k * k;
    const correct = String(k2 - 2);
    const options = buildUniqueOptions(correct, [String(k2), String(k2 + 2), String(2 * k)]);
    list.push({
      id: `alg-reciprocal-sq-${k}`,
      topic: 'Algebra',
      difficulty: 'medium',
      questionLatex: String.raw`x+\frac1x = ${k}.\quad x^2+\frac1{x^2}=?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\left(x+\frac1x\right)^2-2 = ${k}^2-2 = ${k2 - 2}`,
      estimatedSeconds: 14,
    });
  }

  // A2: Infinite geometric series sum_{n=1}^inf (1/k)^n = 1/(k-1)
  for (let k = 2; k <= 6; k++) {
    const correct = fracLatex(1, k - 1);
    const d1 = fracLatex(1, k);
    const d2 = fracLatex(k, k - 1);
    const options = buildUniqueOptions(correct, [d1, d2, fracLatex(1, k + 1)]);
    list.push({
      id: `alg-geom-series-${k}`,
      topic: 'Algebra',
      difficulty: 'medium',
      questionLatex: String.raw`\sum_{n=1}^\infty\left(\frac1{${k}}\right)^n`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{1/${k}}{1-1/${k}} = \frac{1}{${k - 1}} = ${correct}`,
      estimatedSeconds: 14,
    });
  }

  // A3: Sum_{n=0}^inf (1/k)^n = k/(k-1)
  for (let k = 2; k <= 5; k++) {
    const correct = fracLatex(k, k - 1);
    const d1 = fracLatex(1, k - 1);
    const d2 = k === 2 ? fracLatex(3, 2) : '1';
    const options = buildUniqueOptions(correct, [d1, d2, fracLatex(k + 1, k - 1)]);
    list.push({
      id: `alg-geom-from-zero-${k}`,
      topic: 'Algebra',
      difficulty: 'medium',
      questionLatex: String.raw`\sum_{n=0}^\infty\left(\frac1{${k}}\right)^n`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{1}{1-1/${k}} = \frac{${k}}{${k - 1}} = ${correct}`,
      estimatedSeconds: 12,
    });
  }

  // A4: log_k(k^{k+1}) = k+1
  for (let k = 2; k <= 6; k++) {
    const correct = String(k + 1);
    const options = buildUniqueOptions(correct, [String(k), String(k * (k + 1)), String(k + 2)]);
    list.push({
      id: `alg-log-pow-${k}`,
      topic: 'Algebra',
      difficulty: 'easy',
      questionLatex: String.raw`\log_{${k}}\left(${k}^{${k + 1}}\right)`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\log_a(a^m) = m = ${k + 1}`,
      estimatedSeconds: 7,
    });
  }

  return list;
}

// -------------------------------------------------------------
// 6. MATRICES (2x2 DETERMINANTS)
// -------------------------------------------------------------
function generateMatrixTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // M1: det(cA) = c^2 det(A) for 2x2
  for (let c = 2; c <= 3; c++) {
    for (let detA = 2; detA <= 5; detA++) {
      const correct = String(c * c * detA);
      const d1 = String(c * detA);
      const d2 = String(c * c * c * detA);
      const d3 = String(detA * detA);
      const options = buildUniqueOptions(correct, [d1, d2, d3]);
      list.push({
        id: `mat-det-scalar-${c}-${detA}`,
        topic: 'Matrices',
        difficulty: 'hard',
        questionLatex: String.raw`A\in\mathbb R^{2\times2},\ \det A = ${detA}.\quad \det(${c}A)=?`,
        optionsLatex: options,
        correctIndex: 0,
        explanationLatex: String.raw`\det(${c}A) = ${c}^2\det A = ${c * c}\cdot${detA} = ${correct}`,
        estimatedSeconds: 15,
      });
    }
  }

  // M2: det([k, 1; k+1, 1]) = -1
  for (let k = 2; k <= 6; k++) {
    list.push({
      id: `mat-det-diff-${k}`,
      topic: 'Matrices',
      difficulty: 'easy',
      questionLatex: String.raw`\det\begin{pmatrix}${k}&1\\${k + 1}&1\end{pmatrix}`,
      optionsLatex: ['-1', '1', '0'],
      correctIndex: 0,
      explanationLatex: String.raw`${k}\cdot 1 - (${k + 1})\cdot 1 = -1`,
      estimatedSeconds: 9,
    });
  }

  // M3: Triangular det([a, b; 0, d]) = ad
  for (let a = 2; a <= 5; a++) {
    for (let d = 2; d <= 5; d++) {
      const b = 3;
      const correct = String(a * d);
      const d1 = String(a * d - b);
      const d2 = String(a + d);
      const options = buildUniqueOptions(correct, [d1, d2, String(a * d + b)]);
      list.push({
        id: `mat-triangular-${a}-${d}`,
        topic: 'Matrices',
        difficulty: 'easy',
        questionLatex: String.raw`\det\begin{pmatrix}${a}&${b}\\0&${d}\end{pmatrix}`,
        optionsLatex: options,
        correctIndex: 0,
        explanationLatex: String.raw`${a}\cdot${d} - 0\cdot${b} = ${correct}`,
        estimatedSeconds: 8,
      });
    }
  }

  // M4: 2x2 with clear integer determinant
  const cases = [
    { a: 3, b: 1, c: 4, d: 2, exp: 2 },
    { a: 5, b: 2, c: 2, d: 1, exp: 1 },
    { a: 4, b: 3, c: 1, d: 2, exp: 5 },
    { a: 6, b: 2, c: 3, d: 2, exp: 6 },
  ];
  for (const item of cases) {
    const correct = String(item.exp);
    const d1 = String(item.a * item.d + item.b * item.c);
    const d2 = String(item.exp + 2);
    const options = buildUniqueOptions(correct, [d1, d2, String(item.exp - 2)]);
    list.push({
      id: `mat-det2x2-${item.a}-${item.b}-${item.c}-${item.d}`,
      topic: 'Matrices',
      difficulty: 'medium',
      questionLatex: String.raw`\det\begin{pmatrix}${item.a}&${item.b}\\${item.c}&${item.d}\end{pmatrix}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`${item.a}\cdot${item.d} - ${item.b}\cdot${item.c} = ${correct}`,
      estimatedSeconds: 12,
    });
  }

  return list;
}

// -------------------------------------------------------------
// 7. COMPLEX NUMBERS
// -------------------------------------------------------------
function generateComplexTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // C1: i^{4k + r}
  const rCases = [
    { r: 0, ans: '1', d1: '-1', d2: 'i' },
    { r: 1, ans: 'i', d1: '-i', d2: '1' },
    { r: 2, ans: '-1', d1: '1', d2: '-i' },
    { r: 3, ans: '-i', d1: 'i', d2: '-1' },
  ];
  for (let k = 2; k <= 5; k++) {
    for (const rc of rCases) {
      const pow = 4 * k + rc.r;
      list.push({
        id: `cpx-pow-${pow}`,
        topic: 'Complex numbers',
        difficulty: 'easy',
        questionLatex: String.raw`i^2=-1.\quad i^{${pow}}=?`,
        optionsLatex: [rc.ans, rc.d1, rc.d2],
        correctIndex: 0,
        explanationLatex: String.raw`i^{4\cdot${k}+${rc.r}} = (i^4)^{${k}}\cdot i^{${rc.r}} = ${rc.ans}`,
        estimatedSeconds: 8,
      });
    }
  }

  // C2: |a + ai|^2 = 2 a^2
  for (let a = 2; a <= 6; a++) {
    const correct = String(2 * a * a);
    const d1 = String(a * a);
    const d2 = String(4 * a * a);
    const options = buildUniqueOptions(correct, [d1, d2, String(2 * a)]);
    list.push({
      id: `cpx-mod-sq-${a}`,
      topic: 'Complex numbers',
      difficulty: 'medium',
      questionLatex: String.raw`i^2=-1.\quad |${a}+${a}i|^2=?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`${a}^2 + ${a}^2 = ${correct}`,
      estimatedSeconds: 10,
    });
  }

  // C3: (1+i)^2 = 2i
  list.push({
    id: 'cpx-one-plus-i-sq',
    topic: 'Complex numbers',
    difficulty: 'easy',
    questionLatex: String.raw`i^2=-1.\quad (1+i)^2=?`,
    optionsLatex: ['2i', '2', '0'],
    correctIndex: 0,
    explanationLatex: String.raw`1 + 2i + i^2 = 1 + 2i - 1 = 2i`,
    estimatedSeconds: 8,
  });

  // C4: e^{i pi} = -1
  list.push({
    id: 'cpx-euler-pi',
    topic: 'Complex numbers',
    difficulty: 'easy',
    questionLatex: String.raw`e^{i\pi}=?`,
    optionsLatex: ['-1', '1', 'i'],
    correctIndex: 0,
    explanationLatex: String.raw`\cos\pi + i\sin\pi = -1 + 0 = -1`,
    estimatedSeconds: 7,
  });

  return list;
}

// -------------------------------------------------------------
// 8. PROBABILITY & COMBINATIONS
// -------------------------------------------------------------
function generateProbabilityTemplates(): MathQuestion[] {
  const list: MathQuestion[] = [];

  // P1: binom(n, 2) = n(n-1)/2
  for (let n = 4; n <= 10; n++) {
    const correct = String((n * (n - 1)) / 2);
    const d1 = String(2 * n);
    const d2 = String(n * (n - 1));
    const d3 = String(n * n);
    const options = buildUniqueOptions(correct, [d1, d2, d3]);
    list.push({
      id: `prob-choose-2-${n}`,
      topic: 'Probability',
      difficulty: 'easy',
      questionLatex: String.raw`\binom{${n}}{2}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\frac{${n}\cdot${n - 1}}{2} = ${correct}`,
      estimatedSeconds: 10,
    });
  }

  // P2: P(n, 2) = n(n-1)
  for (let n = 4; n <= 8; n++) {
    const correct = String(n * (n - 1));
    const d1 = String((n * (n - 1)) / 2);
    const d2 = 2 * n === (n * (n - 1)) / 2 ? String(n * n) : String(2 * n);
    const options = buildUniqueOptions(correct, [d1, d2, String(n * n)]);
    list.push({
      id: `prob-perm-2-${n}`,
      topic: 'Probability',
      difficulty: 'medium',
      questionLatex: String.raw`P(${n}, 2) = \frac{${n}!}{( ${n}-2 )!}`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`${n}\cdot${n - 1} = ${correct}`,
      estimatedSeconds: 10,
    });
  }

  // P3: P(exactly 1 head in n flips) = n / 2^n
  for (let n = 3; n <= 6; n++) {
    const den = Math.pow(2, n);
    const correct = fracLatex(n, den);
    const d1 = fracLatex(1, den);
    const d2 = fracLatex(n - 1, den);
    const d3 = fracLatex(1, 2);
    const options = buildUniqueOptions(correct, [d1, d2, d3]);
    list.push({
      id: `prob-coin-1head-${n}`,
      topic: 'Probability',
      difficulty: 'medium',
      questionLatex: String.raw`\text{${n} fair coins.\ } P(\text{exactly 1 head})=?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`\binom{${n}}{1}\left(\frac12\right)^{${n}} = ${correct}`,
      estimatedSeconds: 14,
    });
  }

  // P4: P(at least 1 head in n flips) = (2^n - 1) / 2^n
  for (let n = 3; n <= 5; n++) {
    const den = Math.pow(2, n);
    const correct = fracLatex(den - 1, den);
    const d1 = fracLatex(1, den);
    const d2 = fracLatex(n, den);
    const options = buildUniqueOptions(correct, [d1, d2, fracLatex(1, 2)]);
    list.push({
      id: `prob-at-least-1head-${n}`,
      topic: 'Probability',
      difficulty: 'medium',
      questionLatex: String.raw`\text{${n} fair coins.\ } P(\ge 1 \text{ head})=?`,
      optionsLatex: options,
      correctIndex: 0,
      explanationLatex: String.raw`1 - P(\text{all tails}) = 1 - \frac{1}{${den}} = ${correct}`,
      estimatedSeconds: 12,
    });
  }

  // P5: Two standard dice sum
  list.push({
    id: 'prob-dice-sum-7',
    topic: 'Probability',
    difficulty: 'easy',
    questionLatex: String.raw`\text{Two fair dice.\ } P(\text{sum} = 7)=?`,
    optionsLatex: [String.raw`\frac16`, String.raw`\frac17`, String.raw`\frac1{12}`],
    correctIndex: 0,
    explanationLatex: String.raw`6 \text{ pairs out of } 36 \implies \frac{6}{36} = \frac16`,
    estimatedSeconds: 10,
  });

  list.push({
    id: 'prob-dice-sum-2',
    topic: 'Probability',
    difficulty: 'easy',
    questionLatex: String.raw`\text{Two fair dice.\ } P(\text{sum} = 2)=?`,
    optionsLatex: [String.raw`\frac{1}{36}`, String.raw`\frac{1}{18}`, String.raw`\frac{1}{12}`],
    correctIndex: 0,
    explanationLatex: String.raw`\text{Only }(1,1) \implies \frac{1}{36}`,
    estimatedSeconds: 8,
  });

  return list;
}

// -------------------------------------------------------------
// COMPILED PROCEDURAL REGISTRY
// -------------------------------------------------------------
export function getAllProceduralQuestions(): MathQuestion[] {
  return [
    ...generateLimitsTemplates(),
    ...generateDerivativesTemplates(),
    ...generateIntegralsTemplates(),
    ...generateTrigTemplates(),
    ...generateAlgebraTemplates(),
    ...generateMatrixTemplates(),
    ...generateComplexTemplates(),
    ...generateProbabilityTemplates(),
  ];
}
