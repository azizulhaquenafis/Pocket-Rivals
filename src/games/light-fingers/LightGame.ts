import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded } from "../../shared/components/drawing";
import { LightMatch } from "./Rules";
import { hand, pedestal, gem } from "./LightArt";
import { turnBackground } from "../../shared/components/TurnView";
import { LightAI } from "./AI";
import { HandMotion } from "./HandMotion";
export class LightGame implements MiniGame {
  private ctx!: GameContext;
  private m = new LightMatch();
  private ai?: LightAI;
  private g!: Phaser.GameObjects.Graphics;
  private paused = false;
  private serial = 0;
  private reported = false;
  private finishAge = 0;
  private celebration: 1 | 2 | null = null;
  private previousScores = [0, 0];
  private hands = [new HandMotion(), new HandMotion()];
  private blocked = [0, 0];
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    if (ctx.options.mode === "ai")
      this.ai = new LightAI(ctx.options.difficulty);
    if (this.ai)
      this.m = new LightMatch(
        new MatchRandom(mixSeed(this.ai.personality.seed, 42)).next,
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
    if (!this.paused && !(p === 1 && this.ai)) {
      const accepted = this.m.tap(p);
      if (accepted) this.hands[p].grab(this.m.time);
    }
  }
  update(dt: number) {
    if (this.paused) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    for (const p of [0, 1] as const) {
      if (this.m.blockedUntil[p] > this.blocked[p]) {
        this.blocked[p] = this.m.blockedUntil[p];
        this.hands[p].recover(this.m.time, this.blocked[p]);
        this.ctx.audio.play("fail", 0.35);
      }
    }
    if (this.serial !== this.m.serial) {
      this.serial = this.m.serial;
      this.celebration =
        this.m.scores[0] > this.previousScores[0]
          ? 1
          : this.m.scores[1] > this.previousScores[1]
            ? 2
            : null;
      this.previousScores = [...this.m.scores];
      if (this.celebration) this.hands[this.celebration - 1].steal(this.m.time);
      this.ctx.setScore(...this.m.scores);
      this.ctx.audio.play(this.m.message.includes("SOON") ? "fail" : "capture");
    }
    const g = this.g;
    g.clear();
    const celebrating = this.m.phase === "between" || this.m.phase === "done";
    rounded(
      g,
      24,
      112,
      372,
      538,
      20,
      celebrating && this.celebration
        ? turnBackground(this.celebration)
        : 0xbca698,
      4,
    );
    const active = this.m.phase === "signal" || this.m.phase === "active";
    pedestal(g, active, this.m.time);
    for (const p of [0, 1] as const) {
      const pose = this.hands[p].pose(this.m.time);
      hand(
        g,
        p === 0 ? 260 - pose.reach * 50 : 160 + pose.reach * 50,
        p === 0 ? 550 : 210,
        p === 0 ? 0 : Math.PI,
        p === 0 ? theme.orange : theme.blue,
        pose.reach * 86,
        pose.gray,
        pose.grip,
      );
    }
    if (celebrating && this.celebration) {
      const p = this.celebration - 1;
      const pose = this.hands[p].pose(this.m.time);
      const travel = pose.carrying ? 1 - pose.reach : 0;
      if (pose.phase === "steal")
        gem(
          g,
          210 + (p === 0 ? 50 : -50) * travel,
          380 + (p === 0 ? 86 : -86) * travel,
          1 - 0.4 * travel,
          this.m.time,
        );
    }
    if (this.m.phase === "signal") {
      this.ctx.audio.play("countdown");
      this.m.presentSignal();
    }
    if (this.m.winner) {
      this.finishAge += dt;
      if (this.finishAge > 0.75 && !this.reported) {
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
    this.g.destroy();
  }
  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      phase: this.m.phase,
      scores: [...this.m.scores],
      time: this.m.time,
      signalAt: this.m.signalAt,
      round: this.m.serial,
      winner: this.m.winner,
      hands: this.hands.map((h) => h.pose(this.m.time)),
      cooldowns: this.m.blockedUntil.map((t) => Math.max(0, t - this.m.time)),
      capturedBy: this.m.capturedBy,
    };
  }
}
