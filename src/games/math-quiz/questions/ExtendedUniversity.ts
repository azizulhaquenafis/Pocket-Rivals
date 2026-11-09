import { fracLatex, type MathQuestion } from "./Question";
/** Exact rational families: parameterized questions, never approximate answer keys. */
export function extendedUniversity(): MathQuestion[] {
  const questions: MathQuestion[] = [];
  for (let a = 2; a <= 25; a++)
    for (let b = 2; b <= 17; b++) {
      const add = (
        family: string,
        topic: string,
        question: string,
        n: number,
        d: number,
        explanation: string,
        difficulty: "medium" | "hard" = "medium",
      ) => {
        const answer = fracLatex(n, d);
        questions.push({
          id: `extended-${family}-${a}-${b}`,
          topic,
          difficulty,
          questionLatex: question,
          optionsLatex: [answer, fracLatex(n + d, d), fracLatex(n - d, d)],
          correctIndex: 0,
          explanationLatex: `${explanation} = ${answer}`,
          estimatedSeconds: difficulty === "hard" ? 24 : 18,
        });
      };
      add(
        "series",
        "Sequences",
        String.raw`\sum_{k=1}^{${a}}(${b}k+${a})`,
        (b * a * (a + 1)) / 2 + a * a,
        1,
        String.raw`${b}\frac{${a}(${a}+1)}2+${a}^2`,
      );
      add(
        "log",
        "Logarithms",
        String.raw`\log_{${a}}\left(${a}^{${b}}\sqrt{${a}}\right)`,
        2 * b + 1,
        2,
        String.raw`${b}+\frac12`,
      );
      add(
        "vector",
        "Vectors",
        String.raw`(${a},${b})\cdot(${b},${a + 1})`,
        2 * a * b + b,
        1,
        String.raw`${a}\cdot${b}+${b}\cdot${a + 1}`,
      );
      add(
        "mod",
        "Number theory",
        String.raw`${a}^2\bmod ${b}`,
        (a * a) % b,
        1,
        String.raw`${a * a}-${b}\cdot${Math.floor((a * a) / b)}`,
      );
      add(
        "limit",
        "Limits",
        String.raw`\lim_{x\to0}\left(\frac{e^{${a}x}-1-${a}x}{x^2}+${b}\right)`,
        a * a + 2 * b,
        2,
        String.raw`e^u=1+u+\frac{u^2}{2}+O(u^3)\implies\frac{${a}^2}{2}+${b}`,
        "hard",
      );
      add(
        "derivative",
        "Derivatives",
        String.raw`f(x)=\ln(1+${a}x)+${b}x^2.\quad f''(0)=?`,
        2 * b - a * a,
        1,
        String.raw`f''(0)=-${a}^2+2\cdot${b}`,
        "hard",
      );
      add(
        "integral",
        "Integrals",
        String.raw`\int_0^1\left(${a + 1}x^{${a}}+${b}x\right)\,dx`,
        2 + b,
        2,
        String.raw`\left[x^{${a + 1}}+\frac{${b}x^2}{2}\right]_0^1=1+\frac{${b}}2`,
      );
      add(
        "trig",
        "Trigonometry",
        String.raw`\tan\theta=\frac{${a}}{${b}}.\quad \cos(2\theta)=?`,
        b * b - a * a,
        b * b + a * a,
        String.raw`\frac{1-\tan^2\theta}{1+\tan^2\theta}=\frac{${b}^2-${a}^2}{${b}^2+${a}^2}`,
      );
      add(
        "roots",
        "Algebra",
        String.raw`\alpha,\beta\text{ solve }x^2-${a}x+${b}=0.\quad\alpha^2+\beta^2=?`,
        a * a - 2 * b,
        1,
        String.raw`(\alpha+\beta)^2-2\alpha\beta=${a}^2-2\cdot${b}`,
      );
      add(
        "matrix",
        "Matrices",
        String.raw`\det\begin{pmatrix}${a}&${b}\\${b}&${a + 1}\end{pmatrix}`,
        a * (a + 1) - b * b,
        1,
        String.raw`${a}\cdot${a + 1}-${b}^2`,
      );
      add(
        "complex",
        "Complex numbers",
        String.raw`i^2=-1.\quad\operatorname{Re}((${a}+${b}i)^2)=?`,
        a * a - b * b,
        1,
        String.raw`\operatorname{Re}((${a}+${b}i)^2)=${a}^2-${b}^2`,
      );
      add(
        "probability",
        "Probability",
        String.raw`\begin{gathered}\text{${a} red, ${b} blue balls.}\\\text{Draw 2 without replacement.}\\P(\text{both red})=?\end{gathered}`,
        a * (a - 1),
        (a + b) * (a + b - 1),
        String.raw`\frac{${a}}{${a + b}}\cdot\frac{${a - 1}}{${a + b - 1}}`,
      );
    }
  return questions;
}
