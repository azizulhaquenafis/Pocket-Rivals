import config from "./config";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import type { Difficulty } from "../../shared/contracts/AIController";
import { rounded } from "../../shared/components/drawing";
import { GliderWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new GliderWorld();
  private keys = new Set<string>();
  private target: number | null = null;
  private brake = false;
  protected challenge = {
    instructions: config.instructions,
    title: "Paper Glider",
    tiers: [
      "Wide gates, gentle breezes and a landing guide.",
      "Stronger crosswinds, smaller rings and gates.",
      "Fast descent, gusty wind and precision landings.",
    ] as const,
  };
  protected configure(t: Difficulty) {
    this.w = new GliderWorld(t);
  }
  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
      "Space",
      "ArrowDown",
    ]);
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        this.target = x;
        this.brake = y > 570;
        return true;
      },
      (x, y) => {
        this.target = x;
        this.brake = y > 570;
      },
      () => this.clearTouch(),
      () => this.clearTouch(),
      { outside: true },
    );
  }
  private clearTouch() {
    this.target = null;
    this.brake = false;
  }
  protected clearInput() {
    this.clearTouch();
    this.keys.clear();
  }
  protected step(dt: number) {
    const lives = this.w.lives,
      rings = this.w.rings;
    const k = this.keys,
      steer =
        this.target === null
          ? +(k.has("ArrowRight") || k.has("KeyD")) -
            +(k.has("ArrowLeft") || k.has("KeyA"))
          : Math.max(
              -1,
              Math.min(1, (this.target - this.w.x) / 30 - this.w.wind / 135),
            );
    this.w.step(dt, steer, this.brake || k.has("Space") || k.has("ArrowDown"));
    if (this.w.rings > rings) this.ctx.audio.play("capture", 0.35);
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.45);
  }
  protected draw() {
    const w = this.w,
      g = this.g,
      cam = Math.max(0, w.y - 280),
      sy = (y: number) => 180 + y - cam;
    this.board(0xd5e9ed);
    for (let i = 0; i < 8; i++) {
      const y = 150 + ((((i * 109 - cam * 0.3) % 500) + 500) % 500),
        x = 70 + ((i * 73) % 280);
      g.fillStyle(0xfffcf3, 0.5)
        .fillEllipse(x, y, 70, 22)
        .fillCircle(x - 12, y - 9, 16);
    }
    for (const r of w.targets) {
      const y = sy(r.y);
      if (y < 130 || y > 640) continue;
      g.lineStyle(6, r.hit ? 0x91b578 : 0xf4cc60).strokeEllipse(
        r.x,
        y,
        w.settings.ring * 2,
        27,
      );
      g.lineStyle(2, 0x242b32).strokeEllipse(
        r.x,
        y,
        w.settings.ring * 2 + 6,
        33,
      );
    }
    for (const wall of w.walls) {
      const y = sy(wall.y);
      if (y < 120 || y > 640) continue;
      const a = wall.x - w.settings.gap / 2,
        b = wall.x + w.settings.gap / 2;
      rounded(g, 25, y - 9, a - 25, 18, 7, 0x9aabc2, 3);
      rounded(g, b, y - 9, 395 - b, 18, 7, 0x9aabc2, 3);
    }
    const ly = sy(w.length);
    if (ly < 660) {
      rounded(
        g,
        w.landing - w.settings.landing,
        ly,
        2 * w.settings.landing,
        28,
        7,
        0x92b875,
        3,
      );
      g.lineStyle(3, 0xfffcf3).lineBetween(
        w.landing - 20,
        ly + 14,
        w.landing + 20,
        ly + 14,
      );
      if (this.difficulty === "medium" && ly < 620)
        this.text("land", w.landing, ly - 19, "LAND", 13);
      else this.text("land", 210, 150, "", 13);
    } else this.text("land", 210, 150, "", 13);
    const y = sy(w.y);
    g.save();
    g.translateCanvas(w.x, y);
    g.rotateCanvas(-w.vx * 0.002);
    g.fillStyle(w.recovery ? 0xb4bac1 : 0xfffcf3).fillPoints(
      [
        { x: 0, y: 17 },
        { x: -17, y: -12 },
        { x: 0, y: -4 },
        { x: 17, y: -12 },
      ],
      true,
    );
    g.lineStyle(3, 0x242b32).strokePoints(
      [
        { x: 0, y: 17 },
        { x: -17, y: -12 },
        { x: 0, y: -4 },
        { x: 17, y: -12 },
      ],
      true,
    );
    g.lineStyle(2, 0x58addb).lineBetween(0, 17, 0, -4);
    g.restore();
    this.text("flight", 210, 140, `FLIGHT ${Math.min(3, w.level)} / 3`, 16);
    this.text("rings", 210, 613, w.transition ? "LANDED" : "", 15);
    g.lineStyle(3, 0x58addb, 0.7).lineBetween(190, 163, 190 + w.wind, 163);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.rings} / 6 RINGS · ${this.w.lives} LIVES`,
      result:
        this.w.level > 3
          ? "Three flights landed safely."
          : `${this.w.level - 1} flights completed.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      x: this.w.x,
      y: this.w.y,
      vx: this.w.vx,
      level: this.w.level,
      rings: this.w.rings,
      lives: this.w.lives,
      wind: this.w.wind,
    };
  }
}
