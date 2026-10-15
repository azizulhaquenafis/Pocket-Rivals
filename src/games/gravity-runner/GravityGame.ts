import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { GravityMatch } from "./Rules";
import { GravityAI } from "./AI";
export class GravityGame implements MiniGame {
  private ctx!: GameContext;
  private m = new GravityMatch(freshSeed());
  private ai?: GravityAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private fixed = new FixedStep();
  private paused = false;
  private done = false;
  private score = "";
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 381, "", 15);
    if (ctx.options.mode === "ai") {
      this.ai = new GravityAI(ctx.options.difficulty);
      this.m = new GravityMatch(this.ai.personality.seed);
    }
    ctx.input.tap((x, y) => {
      if (x >= 24 && x <= 396 && y >= 112 && y <= 650)
        this.flip(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "KeyA"], () => this.flip(0));
    ctx.input.press(["Enter", "KeyL"], () => this.flip(1));
    ctx.setHint("");
    this.draw();
  }
  private flip(p: 0 | 1, ai = false) {
    if (this.paused || this.done || (p === 1 && this.ai && !ai)) return;
    if (this.m.flip(p)) this.ctx.audio.play("soft");
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      if (this.ai?.update(this.m)) this.flip(1, true);
      this.m.step(h);
    });
    if (this.m.scores.join() !== this.score) {
      if (this.score) this.ctx.audio.play("goal");
      this.score = this.m.scores.join();
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
    rounded(g, 24, 112, 372, 538, 20, 0xd9d2e9, 4);
    for (const i of [0, 1] as const) {
      const top = i === 0 ? 428 : 158,
        p = this.m.players[i],
        color = i === 0 ? theme.orange : theme.blue;
      rounded(g, 36, top - 12, 348, 194, 8, theme.white, 2);
      for (const side of [-1, 1] as const) {
        const y = top + (side === 1 ? 168 : -7);
        let edge = 36;
        for (const gap of this.m.gaps.filter(
          (v) =>
            v.side === side &&
            v.x + v.width > this.m.distance - 64 &&
            v.x < this.m.distance + 284,
        )) {
          const left = Math.max(36, 100 + gap.x - this.m.distance),
            right = Math.min(384, 100 + gap.x + gap.width - this.m.distance);
          if (left > edge)
            g.fillStyle(0x8d86a1).fillRect(edge, y, left - edge, 9);
          g.fillStyle(theme.peach).fillRect(left, y, right - left, 9);
          edge = right;
        }
        if (edge < 384) g.fillStyle(0x8d86a1).fillRect(edge, y, 384 - edge, 9);
      }
      rounded(
        g,
        89,
        top + Math.max(-4, Math.min(174, p.y)) - 10,
        22,
        20,
        6,
        p.alive ? color : theme.muted,
        3,
      );
      g.fillStyle(theme.ink).fillCircle(105, top + p.y - 3, 2);
      g.lineStyle(2, color).lineBetween(
        120,
        top + p.y,
        120,
        top + p.y + p.gravity * 17,
      );
    }
    this.text.setText(
      this.m.between
        ? "NEXT RUN…"
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
      gaps: this.m.gaps.slice(0, 12),
      distance: this.m.distance,
      scores: this.m.scores,
      round: this.m.round,
      between: this.m.between,
      winner: this.m.winner,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
