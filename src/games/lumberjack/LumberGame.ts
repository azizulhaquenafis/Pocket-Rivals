import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { LumberMatch, type Side } from "./Rules";
import { forest } from "./LumberArt";
import { LumberAI } from "./AI";
export class LumberGame implements MiniGame {
  private ctx!: GameContext;
  private m = new LumberMatch(crypto.getRandomValues(new Uint32Array(1))[0]);
  private ai?: LumberAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private paused = false;
  private done = 0;
  private reported = false;
  private previousScores = "";
  private scroll = [0, 0];
  private swing = [0, 0];
  private sides = [-1, 1];
  private round = 1;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 381, "", 11);
    if (ctx.options.mode === "ai")
      this.ai = new LumberAI(ctx.options.difficulty);
    if (this.ai) this.m = new LumberMatch(this.ai.personality.seed);
    ctx.input.tap((x, y) => {
      if (x < 30 || x > 390 || y < 120 || y > 650) return;
      const p = y < 380 ? 1 : 0;
      this.chop(
        p,
        ((x < 210 ? -1 : 1) *
          (p === 1 && ctx.options.mode === "local" ? -1 : 1)) as Side,
      );
    });
    ctx.input.press(["KeyA", "KeyD", "ArrowLeft", "ArrowRight"], (key) =>
      this.chop(
        key.startsWith("Key") ? 0 : 1,
        key === "KeyA" || key === "ArrowLeft" ? -1 : 1,
      ),
    );
    ctx.setHint("");
    ctx.audio.play("start");
  }
  private chop(p: 0 | 1, side: Side, ai = false) {
    if (this.paused || (p === 1 && this.ai && !ai)) return;
    const result = this.m.chop(p, side);
    if (result !== null) {
      this.ctx.audio.play(result ? "wood" : "fail");
      this.swing[p] = 1;
      if (result) this.scroll[p] = Math.min(28, this.scroll[p] + 28);
    }
  }
  update(dt: number) {
    if (this.paused) return;
    this.m.update(dt);
    const side = this.ai?.update(dt, this.m);
    if (side) this.chop(1, side, true);
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xdbe4c2, 4);
    // Two clear sky panels separated by a reserved round strip.
    rounded(g, 30, 118, 360, 250, 16, 0xd8ece4, 0);
    rounded(g, 30, 394, 360, 250, 16, 0xe3ead0, 0);
    if (this.round !== this.m.round) {
      this.round = this.m.round;
      this.scroll = [0, 0];
      this.swing = [0, 0];
    }
    for (const p of [0, 1] as const) {
      this.scroll[p] *= Math.exp(-dt * 26);
      this.swing[p] = Math.max(0, this.swing[p] - dt * 7);
      this.sides[p] = this.m.players[p].side;
      forest(
        g,
        this.m,
        p,
        p === 1 && !this.ai,
        this.scroll[p],
        this.swing[p],
        this.sides[p],
      );
    }
    const scores = this.m.totals.map(
      (s, i) => s + (this.m.phase === "playing" ? this.m.players[i].score : 0),
    ) as [number, number];
    if (scores.join(",") !== this.previousScores) {
      this.previousScores = scores.join(",");
      this.ctx.setScore(...scores);
    }
    this.text
      .setDepth(1)
      .setText(
        this.m.phase === "between"
          ? "NEXT ROUND"
          : this.m.round > 3
            ? "SUDDEN DEATH"
            : `${this.m.round} / 3`,
      );
    if (this.m.winner) {
      this.done += dt;
      if (this.done > 0.8 && !this.reported) {
        this.reported = true;
        this.ctx.finish({ winner: this.m.winner, scores: this.m.totals });
      }
    }
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.g.destroy();
    this.text.destroy();
  }
  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      phase: this.m.phase,
      round: this.m.round,
      players: this.m.players.map((p) => ({ ...p })),
      pattern: [...this.m.pattern.slice(0, 40)],
      totals: [...this.m.totals],
      time: this.m.time,
      winner: this.m.winner,
    };
  }
}
