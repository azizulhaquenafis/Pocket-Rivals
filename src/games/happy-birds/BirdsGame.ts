import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { BirdsMatch } from "./Rules";
import { BirdsAI } from "./AI";
export class BirdsGame implements MiniGame {
  private ctx!: GameContext;
  private m = new BirdsMatch(freshSeed());
  private ai?: BirdsAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private fixed = new FixedStep();
  private paused = false;
  private done = false;
  private scores = "";
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 381, "", 16);
    if (ctx.options.mode === "ai") {
      this.ai = new BirdsAI(ctx.options.difficulty);
      this.m = new BirdsMatch(this.ai.personality.seed);
    }
    ctx.input.tap((x, y) => {
      if (x >= 24 && x <= 396 && y >= 112 && y <= 650)
        this.flap(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "KeyA"], () => this.flap(0));
    ctx.input.press(["Enter", "KeyL"], () => this.flap(1));
    ctx.setHint("");
    this.draw();
  }
  private flap(p: 0 | 1, ai = false) {
    if (this.paused || this.done || (p === 1 && this.ai && !ai)) return;
    if (this.m.flap(p)) this.ctx.audio.play("soft");
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      if (this.ai?.update(h, this.m)) this.flap(1, true);
      this.m.step(h);
    });
    if (this.m.scores.join() !== this.scores) {
      if (this.scores) this.ctx.audio.play("goal");
      this.scores = this.m.scores.join();
      this.ctx.setScore(...this.m.scores);
    }
    this.draw();
    if (this.m.winner) {
      this.done = true;
      this.ctx.finish({ winner: this.m.winner, scores: this.m.scores });
    }
  }
  private draw() {
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, theme.ice, 4);
    for (const i of [0, 1] as const) {
      const top = i === 0 ? 428 : 158,
        p = this.m.players[i],
        color = i === 0 ? theme.orange : theme.blue;
      rounded(g, 36, top - 5, 348, 180, 8, theme.white, 2);
      for (let x = 38; x < 380; x += 17) {
        g.fillStyle(0x9ebcc2).fillTriangle(x, top, x + 8, top + 7, x + 16, top);
        g.fillTriangle(x, top + 170, x + 8, top + 163, x + 16, top + 170);
      }
      for (const gate of this.m.gates) {
        const x = 100 + gate.x - this.m.distance;
        if (x < 15 || x > 384) continue;
        const left = Math.max(36, x),
          width = Math.max(0, Math.min(384, x + 24) - left);
        if (!width) continue;
        g.fillStyle(0xa9c598).fillRect(
          left,
          top,
          width,
          gate.center - gate.gap / 2,
        );
        g.fillRect(
          left,
          top + gate.center + gate.gap / 2,
          width,
          170 - gate.center - gate.gap / 2,
        );
        g.lineStyle(3, theme.ink)
          .strokeRect(left, top, width, gate.center - gate.gap / 2)
          .strokeRect(
            left,
            top + gate.center + gate.gap / 2,
            width,
            170 - gate.center - gate.gap / 2,
          );
      }
      const y = top + Math.max(10, Math.min(160, p.y));
      g.fillStyle(p.alive ? color : theme.muted).fillCircle(100, y, 10);
      g.lineStyle(3, theme.ink).strokeCircle(100, y, 10);
      g.fillStyle(theme.white).fillEllipse(95, y + (p.vy < 0 ? -2 : 4), 12, 7);
      g.fillStyle(theme.ink).fillCircle(104, y - 4, 2);
      g.fillStyle(color).fillTriangle(110, y - 2, 119, y + 2, 110, y + 5);
    }
    this.text.setText(
      this.m.between
        ? "READY TO FLY…"
        : `Round ${this.m.round}`,
    );
  }
  pause() {
    this.paused = true;
    this.fixed.reset();
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.done = true;
    this.g.destroy();
    this.text.destroy();
  }
  snapshot() {
    return {
      players: this.m.players,
      gates: this.m.gates.slice(0, 8),
      distance: this.m.distance,
      scores: this.m.scores,
      round: this.m.round,
      between: this.m.between,
      winner: this.m.winner,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
