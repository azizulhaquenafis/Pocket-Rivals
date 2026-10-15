import { turnBackground } from "../../shared/components/TurnView";
import {
  MatchRandom,
  restoredAISeed,
  replayMode,
} from "../../shared/ai/MatchRandom";
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
    {
      state: unknown;
      difficulty: GameContext["options"]["difficulty"];
      seed: number;
      replay: boolean;
    },
    ReturnType<typeof chooseEdge>
  >;
  private personality!: MatchRandom;
  private pending = false;
  private generation = 0;
  private paused = false;
  private age = 1;
  private flashAge = 1;
  private aiDelay = 0;
  private last = -1;
  private selected = 0;
  private reported = false;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.personality = new MatchRandom(restoredAISeed(ctx.restoredState));
    const variant = ctx.options.variant;
    const size = variant === "6x6" ? 6 : variant === "5x5" ? 5 : 4;
    this.board = DotsBoard.restore(ctx.restoredState, size);
    this.aiDelay =
      ctx.options.mode === "ai" && this.board.turn === 2
        ? replayMode()
          ? 0.1
          : 1.0
        : 0;
    this.g = ctx.scene.add.graphics();
    this.title = label(
      ctx.scene,
      210,
      155,
      `${this.board.size}×${this.board.size} · ${this.board.totalBoxes} BOXES`,
      23,
    );
    this.detail = label(ctx.scene, 210, 602, "TAP BETWEEN TWO DOTS", 13);
    ctx.setHint("");
    ctx.setScore(...this.board.scores);
    if (ctx.options.mode === "ai")
      this.ai = new WorkerTask(
        () =>
          new Worker(new URL("./ai.worker.ts", import.meta.url), {
            type: "module",
          }),
        ctx.reportAI,
      );
    ctx.input.tap((x, y) => this.place(pickEdge(x, y, this.board.size)));
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
      this.age < 0.12 ||
      this.board.winner ||
      (!ai && this.ai && this.board.turn === 2)
    )
      return;
    const gain = this.board.play(edge);
    if (gain < 0) return;
    this.last = edge;
    this.flashAge = 0;
    this.age = 0;
    this.ctx.setScore(...this.board.scores);
    this.ctx.saveState({
      ...this.board.save(),
      ai: this.personality.snapshot(),
    });
    this.ctx.audio.play(gain > 1 ? "perfect" : gain ? "capture" : "tap");
    this.detail.setText(
      gain
        ? `+${gain} BOX${gain === 1 ? "" : "ES"} · PLAY AGAIN`
        : "TAP BETWEEN TWO DOTS",
    );
    if (this.ai && !this.board.winner && this.board.turn === 2) {
      this.aiDelay = replayMode()
        ? 0.1
        : gain > 0
          ? 0.7 + this.personality.next() * 0.15
          : 1.1 + this.personality.next() * 0.35;
    }
  }
  update(dt: number) {
    if (this.paused) return;
    this.age += dt;
    this.flashAge += dt;
    if (this.aiDelay > 0) this.aiDelay -= dt;
    if (
      this.ai &&
      !this.pending &&
      !this.board.winner &&
      this.board.turn === 2 &&
      this.aiDelay <= 0
    ) {
      this.pending = true;
      const token = this.generation;
      void this.ai
        .run({
          state: this.board.save(),
          difficulty: this.ctx.options.difficulty,
          seed: this.personality.seed,
          replay: replayMode(),
        })
        .then((r) => {
          if (token !== this.generation) return;
          this.pending = false;
          this.place(r?.edge ?? this.board.legal()[0], true);
        });
    }
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, turnBackground(this.board.turn), 4);

    const size = this.board.size;
    const spacing = 300 / size;
    const pad = size === 6 ? 4 : size === 5 ? 5 : 6;
    const boxSize = spacing - 2 * pad;
    const cornerRadius = size === 6 ? 6 : size === 5 ? 8 : 10;

    if (this.age < 0.9 && !this.board.history.length) {
      const alpha = Math.sin((this.age / 0.9) * Math.PI) * 0.15;
      g.fillStyle(theme.ink, alpha).fillRoundedRect(56, 236, 308, 308, 16);
    }

    this.title
      .setText(
        this.board.winner
          ? "BOXED UP!"
          : this.age < 1.0 && !this.board.history.length
            ? `${size}×${size} · ${this.board.totalBoxes} BOXES`
            : this.board.turn === 1
              ? ""
              : this.ai
                ? "…"
                : "",
      )
      .setDepth(1);
    this.detail.setDepth(1).setFontSize(11);
    this.title.setFontSize(12);

    for (let i = 0; i < this.board.totalBoxes; i++)
      if (this.board.owners[i]) {
        const p = this.board.owners[i];
        const row = Math.floor(i / size);
        const col = i % size;
        g.fillStyle(p === 1 ? theme.orange : theme.blue, 0.7).fillRoundedRect(
          60 + col * spacing + pad,
          240 + row * spacing + pad,
          boxSize,
          boxSize,
          cornerRadius,
        );
      }

    const edgeWidth = size === 6 ? 5 : size === 5 ? 6 : 7;
    const unownedWidth = size === 6 ? 2.5 : 3;

    for (let e = 0; e < this.board.totalEdges; e++) {
      const p = edgeEnds(e, size),
        owner = this.board.edges[e];
      g.lineStyle(
        owner ? edgeWidth : e === this.selected ? edgeWidth - 1 : unownedWidth,
        owner ? (owner === 1 ? theme.orange : theme.blue) : theme.ink,
        owner ? 1 : e === this.selected ? 0.35 : 0.12,
      ).lineBetween(p.x, p.y, p.x2, p.y2);
      if (e === this.last && this.flashAge < 0.35)
        g.lineStyle(2, theme.white).lineBetween(p.x, p.y, p.x2, p.y2);
    }

    const dotRadius = size === 6 ? 4.5 : size === 5 ? 5.2 : 6;
    for (let r = 0; r <= size; r++)
      for (let c = 0; c <= size; c++)
        circle(g, 60 + c * spacing, 240 + r * spacing, dotRadius, theme.ink, 0);

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
    this.aiDelay = 0;
  }
  resume() {
    this.paused = false;
    this.age = 1;
    this.aiDelay = this.ai && this.board.turn === 2 ? 0.6 : 0;
  }
  dispose() {
    this.pause();
    this.g.destroy();
    this.title.destroy();
    this.detail.destroy();
  }
  snapshot() {
    return {
      ai: this.ai ? this.personality.snapshot() : undefined,
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
