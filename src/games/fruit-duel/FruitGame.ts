import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FruitMatch } from "./Rules";
import { FruitAI } from "./AI";
import { fruit } from "./FruitArt";
export class FruitGame implements MiniGame {
  private ctx!: GameContext;
  private m = new FruitMatch();
  private ai?: FruitAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private labels: Phaser.GameObjects.Text[] = [];
  private paused = false;
  private round = 0;
  private done = 0;
  private reported = false;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 507, "", 15);
    this.labels = [
      label(ctx.scene, 210, 178, "BLUE · TAP", 18).setRotation(
        ctx.options.mode === "local" ? Math.PI : 0,
      ),
      label(ctx.scene, 210, 587, "ORANGE · TAP", 18),
      label(ctx.scene, 210, 257, "TARGET", 12),
    ];
    if (ctx.options.mode === "ai")
      this.ai = new FruitAI(ctx.options.difficulty);
    if (this.ai)
      this.m = new FruitMatch(
        new MatchRandom(mixSeed(this.ai.personality.seed, 42)).next,
      );
    ctx.input.tap((x, y) => {
      if (x > 24 && x < 396 && y > 112 && y < 650) this.tap(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "Enter"], (code) =>
      this.tap(code === "Space" ? 0 : 1),
    );
    ctx.setScore(0, 0);
    ctx.setHint("MATCH THE TARGET · FIRST TO 10");
    ctx.audio.play("start");
  }
  private tap(p: 0 | 1) {
    if (!this.paused && !(p === 1 && this.ai)) this.m.tap(p);
  }
  update(dt: number) {
    if (this.paused) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    if (this.round !== this.m.round) {
      this.round = this.m.round;
      this.ctx.setScore(...this.m.scores);
      this.ctx.audio.play(
        this.m.message.startsWith("WRONG") ? "fail" : "capture",
      );
    }
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xf5dfcf, 4);
    rounded(g, 60, 137, 300, 84, 24, theme.blue, 3);
    rounded(g, 60, 545, 300, 84, 24, theme.orange, 3);
    rounded(g, 150, 241, 120, 112, 20, theme.white, 3);
    fruit(g, this.m.target, 210, 310, 26);
    if (this.m.current >= 0) fruit(g, this.m.current, 210, 430, 46);
    else {
      g.lineStyle(3, theme.ink, 0.25).strokeCircle(210, 430, 40);
    }
    this.labels.forEach((t) => t.setDepth(1));
    this.text.setText(this.m.message).setDepth(1);
    if (this.m.phase === "show") {
      this.m.present();
      this.ctx.audio.play("soft");
    }
    if (this.m.winner) {
      this.done += dt;
      if (this.done > 0.8 && !this.reported) {
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
    this.labels.forEach((t) => t.destroy());
  }
  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      phase: this.m.phase,
      target: this.m.target,
      current: this.m.current,
      time: this.m.time,
      round: this.m.round,
      scores: [...this.m.scores],
      winner: this.m.winner,
    };
  }
}
