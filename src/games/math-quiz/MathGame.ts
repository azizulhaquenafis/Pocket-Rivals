import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { QuizMatch } from "./Rules";
import { QuizAI } from "./AI";
import { MathUI } from "./MathUI";
import { matchQuestions } from "./questions/MatchQuestions";

const P1_KEYS = new Map<string, number>([
  ["ArrowLeft", 0],
  ["ArrowDown", 1],
  ["ArrowRight", 2],
  ["Digit1", 0],
  ["Digit2", 1],
  ["Digit3", 2],
  ["Numpad1", 0],
  ["Numpad2", 1],
  ["Numpad3", 2],
]);
const P2_KEYS = new Map<string, number>([
  ["KeyA", 0],
  ["KeyS", 1],
  ["KeyD", 2],
  ["Digit7", 0],
  ["Digit8", 1],
  ["Digit9", 2],
]);
export class MathGame implements MiniGame {
  private ctx!: GameContext;
  private m!: QuizMatch;
  private ai?: QuizAI;
  private ui!: MathUI;
  private paused = false;
  private round = 0;
  private streaks = [0, 0];
  private finished = 0;
  private reported = false;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    const next = matchQuestions(ctx.options.variant === "university");
    this.m = new QuizMatch(next);
    if (ctx.options.mode === "ai") this.ai = new QuizAI(ctx.options.difficulty);
    this.ui = new MathUI(!this.ai, (p, i) => {
      if (!this.paused && !(p === 1 && this.ai)) this.answer(p, i);
    });
    ctx.input.press([...P1_KEYS.keys(), ...P2_KEYS.keys()], (code) => {
      if (this.paused) return;
      const p1 = P1_KEYS.get(code);
      if (p1 !== undefined) {
        this.answer(0, p1);
        return;
      }
      const p2 = P2_KEYS.get(code);
      if (p2 !== undefined) {
        if (this.ai && code.startsWith("Key")) this.answer(0, p2);
        else if (!this.ai) this.answer(1, p2);
      }
    });
    ctx.setScore(0, 0);
    ctx.setHint("");
    ctx.audio.play("start");
    this.ui.render(this.m, !!this.ai);
    this.m.present();
  }
  private answer(p: 0 | 1, index: number) {
    if (this.m.phase === "active") this.ctx.audio.play("tap", 0.45);
    this.m.answer(p, index);
  }
  update(dt: number) {
    if (this.paused) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    if (this.round !== this.m.round) {
      this.round = this.m.round;
      this.ctx.setScore(...this.m.scores);
      if (this.m.message.includes("SAME INSTANT")) {
        this.ctx.audio.play("draw", 0.85);
      } else if (this.m.message === "CORRECT!") {
        const w = this.m.roundWinner === 1 ? 0 : 1;
        this.streaks[w]++;
        this.streaks[1 - w] = 0;
        this.ctx.audio.play(
          this.m.winner || this.streaks[w] >= 3 ? "perfect" : "capture",
        );
      } else {
        this.streaks = [0, 0];
        this.ctx.audio.play("fail");
      }
    }
    this.ui.render(this.m, !!this.ai);
    this.m.present();
    if (this.m.winner) {
      this.finished += dt;
      if (this.finished > 1.4 && !this.reported) {
        this.reported = true;
        this.ctx.finish({ winner: this.m.winner, scores: this.m.scores });
      }
    }
  }
  resize() {
    this.ui?.resize();
  }
  pause() {
    this.paused = true;
    this.ui.pause(true);
  }
  resume() {
    this.paused = false;
    this.ui.pause(false);
    this.resize();
  }
  dispose() {
    this.ui.dispose();
  }
  snapshot() {
    return {
      phase: this.m.phase,
      question: this.m.question,
      scores: [...this.m.scores],
      round: this.m.round,
      roundWinner: this.m.roundWinner,
      time: this.m.time,
      winner: this.m.winner,
      ai: this.ai?.snapshot(),
    };
  }
}
