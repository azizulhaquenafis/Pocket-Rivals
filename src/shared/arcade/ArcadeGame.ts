import { ArcadeSetup, type ArcadeChallenge } from "./ArcadeSetup";
import { drawHeartsHUD } from "./hearts";
import type { Difficulty } from "../contracts/AIController";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../contracts/GameModule";
import { FixedStep } from "../physics/FixedStep";
import { rounded, label } from "../components/drawing";
/** Presentation/lifecycle only. Each module owns its rules, controls and scoring. */
export abstract class ArcadeGame implements MiniGame {
  protected ctx!: GameContext;
  protected g!: Phaser.GameObjects.Graphics;
  protected paused = false;
  protected age = 0;
  protected difficulty: Difficulty = "medium";
  protected started = false;
  protected challenge?: ArcadeChallenge;
  private setup?: ArcadeSetup;
  protected configure(_tier: Difficulty) {}
  private reported = false;
  protected ending = 0;
  protected endDelay = 0.7;
  private fixed = new FixedStep();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private lastHUD = "";
  private lastHearts = "";
  private lastScore = 0;
  private clip!: Phaser.GameObjects.Graphics;
  private mask!: Phaser.Display.Masks.GeometryMask;
  private hudG!: Phaser.GameObjects.Graphics;
  protected abstract bind(): void;
  protected abstract step(dt: number): void;
  protected stepEnding(_dt: number) {}
  protected abstract draw(): void;
  protected get alpha() {
    return this.fixed.fraction;
  }
  protected abstract state(): {
    score: number;
    done: boolean;
    detail: string;
    result: string;
    lives?: number;
    maxLives?: number;
  };
  protected clearInput() {}
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.clip = ctx.scene.make.graphics({ x: 0, y: 0 });
    this.clip.fillStyle(0xffffff).fillRoundedRect(22, 110, 376, 542, 22);
    this.mask = this.clip.createGeometryMask();
    this.g.setMask(this.mask);
    this.hudG = ctx.scene.add.graphics();
    ctx.setHint("");
    ctx.setClock("", false);
    const start = (tier: Difficulty) => {
      this.difficulty = tier;
      this.configure(tier);
      this.bind();
      this.started = true;
      this.fixed.reset();
      this.render();
      ctx.audio.play("start", 0.5);
    };
    this.render();
    if (this.challenge) this.setup = new ArcadeSetup(this.challenge, start);
    else start("medium");
  }
  protected get active() {
    return this.started && !this.paused && !this.reported && !this.state().done;
  }
  protected tap(fn: (x: number, y: number) => void) {
    this.ctx.input.tap((x, y) => {
      if (this.active && x >= 24 && x <= 396 && y >= 112 && y <= 650) fn(x, y);
    });
  }
  protected press(keys: string[], fn: (key: string) => void) {
    this.ctx.input.press(keys, (key) => {
      if (this.active) fn(key);
    });
  }
  protected text(
    id: string,
    x: number,
    y: number,
    value: string,
    size = 16,
    color = "#242b32",
    alpha = 1,
  ) {
    let t = this.labels.get(id);
    if (!t) {
      t = label(this.ctx.scene, x, y, value, size, color);
      this.labels.set(id, t);
    }
    if (t.text !== value) t.setText(value);
    t.setPosition(x, y);
    if (t.alpha !== alpha) t.setAlpha(alpha);
    // Text.setColor always rerasterizes and uploads a canvas, even unchanged.
    if (t.style.color !== color) t.setColor(color);
  }
  protected board(color: number) {
    rounded(this.g, 24, 112, 372, 538, 20, color, 4);
  }
  private render() {
    this.g.clear();
    this.draw();
    this.g.lineStyle(4, 0x242b32).strokeRoundedRect(24, 112, 372, 538, 20);
    const s = this.state();
    // Never show lives or bottom status details on the pre-game challenge entrance screen.
    const showHearts = this.started && s.lives !== undefined;
    const detail = !this.started || showHearts ? "" : s.detail;
    const hud = `${s.score}:${detail}`;
    if (hud !== this.lastHUD) {
      this.lastHUD = hud;
      this.ctx.setArcadeHUD(s.score, detail);
    }
    const heartsKey = showHearts
      ? `${s.lives}:${s.maxLives ?? Math.max(3, s.lives!)}`
      : "";
    if (heartsKey !== this.lastHearts) {
      this.lastHearts = heartsKey;
      if (showHearts) {
        drawHeartsHUD(
          this.hudG,
          s.lives!,
          s.maxLives ?? Math.max(3, s.lives!),
        );
      } else {
        this.hudG.clear();
      }
    }
  }
  update(dt: number) {
    if (!this.started || this.paused || this.reported) return;
    this.fixed.advance(dt, (h) => {
      this.age += h;
      if (!this.state().done) this.step(h);
      else {
        this.ending += h;
        this.stepEnding(h);
      }
    });
    const s = this.state();
    if (s.score > this.lastScore) this.ctx.audio.play("capture", 0.35);
    this.lastScore = s.score;
    this.render();
    if (s.done && this.ending > this.endDelay) {
      this.reported = true;
      this.clearInput();
      this.ctx.finishArcade(s.score, s.result);
    }
  }
  pause() {
    this.paused = true;
    this.setup?.setPaused(true);
    this.fixed.reset();
    this.clearInput();
  }
  resume() {
    this.paused = false;
    this.setup?.setPaused(false);
  }
  dispose() {
    this.setup?.destroy();
    this.reported = true;
    this.clearInput();
    this.labels.forEach((t) => t.destroy());
    this.labels.clear();
    this.g.destroy();
    this.hudG.destroy();
    this.mask.destroy();
    this.clip.destroy();
  }
}
