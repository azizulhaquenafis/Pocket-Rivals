import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { FlappyMatch, projectedLanding } from "./Rules";
import { FlappyAI } from "./AI";
export class FlappyGame implements MiniGame {
  private ctx!: GameContext;
  private m = new FlappyMatch(freshSeed());
  private ai?: FlappyAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private fixed = new FixedStep();
  private paused = false;
  private done = false;
  private score = "";
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 381, "Jump when the floor mark glows", 12);
    if (ctx.options.mode === "ai") {
      this.ai = new FlappyAI(ctx.options.difficulty);
      this.m = new FlappyMatch(this.ai.personality.seed);
    }
    ctx.input.tap((x, y) => {
      if (x >= 24 && x <= 396 && y >= 112 && y <= 650)
        this.jump(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "KeyA"], () => this.jump(0));
    ctx.input.press(["Enter", "KeyL"], () => this.jump(1));
    ctx.setHint("");
    this.draw();
  }
  private jump(p: 0 | 1, ai = false) {
    if (this.paused || this.done || (p === 1 && this.ai && !ai)) return;
    if (this.m.jump(p)) this.ctx.audio.play("soft");
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      if (this.ai?.update(h, this.m)) this.jump(1, true);
      this.m.step(h);
    });
    const scores = this.m.players.map((p) => p.score) as [number, number];
    if (scores.join() !== this.score) {
      if (this.score) this.ctx.audio.play("goal");
      this.score = scores.join();
      this.ctx.setScore(...scores);
    }
    this.draw();
    if (this.m.winner) {
      this.done = true;
      this.ctx.finish({ winner: this.m.winner, scores });
    }
  }
  private draw() {
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, theme.peach, 4);
    for (const i of [0, 1] as const) {
      const p = this.m.players[i],
        top = i === 0 ? 428 : 158,
        color = i === 0 ? theme.orange : theme.blue;
      rounded(g, 36, top - 10, 348, 190, 10, theme.white, 2);
      g.lineStyle(3, theme.ink).lineBetween(42, top + 157, 378, top + 157);
      const hx = 40 + p.hoop.x,
        hy = top + p.hoop.y;
      g.lineStyle(4, theme.ink).lineBetween(hx + 27, hy - 36, hx + 27, hy + 7);
      g.lineStyle(2, 0x9aaca8)
        .lineBetween(hx - 21, hy, hx - 11, hy + 28)
        .lineBetween(hx + 21, hy, hx + 11, hy + 28)
        .lineBetween(hx - 11, hy + 28, hx + 11, hy + 28);
      g.lineStyle(3, theme.ink).lineBetween(hx - 21, hy, hx + 21, hy);
      g.fillStyle(color)
        .fillCircle(hx - 21, hy, 3)
        .fillCircle(hx + 21, hy, 3);
      const x = 40 + p.x,
        y = top + p.y,
        ready =
          !p.jumping &&
          !p.ball &&
          Math.abs(projectedLanding(p) - p.hoop.x) < 12;
      g.lineStyle(6, ready ? 0x72a96e : 0xd6d3c8).lineBetween(
        x - 14,
        top + 162,
        x + 14,
        top + 162,
      );
      rounded(g, x - 9, y - 24, 18, 23, 6, color, 3);
      g.fillStyle(theme.white).fillCircle(x, y - 32, 9);
      g.lineStyle(3, theme.ink).strokeCircle(x, y - 32, 9);
      g.lineStyle(3, theme.ink).lineBetween(x + 7, y - 15, x + 17, y - 23);
      if (p.ball) {
        const b = p.ball;
        g.fillStyle(color).fillCircle(40 + b.x, top + b.y, 7);
        g.lineStyle(2, theme.ink).strokeCircle(40 + b.x, top + b.y, 7);
        g.lineBetween(34 + b.x, top + b.y, 46 + b.x, top + b.y);
      }
    }
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
      time: this.m.time,
      winner: this.m.winner,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
