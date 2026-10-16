import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { ArcheryMatch } from "./Rules";
import { ArcheryAI } from "./AI";
export class ArcheryGame implements MiniGame {
  private ctx!: GameContext;
  private m = new ArcheryMatch(freshSeed());
  private ai?: ArcheryAI;
  private g!: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.Text[] = [];
  private fixed = new FixedStep();
  private paused = false;
  private done = false;
  private scores = "";
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.texts = [
      label(ctx.scene, 210, 610, "", 12),
      label(ctx.scene, 210, 340, "", 12),
    ];
    if (ctx.options.mode === "ai") {
      this.ai = new ArcheryAI(ctx.options.difficulty);
      this.m = new ArcheryMatch(this.ai.personality.seed);
    }
    ctx.input.tap((x, y) => {
      if (x >= 24 && x <= 396 && y >= 112 && y <= 650)
        this.tap(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "KeyA"], () => this.tap(0));
    ctx.input.press(["Enter", "KeyL"], () => this.tap(1));
    ctx.setHint("");
    this.draw();
  }
  private tap(p: 0 | 1, ai = false) {
    if (this.paused || this.done || (p === 1 && this.ai && !ai)) return;
    if (this.m.tap(p))
      this.ctx.audio.play(
        this.m.players[p].stage === "flight" ? "shoot" : "tap",
      );
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      if (this.ai?.update(this.m)) this.tap(1, true);
      this.m.step(h);
    });
    const s = this.m.players.map((p) => p.score) as [number, number];
    if (s.join() !== this.scores) {
      if (this.scores) this.ctx.audio.play("hit");
      this.scores = s.join();
      this.ctx.setScore(...s);
    }
    this.draw();
    if (this.m.winner) {
      this.done = true;
      this.ctx.finish({ winner: this.m.winner, scores: s });
    }
  }
  private draw() {
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xdbe8cf, 4);
    for (const i of [0, 1] as const) {
      const p = this.m.players[i],
        top = i === 0 ? 415 : 145,
        color = i === 0 ? theme.orange : theme.blue;
      rounded(g, 40, top, 340, 170, 12, theme.white, 2);
      for (const t of p.targets) {
        g.fillStyle(color).fillCircle(40 + t.x, top + t.y, t.r);
        g.lineStyle(3, theme.ink).strokeCircle(40 + t.x, top + t.y, t.r);
        g.lineStyle(2, theme.white).strokeCircle(
          40 + t.x,
          top + t.y,
          t.r * 0.65,
        );
        g.fillStyle(theme.ink).fillCircle(40 + t.x, top + t.y, 3);
      }
      if (p.stage !== "ready") {
        const x = 40 + p.x,
          y = top + p.y;
        g.lineStyle(1, theme.ink, 0.3).lineBetween(x, top, x, top + 170);
        g.lineStyle(1, theme.ink, 0.3).lineBetween(40, y, 380, y);
        g.lineStyle(3, theme.ink).strokeCircle(x, y, 7);
        if (p.stage === "flight") {
          const t = Math.min(1, p.age / 0.38),
            ax = 210 + (x - 210) * t,
            ay = top + 180 + (y - top - 180) * t;
          g.lineStyle(4, theme.ink).lineBetween(ax, ay, ax - 5, ay + 18);
        }
        if (p.stage === "impact") {
          g.lineStyle(3, color, 1 - p.age / 0.7).strokeCircle(
            x,
            y,
            12 + p.age * 30,
          );
        }
      }
      this.texts[i].setText(
        p.stage === "ready"
          ? "Tap to aim"
          : p.stage === "horizontal"
            ? "Lock horizontal"
            : p.stage === "vertical"
              ? "Lock vertical"
              : p.stage === "impact"
                ? p.lastPoints
                  ? `+${p.lastPoints} · NICE SHOT!`
                  : "MISS · TRY AGAIN"
                : "ARROW AWAY",
      );
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
    this.texts.forEach((t) => t.destroy());
  }
  snapshot() {
    return {
      players: this.m.players,
      winner: this.m.winner,
      time: this.m.time,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
