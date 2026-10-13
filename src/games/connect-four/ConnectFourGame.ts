import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { circle, rounded, label } from "../../shared/components/drawing";
import { WorkerTask } from "../../shared/utilities/WorkerTask";
import { ConnectFourBoard } from "./ConnectFourRules";
import type { SearchResult } from "./ConnectFourAI";
export class ConnectFourGame implements MiniGame {
  private ctx!: GameContext;
  private board = new ConnectFourBoard();
  private g!: Phaser.GameObjects.Graphics;
  private heading!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private ai?: WorkerTask<
    { state: unknown; difficulty: GameContext["options"]["difficulty"] },
    SearchResult
  >;
  private pending = false;
  private paused = false;
  private disposed = false;
  private generation = 0;
  private age = 1;
  private last = -1;
  private thinking = 0;
  private reported = false;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.board = ConnectFourBoard.restore(ctx.restoredState);
    this.g = ctx.scene.add.graphics();
    this.heading = label(ctx.scene, 210, 155, "", 22);
    this.hint = label(ctx.scene, 210, 596, "TAP A COLUMN · CONNECT FOUR", 12);
    ctx.setHint("FOUR IN A ROW. ONE LITTLE VICTORY.");
    ctx.setScore(0, 0);
    if (ctx.options.mode === "ai")
      this.ai = new WorkerTask(
        () =>
          new Worker(new URL("./ai.worker.ts", import.meta.url), {
            type: "module",
          }),
        ctx.reportAI,
      );
    ctx.input.tap((x, y) => {
      if (
        this.paused ||
        this.age < 0.32 ||
        this.board.winner ||
        (this.ai && this.board.turn === 2) ||
        x < 35 ||
        x >= 385 ||
        y < 200 ||
        y > 560
      )
        return;
      this.place(Math.floor((x - 35) / 50));
    });
  }
  private place(c: number) {
    const at = this.board.drop(c);
    if (at < 0) return;
    this.last = at;
    this.age = 0;
    this.thinking = 0;
    this.ctx.saveState(this.board.save());
    this.ctx.audio.play("tap");
  }
  update(dt: number) {
    if (this.paused) return;
    this.age += dt;
    if (
      this.ai &&
      !this.board.winner &&
      this.board.turn === 2 &&
      !this.pending &&
      this.age > 0.32
    ) {
      this.thinking += dt;
      if (this.thinking > 0.2) {
        this.pending = true;
        const generation = this.generation;
        void this.ai
          .run({
            state: this.board.save(),
            difficulty: this.ctx.options.difficulty,
          })
          .then((result) => {
            if (this.disposed || generation !== this.generation) return;
            this.pending = false;
            if (!this.paused)
              this.place(result?.column ?? this.board.legal()[0]);
          });
      }
    }
    this.heading.setText(
      this.board.winner
        ? this.board.winner === "draw"
          ? "A PERFECT STANDOFF."
          : "FOUR OF A KIND!"
        : this.board.turn === 1
          ? "ORANGE’S TURN"
          : this.ai
            ? "BLUE IS THINKING…"
            : "BLUE’S TURN",
    );
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, theme.ice, 4);
    rounded(g, 28, 210, 364, 332, 18, 0x82b4c3, 4);
    for (let i = 0; i < 42; i++) {
      const x = 60 + (i % 7) * 50,
        y = 237 + Math.floor(i / 7) * 50,
        mark = this.board.cells[i];
      circle(g, x, y, 19, theme.paper, 3);
      if (mark) {
        const t = i === this.last ? Math.min(1, this.age / 0.3) : 1;
        const yy = 182 + (y - 182) * (1 - (1 - t) ** 2);
        circle(g, x, yy, 18, mark === 1 ? theme.orange : theme.blue, 3);
        g.lineStyle(2, theme.white, 0.55).strokeCircle(x, yy, 11);
        if (this.board.line?.includes(i) && this.age > 0.3)
          g.lineStyle(3, theme.white).strokeCircle(x, y, 14);
      }
    }
    if (!this.board.winner)
      for (const c of this.board.legal()) {
        g.fillStyle(
          this.board.turn === 1 ? theme.orange : theme.blue,
        ).fillTriangle(55 + c * 50, 193, 65 + c * 50, 193, 60 + c * 50, 199);
      }
    // Text above the graphics, retained rather than allocated each frame.
    this.heading.setDepth(1);
    this.hint.setDepth(1);
    if (this.board.winner && this.age > 0.9 && !this.reported) {
      this.reported = true;
      const w = this.board.winner;
      this.ctx.finish({
        winner: w,
        scores: w === 1 ? [1, 0] : w === 2 ? [0, 1] : [0, 0],
      });
    }
  }
  pause() {
    this.paused = true;
    this.generation++;
    this.pending = false;
    this.ai?.cancel();
  }
  resume() {
    this.paused = false;
    this.thinking = 0;
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    this.ai?.cancel();
    this.g.destroy();
    this.heading.destroy();
    this.hint.destroy();
  }
  snapshot() {
    return {
      cells: [...this.board.cells],
      turn: this.board.turn,
      winner: this.board.winner,
      moves: this.board.history.length,
      pending: this.pending,
    };
  }
}
