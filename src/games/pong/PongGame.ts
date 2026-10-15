import { restoredAISeed } from "../../shared/ai/MatchRandom";
import { savePong, restorePong } from "./PongState";
import { MatchClock } from "../../shared/rules/MatchClock";
import { PongAI } from "./PongAI";
import Phaser from "phaser";
import type {
  GameContext,
  MiniGame,
  Player,
} from "../../shared/contracts/GameModule";
import { theme, FIELD } from "../../core/ThemeManager";
import { FixedStep, clamp } from "../../shared/physics/FixedStep";
import { circle, rounded, label } from "../../shared/components/drawing";
import { Impacts } from "../../shared/effects/Impacts";
import { PongWorld } from "./PongPhysics";
export class PingPong implements MiniGame {
  private ctx!: GameContext;
  private world!: PongWorld;
  private clock = new FixedStep();
  private matchClock = new MatchClock();
  private graphics!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private effects = new Impacts();
  private sinceSave = 0;
  private paused = false;
  private ai?: PongAI;
  private keys = new Set<string>();
  private trail = Array.from({ length: 8 }, () => ({ x: 210, y: 381 }));
  private trailAt = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    if (ctx.options.mode === "ai")
      this.ai = new PongAI(
        ctx.options.difficulty,
        restoredAISeed(ctx.restoredState),
      );
    ctx.input.dragHalves();
    this.keys = ctx.input.keys(["KeyA", "KeyD", "ArrowLeft", "ArrowRight"]);
    ctx.setHint("");
    this.bg = ctx.scene.add.graphics();
    const g = this.bg;
    rounded(g, 24, 112, 372, 538, 17, theme.green, 4);
    g.fillStyle(0xffffff, 0.08).fillRect(30, 118, 180, 526);
    g.lineStyle(2, 0xffffff, 0.65).strokeRect(40, 128, 340, 506);
    for (let x = 38; x < 384; x += 18)
      g.lineStyle(3, theme.white, 0.75).lineBetween(x, 381, x + 9, 381);
    circle(g, 210, 381, 38, theme.green, 0);
    g.lineStyle(2, theme.white, 0.6).strokeCircle(210, 381, 38);
    this.graphics = ctx.scene.add.graphics();
    this.status = label(ctx.scene, 210, 331, "READY?", 28);
    this.world = new PongWorld(
      (x, y) => {
        this.effects.burst(x, y, theme.white);
        ctx.audio.play("hit");
      },
      (p) => this.goal(p),
    );
    restorePong(this.world, this.matchClock, ctx.restoredState);
    ctx.setScore(...this.world.scores);
    this.save();
  }
  private goal(p: Player) {
    this.ctx.setScore(...this.world.scores);
    this.ctx.audio.play("goal");
    this.trail.forEach((v) => {
      v.x = 210;
      v.y = 381;
    });
    const winner = this.matchClock.score(this.world.scores);
    if (winner !== null) {
      this.world.done = true;
      this.ctx.finish({ winner, scores: [...this.world.scores] });
    }
  }
  update(dt: number) {
    if (this.paused) return;
    const w = this.world;
    const winner = this.matchClock.advance(dt, w.scores);
    this.ctx.setClock(this.matchClock.text, this.matchClock.remaining <= 10);
    if (this.matchClock.overtime)
      this.ctx.setHint("SUDDEN DEATH · NEXT POINT WINS");
    if (winner !== null) {
      w.done = true;
      this.ctx.finish({ winner, scores: [...w.scores] });
      return;
    }
    this.clock.advance(dt, (step) => {
      w.step(step, [
        this.paddleTarget(0, step),
        this.ai ? this.ai.update(step, w) : this.paddleTarget(1, step),
      ]);
    });
    this.sinceSave += dt;
    if (this.sinceSave >= 1) {
      this.sinceSave = 0;
      this.save();
    }
    const rem = w.cooldown <= 0 && !w.done ? this.clock.remainder : 0;
    const renderBallX = clamp(
      w.ball.x + w.ball.vx * rem,
      FIELD.left + w.ball.r,
      FIELD.right - w.ball.r,
    );
    const renderBallY = clamp(
      w.ball.y + w.ball.vy * rem,
      FIELD.top - w.ball.r * 2,
      FIELD.bottom + w.ball.r * 2,
    );
    if (w.cooldown <= 0 && !w.done) {
      const t = this.trail[this.trailAt++ % 8];
      t.x = renderBallX;
      t.y = renderBallY;
    }
    const renderPaddles = w.paddles.map((p, i) => {
      if (w.done) return p.x;
      const target =
        i === 0
          ? this.paddleTarget(0, rem)
          : this.ai
            ? w.paddles[1].x
            : this.paddleTarget(1, rem);
      let rx = p.x + p.vx * rem;
      if (p.vx > 0 && rx > target) rx = Math.max(p.x, target);
      if (p.vx < 0 && rx < target) rx = Math.min(p.x, target);
      return clamp(rx, FIELD.left + 44, FIELD.right - 44);
    });
    const g = this.graphics;
    g.clear();
    if (w.cooldown <= 0)
      for (let i = 0; i < 8; i++) {
        const t = this.trail[(this.trailAt + i) % 8];
        g.fillStyle(theme.white, 0.08 + i * 0.045).fillCircle(
          t.x,
          t.y,
          3 + i * 0.65,
        );
      }
    w.paddles.forEach((p, i) => {
      const px = renderPaddles[i];
      g.fillStyle(theme.ink, 0.15).fillRoundedRect(px - 44, p.y - 3, 88, 14, 7);
      rounded(
        g,
        px - 44,
        p.y - 7,
        88,
        14,
        7,
        i === 0 ? theme.orange : theme.blue,
        3,
      );
      g.lineStyle(2, theme.white, 0.7).lineBetween(
        px - 28,
        p.y - 3,
        px + 28,
        p.y - 3,
      );
    });
    circle(g, renderBallX, renderBallY, 9, theme.white, 3);
    this.effects.draw(g, dt);
    this.status
      .setText(w.cooldown > 0.5 ? "READY?" : w.cooldown > 0 ? "GO!" : "")
      .setAlpha(w.cooldown > 0 ? 1 : 0);
  }
  private paddleTarget(player: 0 | 1, step: number) {
    const pointer = this.ctx.input.players[player];
    if (pointer.down) return pointer.x;
    const arrows = player === 1 || !!this.ai;
    const left =
      (player === 0 && this.keys.has("KeyA")) ||
      (arrows && this.keys.has("ArrowLeft"));
    const right =
      (player === 0 && this.keys.has("KeyD")) ||
      (arrows && this.keys.has("ArrowRight"));
    // Keep the opening feel, then scale with rally speed up to the physics limit.
    const ball = this.world.ball;
    const speed = Math.min(
      1800,
      480 * Math.max(1, Math.hypot(ball.vx, ball.vy) / Math.hypot(110, 340)),
    );
    return (
      this.world.paddles[player].x +
      (Number(right) - Number(left)) * speed * step
    );
  }
  private save() {
    if (!this.world.done)
      this.ctx.saveState({
        ...savePong(this.world, this.matchClock),
        ai: this.ai?.snapshot(),
      });
  }
  pause() {
    this.save();
    this.paused = true;
    this.clock.reset();
  }
  resume() {
    this.paused = false;
    this.clock.reset();
  }
  dispose() {
    this.bg.destroy();
    this.graphics.destroy();
    this.status.destroy();
  }
  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      ball: { ...this.world.ball },
      paddles: this.world.paddles.map((p) => ({ ...p })),
      timer: {
        remaining: this.matchClock.remaining,
        overtime: this.matchClock.overtime,
      },
      scores: [...this.world.scores],
      cooldown: this.world.cooldown,
    };
  }
}
