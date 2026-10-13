import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label, circle } from "../../shared/components/drawing";
import { WorkerTask } from "../../shared/utilities/WorkerTask";
import { DotsBoard, edgeEnds, pickEdge } from "./Rules";
import type { chooseEdge } from "./AI";
export class DotsGame implements MiniGame {
  private ctx!: GameContext;
  private board = new DotsBoard();
  private g!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private detail!: Phaser.GameObjects.Text;
  private ai?: WorkerTask<
    { state: unknown; difficulty: GameContext["options"]["difficulty"] },
    ReturnType<typeof chooseEdge>
  >;
  private pending = false;
  private generation = 0;
  private paused = false;
  private age = 1;
  private last = -1;
  private selected = 0;
  private reported = false;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.board = DotsBoard.restore(ctx.restoredState);
    this.g = ctx.scene.add.graphics();
    this.title = label(ctx.scene, 210, 155, "", 23);
    this.detail = label(ctx.scene, 210, 602, "TAP BETWEEN TWO DOTS", 13);
    ctx.setHint("CLOSE A BOX. TAKE ANOTHER TURN.");
    ctx.setScore(...this.board.scores);
    if (ctx.options.mode === "ai")
      this.ai = new WorkerTask(
        () =>
          new Worker(new URL("./ai.worker.ts", import.meta.url), {
            type: "module",
          }),
        ctx.reportAI,
      );
    ctx.input.tap((x, y) => this.place(pickEdge(x, y)));
    ctx.input.press(
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "Space"],
      (code) => {
        if (code === "Enter" || code === "Space") this.place(this.selected);
        else {
          const legal = this.board.legal(),
            i = legal.indexOf(this.selected),
            d = code === "ArrowLeft" || code === "ArrowUp" ? -1 : 1;
          this.selected = legal[(i + d + legal.length) % legal.length] ?? 0;
        }
      },
    );
  }
  private place(edge: number, ai = false) {
    if (
      this.paused ||
      this.age < 0.16 ||
      this.board.winner ||
      (!ai && this.ai && this.board.turn === 2)
    )
      return;
    const gain = this.board.play(edge);
    if (gain < 0) return;
    this.last = edge;
    this.age = 0;
    this.ctx.setScore(...this.board.scores);
    this.ctx.saveState(this.board.save());
    this.ctx.audio.play(gain > 1 ? "perfect" : gain ? "capture" : "tap");
    this.detail.setText(
      gain
        ? `+${gain} BOX${gain === 1 ? "" : "ES"} · PLAY AGAIN`
        : "TAP BETWEEN TWO DOTS",
    );
  }
  update(dt: number) {
    if (this.paused) return;
    this.age += dt;
    if (
      this.ai &&
      !this.pending &&
      !this.board.winner &&
      this.board.turn === 2 &&
      this.age > 0.45
    ) {
      this.pending = true;
      const token = this.generation;
      void this.ai
        .run({
          state: this.board.save(),
          difficulty: this.ctx.options.difficulty,
        })
        .then((r) => {
          if (token !== this.generation) return;
          this.pending = false;
          this.place(r?.edge ?? this.board.legal()[0], true);
        });
    }
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xe7ddef, 4);
    this.title
      .setText(
        this.board.winner
          ? "BOXED UP!"
          : this.board.turn === 1
            ? "ORANGE’S TURN"
            : this.ai
              ? "BLUE IS THINKING…"
              : "BLUE’S TURN",
      )
      .setDepth(1);
    this.detail.setDepth(1);
    for (let i = 0; i < 16; i++)
      if (this.board.owners[i]) {
        const p = this.board.owners[i];
        g.fillStyle(p === 1 ? theme.orange : theme.blue, 0.7).fillRoundedRect(
          66 + (i % 4) * 75,
          246 + Math.floor(i / 4) * 75,
          63,
          63,
          10,
        );
      }
    for (let e = 0; e < 40; e++) {
      const p = edgeEnds(e),
        owner = this.board.edges[e];
      g.lineStyle(
        owner ? 7 : e === this.selected ? 5 : 3,
        owner ? (owner === 1 ? theme.orange : theme.blue) : theme.ink,
        owner ? 1 : e === this.selected ? 0.35 : 0.12,
      ).lineBetween(p.x, p.y, p.x2, p.y2);
      if (e === this.last && this.age < 0.35)
        g.lineStyle(2, theme.white).lineBetween(p.x, p.y, p.x2, p.y2);
    }
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        circle(g, 60 + c * 75, 240 + r * 75, 6, theme.ink, 0);
    if (this.board.winner && this.age > 0.7 && !this.reported) {
      this.reported = true;
      this.ctx.finish({ winner: this.board.winner, scores: this.board.scores });
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
    this.age = 0;
  }
  dispose() {
    this.pause();
    this.g.destroy();
    this.title.destroy();
    this.detail.destroy();
  }
  snapshot() {
    return {
      ...this.board.save(),
      edges: [...this.board.edges],
      owners: [...this.board.owners],
      turn: this.board.turn,
      winner: this.board.winner,
      scores: [...this.board.scores],
      pending: this.pending,
    };
  }
}
