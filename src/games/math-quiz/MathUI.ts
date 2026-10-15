import katex from 'katex';
import 'katex/dist/katex.min.css';
import './quiz.css';
import type { QuizMatch } from './Rules';

export const renderMath = (value: string, node: HTMLElement) =>
  katex.render(value, node, {
    throwOnError: false,
    trust: false,
    strict: 'ignore',
    displayMode: true,
  });

export class MathUI {
  readonly root = document.createElement('div');
  private id = '';
  private phase = '';

  constructor(local: boolean, answer: (p: 0 | 1, index: number) => void) {
    this.root.className = 'quiz-overlay';
    this.root.innerHTML = `<div class="quiz-panel">${this.side(1, local)}<div class="quiz-middle"><span></span><div class="quiz-explanation"></div></div>${this.side(0, local)}</div>`;
    this.root.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (b && !b.disabled) {
        e.preventDefault();
        answer(Number(b.dataset.player) as 0 | 1, Number(b.dataset.answer));
      }
    });
    document.querySelector('#game-stage')!.append(this.root);
    this.resize();
  }

  private side(p: number, local: boolean) {
    return `<section class="quiz-side ${p === 1 ? 'blue' : 'orange'} ${local ? 'local' : ''}" aria-label="${p === 1 ? 'Blue' : 'Orange'} answers">
      <div class="quiz-topic"></div>
      <div class="quiz-formula"></div>
      <div class="quiz-options">${[0, 1, 2].map((i) => `<button data-player="${p}" data-answer="${i}" aria-label="${p === 1 ? 'Blue' : 'Orange'} answer ${i + 1}"></button>`).join('')}</div>
    </section>`;
  }

  render(m: QuizMatch, ai: boolean) {
    const changed = this.id !== m.question.id;
    if (changed) {
      this.id = m.question.id;
      this.root.querySelectorAll<HTMLElement>('.quiz-topic').forEach((t) => {
        t.textContent = m.question.topic;
      });
      this.root.querySelectorAll<HTMLElement>('.quiz-formula').forEach((n) => {
        renderMath(m.question.questionLatex, n);
      });
      this.root.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
        renderMath(m.question.optionsLatex[Number(b.dataset.answer)], b);
      });
      this.fit();
      void document.fonts?.ready?.then(() => this.fit());
    }

    if (this.phase !== m.phase || changed) {
      this.phase = m.phase;
      const statusText = m.phase === 'between' || m.phase === 'done' ? m.message : `${m.question.topic} · FIRST TO 10`;
      this.root.querySelector('.quiz-middle span')!.textContent = statusText;
      const explain = this.root.querySelector<HTMLElement>('.quiz-explanation')!;
      if (m.phase === 'between' || m.phase === 'done') {
        renderMath(m.question.explanationLatex, explain);
      } else {
        explain.replaceChildren();
      }
      this.root.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
        b.disabled = (m.phase !== 'active' && m.phase !== 'show') || (ai && b.dataset.player === '1');
        b.classList.toggle('correct', (m.phase === 'between' || m.phase === 'done') && Number(b.dataset.answer) === m.question.correctIndex);
      });
      this.fit();
    }
  }

  private fit() {
    // Fit formulas
    for (const n of this.root.querySelectorAll<HTMLElement>('.quiz-formula')) {
      n.style.fontSize = '18px';
      const math = n.querySelector<HTMLElement>('.katex');
      if (!math) continue;
      const maxW = 338;
      const maxH = 68;
      const scaleW = math.offsetWidth > maxW ? maxW / math.offsetWidth : 1;
      const scaleH = math.offsetHeight > maxH ? maxH / math.offsetHeight : 1;
      const scale = Math.min(scaleW, scaleH);
      if (scale < 1) {
        n.style.fontSize = `${Math.max(11, Math.floor(18 * scale))}px`;
      }
    }

    // Fit buttons
    for (const b of this.root.querySelectorAll<HTMLButtonElement>('.quiz-options button')) {
      b.style.fontSize = '18px';
      const math = b.querySelector<HTMLElement>('.katex');
      if (!math) continue;
      const maxW = b.offsetWidth > 0 ? b.offsetWidth - 12 : 98;
      const maxH = 44;
      const scaleW = math.offsetWidth > maxW ? maxW / math.offsetWidth : 1;
      const scaleH = math.offsetHeight > maxH ? maxH / math.offsetHeight : 1;
      const scale = Math.min(scaleW, scaleH);
      if (scale < 1) {
        b.style.fontSize = `${Math.max(11, Math.floor(18 * scale))}px`;
      }
    }

    // Fit explanation
    const explain = this.root.querySelector<HTMLElement>('.quiz-explanation');
    if (explain) {
      explain.style.fontSize = '12px';
      const math = explain.querySelector<HTMLElement>('.katex');
      if (math && math.offsetWidth > 338) {
        explain.style.fontSize = `${Math.max(10, Math.floor(12 * 338 / math.offsetWidth))}px`;
      }
    }
  }

  resize() {
    const stage = document.querySelector('#game-stage');
    const canvas = document.querySelector('canvas');
    if (!stage || !canvas) return;
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    this.root.style.left = `${canvasRect.x - stageRect.x}px`;
    this.root.style.top = `${canvasRect.y - stageRect.y}px`;
    this.root.style.transform = `scale(${canvasRect.width / 420})`;
    this.fit();
  }

  pause(p: boolean) {
    this.root.hidden = p;
  }

  dispose() {
    this.root.remove();
  }
}
