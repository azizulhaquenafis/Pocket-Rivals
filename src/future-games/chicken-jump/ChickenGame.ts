import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { ChickenMatch } from "./Rules";
import { ChickenAI } from "./AI";
export class ChickenGame implements MiniGame {
  private ctx!: GameContext;
  private m = new ChickenMatch(freshSeed());
  private ai?: ChickenAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private fixed = new FixedStep();
  private paused = false;
  private done = false;
  private score = "";
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 380, "Tap to lock", 12);
    if (ctx.options.mode === "ai") {
      this.ai = new ChickenAI(ctx.options.difficulty);
      this.m = new ChickenMatch(this.ai.personality.seed);
    }
    ctx.input.tap((x, y) => {
      if (x >= 24 && x <= 396 && y >= 112 && y <= 650)
        this.stop(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "KeyA"], () => this.stop(0));
    ctx.input.press(["Enter", "KeyL"], () => this.stop(1));
    ctx.setHint("");
    this.draw();
  }
  private stop(p: 0 | 1, ai = false) {
    if (this.paused || this.done || (p === 1 && this.ai && !ai)) return;
    if (this.m.stop(p)) this.ctx.audio.play("soft");
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      if (this.ai?.update(h, this.m)) this.stop(1, true);
      this.m.step(h);
    });
    const scores = this.m.players.map((p) => p.score) as [number, number];
    if (scores.join() !== this.score) {
      if (this.score) this.ctx.audio.play("wood");
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
    rounded(g, 24, 112, 372, 538, 20, 0xf6e6b8, 4);
    for (const i of [0, 1] as const) {
      const p = this.m.players[i],
        base = i === 0 ? 580 : 310,
        color = i === 0 ? theme.orange : theme.blue,
        s = 1.55;
      g.lineStyle(3, theme.ink).lineBetween(40, base + 28, 380, base + 28);
      for (let j = 0; j < p.stack.length; j++) {
        const b = p.stack[p.stack.length - 1 - j];
        rounded(
          g,
          55 + (b.x - b.width / 2) * s,
          base + j * 22,
          b.width * s,
          20,
          4,
          0xc6ad85,
          2,
        );
        if (j === 1) break;
      }
      rounded(
        g,
        55 + (p.block - p.width / 2) * s,
        base - 26,
        p.width * s,
        20,
        5,
        color,
        3,
      );
      const x = 55 + p.x * s,
        y = base + p.y - 12;
      rounded(
        g,
        x - 13,
        y - 20,
        26,
        30,
        10,
        p.phase === "miss" ? 0xc2bbae : theme.white,
        3,
      );
      g.fillStyle(color).fillTriangle(
        x + 13,
        y - 14,
        x + 25,
        y - 9,
        x + 13,
        y - 5,
      );
      g.fillStyle(theme.ink).fillCircle(x + 6, y - 14, 2.8);
      g.fillStyle(color)
        .fillCircle(x - 5, y - 24, 5)
        .fillCircle(x + 2, y - 26, 5);
      if (p.phase === "sliding") {
        g.lineStyle(2, theme.ink, 0.3).lineBetween(x, base - 90, x, base - 32);
      }
    }
    this.text.setText("Tap to lock");
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
