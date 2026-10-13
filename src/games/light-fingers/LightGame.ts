import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label, circle } from "../../shared/components/drawing";
import { LightMatch } from "./Rules";
import { LightAI } from "./AI";
export class LightGame implements MiniGame {
  private ctx!: GameContext;
  private m = new LightMatch();
  private ai?: LightAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private prompts: Phaser.GameObjects.Text[] = [];
  private paused = false;
  private serial = 0;
  private reported = false;
  private finishAge = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 438, "", 17);
    this.prompts = [
      label(ctx.scene, 210, 575, "ORANGE · TAP", 18),
      label(ctx.scene, 210, 187, "BLUE · TAP", 18).setRotation(
        ctx.options.mode === "local" ? Math.PI : 0,
      ),
    ];
    if (ctx.options.mode === "ai")
      this.ai = new LightAI(ctx.options.difficulty);
    ctx.input.tap((x, y) => {
      if (x > 24 && x < 396 && y > 112 && y < 650) this.tap(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "Enter"], (code) =>
      this.tap(code === "Space" ? 0 : 1),
    );
    ctx.setScore(0, 0);
    ctx.setHint("EARLY TAP = YOUR RIVAL’S POINT · FIRST TO 5");
    ctx.audio.play("start");
  }
  private tap(p: 0 | 1) {
    if (!this.paused && !(p === 1 && this.ai)) this.m.tap(p);
  }
  update(dt: number) {
    if (this.paused) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    if (this.serial !== this.m.serial) {
      this.serial = this.m.serial;
      this.ctx.setScore(...this.m.scores);
      this.ctx.audio.play(this.m.message.includes("SOON") ? "fail" : "capture");
    }
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xd4e7d8, 4);
    rounded(g, 60, 140, 300, 95, 24, theme.blue, 3);
    rounded(g, 60, 525, 300, 95, 24, theme.orange, 3);
    const active = this.m.phase === "signal" || this.m.phase === "active";
    if (active) {
      g.fillStyle(theme.blue).fillPoints(
        [
          { x: 158, y: 321 },
          { x: 262, y: 321 },
          { x: 286, y: 349 },
          { x: 210, y: 412 },
          { x: 134, y: 349 },
        ],
        true,
      );
      g.lineStyle(5, theme.ink).strokePoints(
        [
          { x: 158, y: 321 },
          { x: 262, y: 321 },
          { x: 286, y: 349 },
          { x: 210, y: 412 },
          { x: 134, y: 349 },
        ],
        true,
      );
      g.lineStyle(3, theme.white)
        .lineBetween(134, 349, 286, 349)
        .lineBetween(183, 321, 166, 349)
        .lineBetween(166, 349, 210, 412)
        .lineBetween(236, 349, 210, 412)
        .lineBetween(236, 349, 220, 321);
    } else {
      circle(g, 210, 365, 46, theme.paper, 4);
      g.lineStyle(4, theme.ink).lineBetween(194, 365, 226, 365);
    }
    this.text.setText(this.m.message).setDepth(1);
    this.prompts.forEach((p) => p.setDepth(1));
    if (this.m.phase === "signal") {
      this.ctx.audio.play("countdown");
      this.m.presentSignal();
    }
    if (this.m.winner) {
      this.finishAge += dt;
      if (this.finishAge > 0.75 && !this.reported) {
        this.reported = true;
        this.ctx.finish({ winner: this.m.winner, scores: this.m.scores });
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
    this.prompts.forEach((p) => p.destroy());
  }
  snapshot() {
    return {
      phase: this.m.phase,
      scores: [...this.m.scores],
      time: this.m.time,
      signalAt: this.m.signalAt,
      round: this.m.serial,
      winner: this.m.winner,
    };
  }
}
