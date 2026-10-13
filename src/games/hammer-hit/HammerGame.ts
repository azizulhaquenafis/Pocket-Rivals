import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label, circle } from "../../shared/components/drawing";
import { HammerMatch } from "./Rules";
import { HammerAI } from "./AI";
export class HammerGame implements MiniGame {
  private ctx!: GameContext;
  private model = new HammerMatch();
  private ai?: HammerAI;
  private g!: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.Text[] = [];
  private paused = false;
  private finishAge = 0;
  private reported = false;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.texts = [
      label(ctx.scene, 210, 192, "", 19),
      label(ctx.scene, 210, 570, "", 19),
      label(ctx.scene, 210, 375, "THREE STRIKES", 22),
    ];
    if (ctx.options.mode === "ai")
      this.ai = new HammerAI(ctx.options.difficulty);
    ctx.input.tap((x, y) => {
      if (x > 30 && x < 390 && y > 120 && y < 660) this.hit(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "Enter"], (code) =>
      this.hit(code === "Space" ? 0 : 1),
    );
    ctx.setScore(0, 0);
    ctx.setHint("TAP THE CENTER · BEST AVERAGE OF THREE");
    ctx.audio.play("start");
  }
  private hit(p: 0 | 1, ai = false) {
    if (this.paused || (this.ai && p === 1 && !ai)) return;
    const score = this.model.hit(p);
    if (score !== null) {
      this.ctx.audio.play(
        score >= 99 ? "perfect" : "metal",
        0.25 + score * 0.0075,
      );
      const t = this.model.totals;
      this.ctx.setScore(t[0], t[1]);
    }
  }
  update(dt: number) {
    if (this.paused) return;
    this.model.update(dt);
    if (this.ai?.update(this.model)) this.hit(1, true);
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xf7d6ad, 4);
    for (const p of [0, 1] as const) {
      const cy = p === 1 ? 270 : 490,
        color = p === 0 ? theme.orange : theme.blue,
        done = this.model.scores[p].length === 3,
        hold = this.model.cooldowns[p] > 0 && this.model.scores[p].length > 0,
        pos = hold || done ? this.model.locked[p] : this.model.position(p);
      rounded(g, 50, cy - 24, 320, 48, 18, theme.white, 3);
      g.fillStyle(color, 0.25).fillRoundedRect(180, cy - 23, 60, 46, 10);
      g.lineStyle(3, theme.ink).lineBetween(210, cy - 29, 210, cy + 29);
      circle(g, 210 + pos * 145, cy, 11, color, 3);
      for (let i = 0; i < 3; i++)
        circle(
          g,
          180 + i * 30,
          cy + (p === 1 ? 50 : -50),
          8,
          this.model.scores[p][i] === undefined ? theme.paper : color,
          2,
        );
      const score = this.model.scores[p],
        text = this.texts[p === 1 ? 0 : 1];
      text
        .setText(
          `${score.length}/3  ·  ${score.join(" + ") || "TAP TO STRIKE"}${done ? `\nAVERAGE ${(this.model.totals[p] / 3).toFixed(2)}` : ""}`,
        )
        .setRotation(p === 1 && !this.ai ? Math.PI : 0)
        .setDepth(1);
    }
    this.texts[2].setDepth(1);
    if (this.model.done) {
      this.finishAge += dt;
      this.texts[2].setText("AVERAGE WINS");
      if (this.finishAge > 1.4 && !this.reported) {
        this.reported = true;
        this.ctx.finish({
          winner: this.model.winner!,
          scores: this.model.averages,
        });
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
    this.texts.forEach((t) => t.destroy());
  }
  snapshot() {
    return {
      scores: this.model.scores.map((s) => [...s]),
      totals: this.model.totals,
      averages: this.model.averages,
      clocks: [...this.model.clocks],
      positions: [this.model.position(0), this.model.position(1)],
      cooldowns: [...this.model.cooldowns],
      winner: this.model.winner,
    };
  }
}
