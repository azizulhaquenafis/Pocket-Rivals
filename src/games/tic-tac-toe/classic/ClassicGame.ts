import { turnBackground } from "../../../shared/components/TurnView";
import { restoredAISeed } from "../../../shared/ai/MatchRandom";
import { ClassicAI } from "./ClassicAI";
import Phaser from "phaser";
import type {
  GameContext,
  MiniGame,
} from "../../../shared/contracts/GameModule";
import { theme } from "../../../core/ThemeManager";
import { rounded, symbol, label } from "../../../shared/components/drawing";
import { TicTacToeBoard } from "./ClassicRules";
export class TicTacToe implements MiniGame {
  private ctx!: GameContext;
  private ai?: ClassicAI;
  private board = new TicTacToeBoard();
  private graphics!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private turn!: Phaser.GameObjects.Text;
  private ages = Array(9).fill(0);
  private endAge = 0;
  private reported = false;
  private paused = false;
  private elapsed = 0;
  private thinkFor = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.board = TicTacToeBoard.restore(ctx.restoredState);
    if (ctx.options.mode === "ai")
      this.ai = new ClassicAI(
        ctx.options.difficulty,
        restoredAISeed(ctx.restoredState),
      );
    this.ages = this.board.cells.map((p) => (p ? 1 : 0));
    ctx.setScore(0, 0);
    ctx.setHint("");
    this.bg = ctx.scene.add.graphics();
    this.turn = label(ctx.scene, 210, 172, "", 12);
    this.graphics = ctx.scene.add.graphics();
    ctx.input.tap((x, y) => {
      if (
        this.paused ||
        (ctx.options.mode === "ai" && this.board.turn === 2) ||
        this.elapsed < 0.2 ||
        x < 48 ||
        x >= 372 ||
        y < 219 ||
        y >= 543
      )
        return;
      const cell = Math.floor((y - 219) / 108) * 3 + Math.floor((x - 48) / 108);
      this.place(cell);
    });
  }
  private place(cell: number) {
    if (!this.board.play(cell)) return;
    this.ages[cell] = 0.001;
    this.thinkFor = 0;
    this.ctx.audio.play("tap");
    this.ctx.saveState({ ...this.board.save(), ai: this.ai?.snapshot() });
    this.refreshTurn();
  }
  private refreshTurn() {
    this.bg.clear();
    rounded(this.bg, 24, 112, 372, 538, 20, turnBackground(this.board.turn), 4);
    rounded(this.bg, 48, 219, 324, 324, 18, theme.white, 3);
    this.bg
      .lineStyle(4, theme.ink)
      .lineBetween(156, 234, 156, 528)
      .lineBetween(264, 234, 264, 528)
      .lineBetween(63, 327, 357, 327)
      .lineBetween(63, 435, 357, 435);
    this.turn.setText(
      this.board.winner
        ? this.board.winner === "draw"
          ? "A PERFECT STANDOFF."
          : "THREE’S A CHARM!"
        : this.board.turn === 1
          ? ""
          : this.ctx.options.mode === "ai"
            ? "…"
            : "",
    );
  }
  update(dt: number) {
    if (this.paused) return;
    this.elapsed += dt;
    this.refreshTurn();
    if (
      !this.board.winner &&
      this.ctx.options.mode === "ai" &&
      this.board.turn === 2
    ) {
      this.thinkFor += dt;
      if (this.thinkFor > Math.max(0.75, this.ai!.delay))
        this.place(this.ai!.choose(this.board));
    }
    const g = this.graphics;
    g.clear();
    this.board.cells.forEach((p, i) => {
      if (!p) return;
      this.ages[i] += dt;
      const t = Math.min(1, this.ages[i] / 0.2),
        s = 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
      symbol(
        g,
        102 + (i % 3) * 108,
        273 + Math.floor(i / 3) * 108,
        p,
        25,
        Math.max(0.01, s),
      );
    });
    if (this.board.winner) {
      this.endAge += dt;
      if (this.board.line) {
        const a = this.board.line[0],
          b = this.board.line[2],
          t = Math.min(1, this.endAge / 0.35);
        const x = 102 + (a % 3) * 108,
          y = 273 + Math.floor(a / 3) * 108;
        g.lineStyle(8, theme.ink, 0.65).lineBetween(
          x,
          y,
          x + ((b % 3) - (a % 3)) * 108 * t,
          y + (Math.floor(b / 3) - Math.floor(a / 3)) * 108 * t,
        );
      }
      if (this.endAge > 0.7 && !this.reported) {
        this.reported = true;
        const winner = this.board.winner;
        this.ctx.setScore(winner === 1 ? 1 : 0, winner === 2 ? 1 : 0);
        this.ctx.finish({
          winner,
          scores: winner === 1 ? [1, 0] : winner === 2 ? [0, 1] : [0, 0],
        });
      }
    } else {
      symbol(g, 210, 593, this.board.turn, 15);
    }
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.bg.destroy();
    this.graphics.destroy();
    this.turn.destroy();
  }
  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      cells: [...this.board.cells],
      turn: this.board.turn,
      winner: this.board.winner,
    };
  }
}
