import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { SpikeMatch, STONES, DIRECTIONS } from "./Rules";
import { SpikeAI } from "./AI";
export class SpikeGame implements MiniGame {
  private ctx!: GameContext;
  private m = new SpikeMatch(freshSeed());
  private ai?: SpikeAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private fixed = new FixedStep();
  private keys = new Set<string>();
  private paused = false;
  private done = false;
  private scores = "";
  private wave = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 381, "", 15);
    if (ctx.options.mode === "ai") {
      this.ai = new SpikeAI(ctx.options.difficulty);
      this.m = new SpikeMatch(this.ai.personality.seed);
    }
    ctx.input.dragHalves();
    ctx.input.tap((x, y) => this.pointer(x, y));
    this.keys = ctx.input.keys([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowLeft",
      "ArrowDown",
      "ArrowRight",
    ]);
    ctx.setHint("");
    this.draw();
  }
  private pointer(x: number, y: number) {
    if (this.paused || this.done || x < 40 || x > 380) return;
    const p = y < 380 ? 1 : 0,
      top = p === 0 ? 428 : 158;
    if (y < top || y > top + 170 || (p === 1 && this.ai)) return;
    this.m.target(p, x - 40, y - top);
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    for (const t of this.ctx.input.players) if (t.down) this.pointer(t.x, t.y);
    this.fixed.advance(dt, (h) => {
      for (const p of [0, 1] as const) {
        if (p === 1 && this.ai) continue;
        const codes =
            p === 0
              ? ["KeyA", "KeyD", "KeyW", "KeyS"]
              : ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
          dx =
            Number(this.keys.has(codes[1])) - Number(this.keys.has(codes[0])),
          dy =
            Number(this.keys.has(codes[3])) - Number(this.keys.has(codes[2]));
        if (dx || dy) {
          const v = this.m.players[p];
          this.m.target(p, v.x + dx * 50, v.y + dy * 50);
        }
      }
      this.ai?.update(h, this.m);
      this.m.step(h);
    });
    if (this.m.wave !== this.wave) {
      this.wave = this.m.wave;
      this.ctx.audio.play("countdown");
    }
    if (this.m.scores.join() !== this.scores) {
      if (this.scores) this.ctx.audio.play("hit");
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
    rounded(g, 24, 112, 372, 538, 20, 0xe5dcc5, 4);
    for (const i of [0, 1] as const) {
      const top = i === 0 ? 428 : 158,
        p = this.m.players[i],
        color = i === 0 ? theme.orange : theme.blue;
      rounded(g, 40, top, 340, 170, 9, theme.white, 2);
      for (const s of STONES) {
        g.fillStyle(0xa3aaa2).fillCircle(40 + s.x, top + s.y, s.r);
        g.lineStyle(3, theme.ink).strokeCircle(40 + s.x, top + s.y, s.r);
        g.lineStyle(2, theme.white, 0.5).lineBetween(
          33 + s.x,
          top + s.y - 8,
          42 + s.x,
          top + s.y - 11,
        );
      }
      if (this.m.warning > 0) {
        const d = DIRECTIONS[this.m.direction],
          x = 210 - d.x * 155,
          y = top + 85 - d.y * 70;
        g.lineStyle(
          5,
          color,
          0.5 + 0.5 * Math.sin(this.m.warning * 9) ** 2,
        ).lineBetween(x - d.x * 10, y - d.y * 10, x + d.x * 8, y + d.y * 8);
        g.fillStyle(color).fillTriangle(
          x + d.x * 14,
          y + d.y * 14,
          x - d.y * 7,
          y + d.x * 7,
          x + d.y * 7,
          y - d.x * 7,
        );
      }
      for (const s of p.shots) {
        g.fillStyle(theme.ink).fillCircle(40 + s.x, top + s.y, 3);
        g.lineStyle(2, theme.ink).lineBetween(
          40 + s.x,
          top + s.y,
          40 + s.x - s.vx * 0.035,
          top + s.y - s.vy * 0.035,
        );
      }
      g.fillStyle(p.alive ? color : theme.muted).fillCircle(
        40 + p.x,
        top + p.y,
        9,
      );
      g.lineStyle(3, theme.ink).strokeCircle(40 + p.x, top + p.y, 9);
    }
    this.text.setText(
      this.m.between
        ? "NEXT ROUND…"
        : this.m.warning > 0
          ? `TAKE COVER · ${this.m.warning.toFixed(1)}s`
          : `WAVE ${this.m.wave} · HOLD YOUR COVER`,
    );
  }
  pause() {
    this.paused = true;
    this.fixed.reset();
  }
  resume() {
    this.paused = false;
    this.m.players.forEach((p) => {
      p.tx = p.x;
      p.ty = p.y;
    });
  }
  dispose() {
    this.done = true;
    this.g.destroy();
    this.text.destroy();
  }
  snapshot() {
    return {
      players: this.m.players,
      scores: this.m.scores,
      warning: this.m.warning,
      direction: this.m.direction,
      wave: this.m.wave,
      between: this.m.between,
      winner: this.m.winner,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
