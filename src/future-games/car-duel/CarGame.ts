import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { CarMatch } from "./Rules";
import { CarAI } from "./AI";
import { CarInput, BUTTONS } from "./CarInput";
import { point, head, terrain } from "./Physics";
export class CarGame implements MiniGame {
  private ctx!: GameContext;
  private m = new CarMatch();
  private ai?: CarAI;
  private controls!: CarInput;
  private keys = new Set<string>();
  private g!: Phaser.GameObjects.Graphics;
  private texts: Phaser.GameObjects.Text[] = [];
  private fixed = new FixedStep();
  private paused = false;
  private done = false;
  private score = "";
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    if (ctx.options.mode === "ai") this.ai = new CarAI(ctx.options.difficulty);
    this.controls = new CarInput(ctx.scene, !!this.ai);
    this.keys = ctx.input.keys(["KeyA", "KeyD", "ArrowLeft", "ArrowRight"]);
    this.texts = [
      label(ctx.scene, 210, 155, "", 12),
      label(ctx.scene, 118, 530, "", 13),
      label(ctx.scene, 302, 530, "", 13),
    ];
    for (const b of BUTTONS)
      this.texts.push(
        label(ctx.scene, b.x + b.w / 2, b.y + b.h / 2, b.d < 0 ? "←" : "→", 28),
      );
    ctx.setHint("");
    this.draw();
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      const one = Math.max(
          -1,
          Math.min(
            1,
            this.controls.value(0) +
              Number(this.keys.has("KeyD")) -
              Number(this.keys.has("KeyA")),
          ),
        ),
        two = this.ai
          ? this.ai.update(h, this.m)
          : Math.max(
              -1,
              Math.min(
                1,
                this.controls.value(1) +
                  Number(this.keys.has("ArrowRight")) -
                  Number(this.keys.has("ArrowLeft")),
              ),
            );
      this.m.step(h, [one, two]);
    });
    if (this.m.scores.join() !== this.score) {
      if (this.score) this.ctx.audio.play("metal");
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
    rounded(g, 24, 112, 372, 538, 20, 0xcddfdb, 4);
    rounded(g, 40, 185, 340, 315, 12, theme.white, 2);
    g.fillStyle(0xaab9a0).beginPath().moveTo(40, 490);
    for (let x = 0; x <= 340; x += 4) g.lineTo(40 + x, 200 + terrain(x));
    g.lineTo(380, 490).closePath().fillPath();
    g.lineStyle(3, theme.ink).beginPath();
    for (let x = 0; x <= 340; x += 4) {
      if (x === 0) g.moveTo(40, 200 + terrain(x));
      else g.lineTo(40 + x, 200 + terrain(x));
    }
    g.strokePath();
    for (const i of [0, 1] as const) {
      const c = this.m.cars[i],
        color = i === 0 ? theme.orange : theme.blue;
      const corners = [
        [-26, -12],
        [26, -12],
        [26, 12],
        [-26, 12],
      ].map(([x, y]) => point(c, x, y));
      g.fillStyle(c.alive ? color : theme.muted)
        .beginPath()
        .moveTo(40 + corners[0].x, 200 + corners[0].y);
      corners.slice(1).forEach((p) => g.lineTo(40 + p.x, 200 + p.y));
      g.closePath().fillPath().lineStyle(3, theme.ink).strokePath();
      for (const x of [-21, 21]) {
        const p = point(c, x, 12);
        g.fillStyle(theme.ink).fillCircle(40 + p.x, 200 + p.y, 10);
        g.fillStyle(theme.white).fillCircle(40 + p.x, 200 + p.y, 5);
      }
      const h = head(c);
      g.fillStyle(c.alive ? color : theme.muted).fillCircle(
        40 + h.x,
        200 + h.y,
        7,
      );
      g.lineStyle(2, theme.ink).strokeCircle(40 + h.x, 200 + h.y, 7);
      g.fillStyle(theme.ink).fillCircle(
        40 + h.x + c.facing * 3,
        198 + h.y,
        1.5,
      );
    }
    for (const b of BUTTONS)
      rounded(
        g,
        b.x,
        b.y,
        b.w,
        b.h,
        14,
        b.p === 0 ? theme.orange : theme.blue,
        3,
      );
    this.texts.forEach((t) => t.setDepth(2));
    this.texts[0].setText(
      this.m.between ? "DRIVERS, GET READY…" : `Round ${this.m.round}`,
    );
  }
  pause() {
    this.paused = true;
    this.fixed.reset();
    this.controls.pause();
  }
  resume() {
    this.paused = false;
    this.controls.resume();
  }
  dispose() {
    this.done = true;
    this.controls.dispose();
    this.g.destroy();
    this.texts.forEach((t) => t.destroy());
  }
  snapshot() {
    return {
      cars: this.m.cars,
      scores: this.m.scores,
      round: this.m.round,
      between: this.m.between,
      time: this.m.time,
      winner: this.m.winner,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
