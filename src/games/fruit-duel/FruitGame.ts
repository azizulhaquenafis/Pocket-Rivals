import { MatchRandom, mixSeed, freshSeed } from "../../shared/ai/MatchRandom";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded } from "../../shared/components/drawing";
import { swordPose, SWING_IMPACT } from "./SwordMotion";
import { FruitMatch, isFruit } from "./Rules";
import { FruitAI } from "./AI";
import { fruit, half, sword } from "./FruitArt";
export class FruitGame implements MiniGame {
  private ctx!: GameContext;
  private m = new FruitMatch();
  private ai?: FruitAI;
  private g!: Phaser.GameObjects.Graphics;
  private paused = false;
  private round = 0;
  private done = 0;
  private reported = false;
  private seen = [0, 0];
  private swing = [1, 1];
  private cutAge = 2;
  private cutSound = false;
  private revealAge = 0;
  private version = -1;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    if (ctx.options.mode === "ai") {
      this.ai = new FruitAI(ctx.options.difficulty);
    }
    this.m = new FruitMatch(
      new MatchRandom(mixSeed(this.ai?.personality.seed ?? freshSeed(), 42))
        .next,
    );
    ctx.input.tap((x, y) => {
      if (x > 24 && x < 396 && y > 112 && y < 650) this.tap(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "Enter"], (code) =>
      this.tap(code === "Space" ? 0 : 1),
    );
    ctx.setScore(0, 0);
    ctx.setHint("");
    ctx.audio.play("start");
  }
  private tap(p: 0 | 1) {
    if (!this.paused && !this.reported && !(p === 1 && this.ai)) this.m.tap(p);
  }
  update(dt: number) {
    if (this.paused || this.reported) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    if (this.version !== this.m.version) {
      this.version = this.m.version;
      this.revealAge = 0;
    }
    this.revealAge += dt;
    this.cutAge += dt;
    for (const p of [0, 1] as const) {
      if (this.seen[p] !== this.m.attemptSerial[p]) {
        this.seen[p] = this.m.attemptSerial[p];
        this.swing[p] = 0;
        this.ctx.audio.play(this.m.missed[p] ? "thud" : "shoot");
      }
      this.swing[p] = Math.min(
        1,
        (this.m.time - this.m.swingStartedAt[p]) / this.m.recoveryDuration[p],
      );
    }
    if (this.round !== this.m.round) {
      this.round = this.m.round;
      this.ctx.setScore(...this.m.scores);
      if (this.m.capturedBy !== null) {
        this.cutAge = 0;
        this.cutSound = false;
        this.ctx.audio.play("capture", 0.65);
      }
    }
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xc5a5ce, 4);
    const slicing =
      this.m.capturedBy !== null &&
      (this.m.phase === "between" || this.m.phase === "done");
    if (slicing && !this.cutSound && this.cutAge >= SWING_IMPACT) {
      this.cutSound = true;
      this.ctx.audio.play("slice");
    }
    if (slicing && this.cutAge < SWING_IMPACT) {
      fruit(g, this.m.capturedKind, 210, 381, 49);
    } else if (slicing) {
      const t = Math.min(0.85, this.cutAge - SWING_IMPACT),
        p = this.m.capturedBy!,
        dir = p === 0 ? 1 : -1;
      for (const left of [true, false]) {
        const side = left ? -1 : 1;
        half(
          g,
          this.m.capturedKind,
          210 + side * t * 125,
          381 - 45 * t + 150 * t * t,
          48,
          left,
          side * t * 1.5,
        );
      }
      if (t < 0.6)
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          g.fillStyle(i % 2 ? 0xffda85 : 0xf08d86, 1 - t / 0.6).fillEllipse(
            210 + Math.cos(a) * t * 130,
            381 + Math.sin(a) * t * 90 + 100 * t * t,
            4,
            8,
          );
        }
      g.lineStyle(
        4,
        p === 0 ? theme.orange : theme.blue,
        Math.max(0, 1 - this.cutAge * 4),
      ).lineBetween(147, 381 - dir * 35, 273, 381 + dir * 35);
    } else if (this.m.current >= 0) {
      const scale = Math.min(1, this.revealAge / 0.16);
      g.fillStyle(0x51465c, 0.12).fillEllipse(
        215,
        398,
        100 * scale,
        78 * scale,
      );
      const knocked = this.m.missed.some(
        (miss, p) => miss && this.swing[p] < 0.7,
      );
      g.save();
      g.translateCanvas(210, 381);
      g.rotateCanvas(
        knocked
          ? Math.sin(this.m.time * 35) * 0.12
          : Math.sin(this.revealAge * 0.8) * 0.08,
      );
      fruit(g, this.m.current, 0, 0, 49 * scale);
      g.restore();
    } else {
      g.lineStyle(2, 0xffffff, 0.35).strokeCircle(210, 381, 39);
    }
    for (const p of [0, 1] as const) {
      const pose = swordPose(
        p,
        this.m.attemptSerial[p],
        this.m.time - this.m.swingStartedAt[p],
        this.m.recoveryDuration[p],
      );
      sword(
        g,
        pose.x,
        pose.y,
        pose.angle,
        p === 0 ? theme.orange : theme.blue,
        this.m.missed[p] && this.swing[p] < 1,
      );
    }
    if (this.m.phase === "show") this.m.present();
    if (this.m.winner) {
      this.done += dt;
      if (this.done > 0.9) {
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
    this.reported = true;
    this.g.destroy();
  }
  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      phase: this.m.phase,
      target: this.m.target,
      current: this.m.current,
      isFruit: isFruit(this.m.current),
      time: this.m.time,
      round: this.m.round,
      scores: [...this.m.scores],
      winner: this.m.winner,
      cooldowns: this.m.blockedUntil.map((t) => Math.max(0, t - this.m.time)),
      attempts: [...this.m.attemptSerial],
      swings: [...this.swing],
      swordPoses: ([0, 1] as const).map((p) =>
        swordPose(
          p,
          this.m.attemptSerial[p],
          this.m.time - this.m.swingStartedAt[p],
          this.m.recoveryDuration[p],
        ),
      ),
      cutAge: this.cutAge,
      capturedBy: this.m.capturedBy,
    };
  }
}
