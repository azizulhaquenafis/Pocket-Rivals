import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label, circle } from "../../shared/components/drawing";
import { LightMatch } from "./Rules";
import { hand, pedestal, gem } from "./LightArt";
import { turnBackground } from "../../shared/components/TurnView";
import { LightAI } from "./AI";
export class LightGame implements MiniGame {
  private ctx!: GameContext;
  private m = new LightMatch();
  private ai?: LightAI;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private prompts: Phaser.GameObjects.Text[] = [];
  private paused = false;
  private serial = 0;
  private reported = false;
  private finishAge = 0;
  private celebration: 1 | 2 | null = null;
  private previousScores = [0, 0];
  private reach = [0, 0];
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.text = label(ctx.scene, 210, 625, "", 11);
    this.prompts = [
      label(ctx.scene, 210, 137, "", 11).setRotation(
        ctx.options.mode === "local" ? Math.PI : 0,
      ),
    ];
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
      if (accepted) this.reach[p] = 1;
    }
  }
  update(dt: number) {
    if (this.paused) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    if (this.serial !== this.m.serial) {
      this.serial = this.m.serial;
      this.celebration =
        this.m.scores[0] > this.previousScores[0]
          ? 1
          : this.m.scores[1] > this.previousScores[1]
            ? 2
            : null;
      this.previousScores = [...this.m.scores];
      if (this.celebration) this.reach[this.celebration - 1] = 1;
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
    this.reach = this.reach.map((age) => Math.max(0, age - dt));
    for (const p of [0] as const) {
      const travel =
        Math.sin(Math.min(1, (1 - this.reach[p]) / 0.7) * Math.PI) * 140;
      hand(
        g,
        p === 0 ? 260 - (travel / 140) * 50 : 160,
        p === 0 ? 550 : 210,
        p === 0 ? 0 : Math.PI,
        p === 0 ? theme.orange : theme.blue,
        travel,
      );
    }
    if (celebrating && this.celebration) {
      const age = 1 - this.reach[this.celebration - 1];
      const travel = Math.max(0, Math.min(1, (age - 0.32) / 0.5));
      const ease = travel * travel * (3 - 2 * travel);
      gem(
        g,
        210 + (this.celebration === 1 ? 45 : -45) * ease,
        364 + (this.celebration === 1 ? 200 : -200) * ease,
        1 - 0.65 * ease,
        this.m.time,
      );
    }
    const cooldown = Math.max(0, this.m.blockedUntil[0] - this.m.time);
    this.text.setText(cooldown > 0 ? `${cooldown.toFixed(1)}s` : "");
    const blueCooldown = Math.max(0, this.m.blockedUntil[1] - this.m.time);
    this.prompts[0].setText(
      blueCooldown > 0 ? `${blueCooldown.toFixed(1)}s` : "",
    );
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
    this.text.destroy();
    this.prompts.forEach((p) => p.destroy());
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
      hands: [...this.reach],
      cooldowns: this.m.blockedUntil.map((t) => Math.max(0, t - this.m.time)),
      capturedBy: this.m.capturedBy,
    };
  }
}
