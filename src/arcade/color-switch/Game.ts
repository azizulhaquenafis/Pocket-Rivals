import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle } from "../../shared/components/drawing";
import { ColorWorld, COLORS } from "./Rules";
export class Game extends ArcadeGame {
  private w = new ColorWorld();
  protected challenge = {
    title: "Color Switch",
    tiers: [
      "Gentle rotation with a matching-color cue.",
      "Faster rings. Read the colors and time your hops.",
      "Quick rotation with a tighter collision window.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new ColorWorld(tier);
  }
  protected bind() {
    const hop = () => {
      this.w.hop();
      this.ctx.audio.play("soft", 0.4);
    };
    this.tap(hop);
    this.press(["Space", "ArrowUp", "KeyW"], hop);
  }
  protected step(dt: number) {
    const lives = this.w.lives;
    this.w.step(dt);
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.4);
  }
  protected draw() {
    const g = this.g,
      w = this.w;
    this.board(0xf0e7ee);
    g.fillStyle(0xffffff, 0.45)
      .fillCircle(90, 250, 110)
      .fillCircle(350, 490, 130);
    for (let i = 0; i < 12; i++) {
      g.fillStyle(COLORS[i % 4], 0.22).fillCircle(
        55 + ((i * 89) % 310),
        180 + ((i * 67) % 420),
        3 + (i % 3),
      );
    }
    const cy = w.center + w.camera;
    g.lineStyle(1, 0xffffff, 0.9).strokeCircle(210, cy, 99);
    g.fillStyle(0xffffff, 0.32).fillCircle(210, cy, 60);
    for (let i = 0; i < 4; i++) {
      g.lineStyle(18, 0x242b32)
        .beginPath()
        .arc(
          210,
          cy,
          75,
          w.angle + (i * Math.PI) / 2,
          w.angle + ((i + 1) * Math.PI) / 2,
          false,
        )
        .strokePath();
      g.lineStyle(12, COLORS[i])
        .beginPath()
        .arc(
          210,
          cy,
          75,
          w.angle + (i * Math.PI) / 2 + 0.015,
          w.angle + ((i + 1) * Math.PI) / 2 - 0.015,
          false,
        )
        .strokePath();
    }
    if (this.difficulty === "medium" && !w.transition) {
      for (const side of [-1, 1]) {
        const matching = w.ringColor(w.center + side * 75) === w.color;
        if (matching)
          g.lineStyle(3, COLORS[w.color], 0.65).strokeCircle(
            210,
            cy + side * 75,
            14 + Math.sin(this.age * 5) * 2,
          );
      }
    }
    g.lineStyle(4, 0x9e91aa).lineBetween(
      145,
      w.floor + w.camera + 10,
      275,
      w.floor + w.camera + 10,
    );
    g.fillStyle(COLORS[w.color], 0.16).fillEllipse(
      210,
      w.floor + w.camera + 11,
      40,
      9,
    );
    circle(g, 210, w.y + w.camera, 8, w.grace ? 0xaaa6ac : COLORS[w.color], 2);
    g.fillStyle(0xffffff, 0.9).fillCircle(207, w.y + w.camera - 3, 2.3);
    this.text("level", 210, 135, `RING ${w.level}`, 14);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} LIVES`,
      result: `${this.w.level - 1} rings crossed.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      transition: this.w.transition,
      camera: this.w.camera,
      floor: this.w.floor,
      center: this.w.center,
      y: this.w.y,
      vy: this.w.vy,
      angle: this.w.angle,
      color: this.w.color,
      level: this.w.level,
      lives: this.w.lives,
    };
  }
}
