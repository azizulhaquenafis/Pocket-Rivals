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
import { FixedStep } from "../../shared/physics/FixedStep";
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
  private trail = Array.from({ length: 8 }, () => ({ x: 210, y: 381 }));
  private trailAt = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    if (ctx.options.mode === "ai") this.ai = new PongAI(ctx.options.difficulty);
    ctx.input.dragHalves();
    ctx.setHint("DRAG YOUR HALF · FIRST TO 5");
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
        this.ctx.input.players[0].down
          ? this.ctx.input.players[0].x
          : w.paddles[0].x,
        this.ai
          ? this.ai.update(step, w)
          : this.ctx.input.players[1].down
            ? this.ctx.input.players[1].x
            : w.paddles[1].x,
      ]);
      const t = this.trail[this.trailAt++ % 8];
      t.x = w.ball.x;
      t.y = w.ball.y;
    });
    this.sinceSave += dt;
    if (this.sinceSave >= 1) {
      this.sinceSave = 0;
      this.save();
    }
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
      g.fillStyle(theme.ink, 0.15).fillRoundedRect(
        p.x - 44,
        p.y - 3,
        88,
        14,
        7,
      );
      rounded(
        g,
        p.x - 44,
        p.y - 7,
        88,
        14,
        7,
        i === 0 ? theme.orange : theme.blue,
        3,
      );
      g.lineStyle(2, theme.white, 0.7).lineBetween(
        p.x - 28,
        p.y - 3,
        p.x + 28,
        p.y - 3,
      );
    });
    circle(g, w.ball.x, w.ball.y, 9, theme.white, 3);
    this.effects.draw(g, dt);
    this.status
      .setText(w.cooldown > 0.5 ? "READY?" : w.cooldown > 0 ? "GO!" : "")
      .setAlpha(w.cooldown > 0 ? 1 : 0);
  }
  private save() {
    if (!this.world.done)
      this.ctx.saveState(savePong(this.world, this.matchClock));
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
