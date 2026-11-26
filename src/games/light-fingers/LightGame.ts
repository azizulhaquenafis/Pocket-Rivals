import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { LightMatch, WRONG_TAP_COOLDOWN } from "./Rules";
import {
  hand,
  pedestal,
  gem,
  vaultBackground,
  spotlightOverlay,
} from "./LightArt";
import { turnBackground } from "../../shared/components/TurnView";
import { LightAI } from "./AI";
import { HandMotion } from "./HandMotion";

export class LightGame implements MiniGame {
  private ctx!: GameContext;
  private m = new LightMatch();
  private ai?: LightAI;
  private g!: Phaser.GameObjects.Graphics;
  private frame!: Phaser.GameObjects.Graphics;
  private clip!: Phaser.GameObjects.Graphics;
  private mask!: Phaser.Display.Masks.GeometryMask;
  private paused = false;
  private serial = 0;
  private reported = false;
  private finishAge = 0;
  private celebration: 1 | 2 | null = null;
  private previousScores = [0, 0];
  private hands = [new HandMotion(), new HandMotion()];
  private blocked = [0, 0];
  private recoverStarted = [-10, -10];
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.frame = ctx.scene.add.graphics();
    this.clip = ctx.scene.make.graphics({ x: 0, y: 0 });
    this.clip.fillStyle(0xffffff).fillRoundedRect(24, 112, 372, 538, 20);
    this.mask = this.clip.createGeometryMask();
    this.g.setMask(this.mask);
    this.frame.lineStyle(4, theme.ink).strokeRoundedRect(24, 112, 372, 538, 20);
    if (ctx.options.mode === "ai")
      this.ai = new LightAI(ctx.options.difficulty);
    if (this.ai)
      this.m = new LightMatch(
        new MatchRandom(mixSeed(this.ai.personality.seed, 42)).next,
      );
    ctx.input.tap((x, y) => {
      if (x > 24 && x < 396 && y > 112 && y < 650) {
        // In 1-Player mode, tapping anywhere on the vault (including directly on the gem) grabs!
        this.tap(this.ai ? 0 : y < 381 ? 1 : 0);
      }
    });
    ctx.input.press(
      [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Enter",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
      ],
      (code) => {
        if (code === "Space" || code.startsWith("Arrow")) this.tap(0);
        else if (code === "Enter") this.tap(1);
        else this.tap(this.ai ? 0 : 1);
      },
    );
    ctx.setScore(0, 0);
    ctx.setHint("");
    ctx.audio.play("start");
  }
  private tap(p: 0 | 1) {
    if (!this.paused && !(p === 1 && this.ai)) {
      const accepted = this.m.tap(p);
      if (accepted) {
        this.hands[p].grab(this.m.time);
        this.ctx.audio.play("shoot", 0.5);
      }
    }
  }
  update(dt: number) {
    if (this.paused) return;
    this.m.update(dt);
    this.ai?.update(this.m);
    for (const p of [0, 1] as const) {
      if (this.m.blockedUntil[p] > this.blocked[p]) {
        this.blocked[p] = this.m.blockedUntil[p];
        this.recoverStarted[p] = this.m.time;
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
      this.ctx.audio.play(
        this.m.message.includes("SOON")
          ? "fail"
          : this.celebration
            ? "capture"
            : "hit",
      );
    }
    const g = this.g;
    g.clear();
    const celebrating = this.m.phase === "between" || this.m.phase === "done";
    const active = this.m.phase === "signal" || this.m.phase === "active";
    const signalAge = active ? Math.max(0, this.m.time - this.m.signalAt) : 99;
    const winnerTint =
      celebrating && this.celebration ? turnBackground(this.celebration) : null;

    // 1. Atmospheric museum vault floor & lighting mood
    vaultBackground(g, active, winnerTint, this.m.time);

    // 2. Pedestal, floor spotlight pool, signal flash & faceted gem
    pedestal(g, active, this.m.time, signalAge);

    // 3. Subtle early-grab / miss recoil spark at the empty plinth
    for (const p of [0, 1] as const) {
      const recAge = this.m.time - this.recoverStarted[p];
      if (!active && recAge >= 0.14 && recAge < 0.42) {
        const u = (recAge - 0.14) / 0.28;
        const alpha = (1 - u) * 0.85;
        g.lineStyle(3.2, 0xffc88a, alpha);
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3 + p * 0.3;
          g.lineBetween(
            210 + Math.cos(a) * (12 + u * 18),
            381 + Math.sin(a) * (12 + u * 18),
            210 + Math.cos(a) * (24 + u * 34),
            381 + Math.sin(a) * (24 + u * 34),
          );
        }
      }
    }

    // 4. Expressive thief gloves with curved snatch arcs, clenched fist carry & recoil shudder
    for (const p of [0, 1] as const) {
      const pose = this.hands[p].pose(this.m.time);
      const color = p === 0 ? theme.orange : theme.blue;
      const idleSway =
        pose.phase === "ready" ? Math.sin(this.m.time * 2.2 + p * 2.4) * 3.5 : 0;
      const arcReach = Math.max(0, pose.reach);
      const curveX = Math.sin(arcReach * Math.PI) * 14;
      const hx =
        p === 0
          ? 262 - pose.reach * 52 + curveX + idleSway
          : 158 + pose.reach * 52 - curveX - idleSway;
      const hy = p === 0 ? 556 : 206;
      const wristAngle =
        pose.phase === "ready"
          ? Math.sin(this.m.time * 2.2 + p * 2.4) * 0.03
          : -arcReach * 0.18;
      const recAge = this.m.time - this.recoverStarted[p];
      const recoilShake =
        pose.phase === "recovery" && recAge > 0.14 && recAge < 0.65
          ? Math.sin(recAge * 44) * Math.max(0, 1 - (recAge - 0.14) / 0.51) * 0.11
          : 0;

      // Sleek speed lines trailing behind a fast snatch or steal!
      if (
        (pose.phase === "grab" || pose.phase === "steal") &&
        pose.reach > 0.25 &&
        pose.reach < 0.96
      ) {
        const dirY = p === 0 ? 1 : -1;
        g.lineStyle(3, 0xfffdf5, 0.36);
        for (const sx of [-22, 0, 22]) {
          g.lineBetween(
            hx + sx,
            hy - dirY * (pose.reach * 124 - 20),
            hx + sx,
            hy - dirY * (pose.reach * 124 - 62),
          );
        }
      }

      hand(
        g,
        hx,
        hy,
        p === 0 ? 0 : Math.PI,
        color,
        pose.reach * 134,
        pose.gray,
        pose.grip,
        {
          time: this.m.time,
          phase: pose.phase,
          carrying: pose.carrying,
          wristAngle,
          recoilShake,
          lit: active,
        },
      );

      // Clean edge recovery bar along the player's side during cooldown lockout
      const remaining = Math.max(0, this.m.blockedUntil[p] - this.m.time);
      if (remaining > 0) {
        const total = Math.max(
          0.1,
          this.m.blockedUntil[p] - this.recoverStarted[p] || WRONG_TAP_COOLDOWN,
        );
        const frac = Math.min(1, remaining / total);
        const barW = 148 * frac;
        const barY = p === 0 ? 635 : 119;
        g.fillStyle(0x1f1926, 0.38).fillRoundedRect(136, barY, 148, 8, 4);
        if (barW > 4) {
          g.fillStyle(color, 0.94).fillRoundedRect(
            210 - barW / 2,
            barY,
            barW,
            8,
            4,
          );
        }
        g.lineStyle(1.8, theme.ink, 0.75).strokeRoundedRect(136, barY, 148, 8, 4);
      }
    }

    // 5. While stealing before fingers close (`!carrying`), keep the gem visible on the plinth
    if (celebrating && this.celebration) {
      const p = this.celebration - 1;
      const pose = this.hands[p].pose(this.m.time);
      if (pose.phase === "steal" && !pose.carrying) {
        gem(g, 210, 380, 1, this.m.time, true);
      }
    }

    // 6. Overhead volumetric spotlight cone & floating dust motes (outer ink frame sits unmasked on this.frame)
    if (!winnerTint) spotlightOverlay(g, active, this.m.time, signalAge);

    if (this.m.phase === "signal") {
      this.ctx.audio.play("metal", 0.85);
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
    this.g.clearMask();
    this.mask.destroy();
    this.clip.destroy();
    this.frame.destroy();
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
