import config from "./config";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import type { Difficulty } from "../../shared/contracts/AIController";
import { circle, rounded } from "../../shared/components/drawing";
import { DriftWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new DriftWorld();
  private keys = new Set<string>();
  private touch = 0;
  private braking = false;
  protected challenge = {
    instructions: config.instructions,
    title: "Pocket Drift",
    tiers: [
      "Wide track, steady grip and a guiding racing line.",
      "Faster car, narrower track and more slide.",
      "Maximum speed, tight margins and loose grip.",
    ] as const,
  };
  protected configure(t: Difficulty) {
    this.w = new DriftWorld(t);
  }
  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
      "Space",
    ]);
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || y < 112 || y > 650 || x < 24 || x > 396)
          return false;
        this.control(x, y);
        return true;
      },
      (x, y) => this.control(x, y),
      () => this.clearTouch(),
      () => this.clearTouch(),
      { outside: true },
    );
  }
  private control(x: number, y: number) {
    this.touch = x < 170 ? -1 : x > 250 ? 1 : 0;
    this.braking = y > 580;
  }
  private clearTouch() {
    this.touch = 0;
    this.braking = false;
  }
  protected clearInput() {
    this.clearTouch();
    this.keys.clear();
  }
  protected step(dt: number) {
    const lives = this.w.lives;
    this.w.step(
      dt,
      this.touch ||
        +this.keys.has("ArrowRight") +
          +this.keys.has("KeyD") -
          +this.keys.has("ArrowLeft") -
          +this.keys.has("KeyA"),
      this.braking || this.keys.has("Space"),
    );
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.45);
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xd9e6cf);
    const outer = 1 + w.settings.width / 124,
      inner = 1 - w.settings.width / 124;
    g.fillStyle(0xe7e0d1).fillEllipse(210, 383, 248 * outer, 392 * outer, 128);
    g.lineStyle(4, 0x242b32).strokeEllipse(
      210,
      383,
      248 * outer,
      392 * outer,
      128,
    );
    g.fillStyle(0xbcd0a7).fillEllipse(210, 383, 248 * inner, 392 * inner, 128);
    g.lineStyle(4, 0x242b32).strokeEllipse(
      210,
      383,
      248 * inner,
      392 * inner,
      128,
    );
    if (this.difficulty === "medium") {
      g.lineStyle(2, 0xfffcf3, 0.7);
      for (let a = 0; a < Math.PI * 2; a += 0.22) {
        const p = w.point(a),
          q = w.point(a + 0.1);
        g.lineBetween(p.x, p.y, q.x, q.y);
      }
    }
    const target = w.point(Math.PI / 2 - ((w.checkpoint + 1) * Math.PI) / 2);
    circle(g, target.x, target.y, 14, 0xf4cc60, 2);
    this.text("gate", target.x, target.y, "›", 22);
    for (const b of w.barriers) {
      circle(g, b.x, b.y, b.r, 0xeaa781, 2);
      circle(g, b.x, b.y, 3, 0xfffcf3, 0);
    }
    g.lineStyle(3, 0x79786f, 0.3);
    for (let i = 1; i < w.trail.length; i++)
      g.lineBetween(
        w.trail[i - 1].x,
        w.trail[i - 1].y,
        w.trail[i].x,
        w.trail[i].y,
      );
    g.save();
    g.translateCanvas(w.x, w.y);
    g.rotateCanvas(w.angle);
    rounded(g, -14, -9, 28, 18, 6, w.recovery ? 0xc6bfb0 : 0xf49b58, 3);
    rounded(g, 1, -7, 7, 14, 2, 0xe7f4f5, 1);
    g.fillStyle(0x242b32).fillRect(-10, -12, 8, 3).fillRect(-10, 9, 8, 3);
    g.restore();
    this.text("lap", 210, 360, `${Math.min(3, w.lap + 1)} / 3`, 28);
    this.text("time", 210, 394, `${Math.max(0, Math.ceil(100 - w.time))}s`, 17);
    this.text(
      "combo",
      210,
      423,
      w.combo > 0.5 ? "DRIFT ×" + (1 + Math.floor(w.combo)) : "",
      15,
    );
    for (let i = 0; i < 5; i++)
      circle(g, 174 + i * 18, 452, 4, i < w.lives ? 0xf49b58 : 0x91a386, 0);
    this.text("left", 73, 616, "↶", 27);
    this.text("right", 347, 616, "↷", 27);
    this.text("brake", 210, 620, "BRAKE", 13);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `LAP ${Math.min(3, this.w.lap + 1)} / 3`,
      result:
        this.w.lap === 3
          ? "Three laps complete."
          : `${this.w.lap} laps completed.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      x: this.w.x,
      y: this.w.y,
      angle: this.w.angle,
      lap: this.w.lap,
      lives: this.w.lives,
      time: this.w.time,
    };
  }
}
