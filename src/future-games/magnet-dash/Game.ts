import config from "./config";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import type { Difficulty } from "../../shared/contracts/AIController";
import { circle, rounded } from "../../shared/components/drawing";
import { MagnetWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new MagnetWorld();
  protected challenge = {
    instructions: config.instructions,
    title: "Magnet Dash",
    tiers: [
      "Slower hazards and generous switching time.",
      "Faster rails and tighter obstacle spacing.",
      "Fast travel, strong magnets and short decisions.",
    ] as const,
  };
  protected configure(t: Difficulty) {
    this.w = new MagnetWorld(t);
  }
  protected bind() {
    const flip = () => {
      this.w.flip();
      this.ctx.audio.play("soft", 0.4);
    };
    this.tap(flip);
    this.press(["Space", "ArrowLeft", "ArrowRight"], flip);
  }
  protected step(dt: number) {
    const lives = this.w.lives;
    this.w.step(dt);
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.45);
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xd8e8ec);
    for (const [x, color] of [
      [100, 0xf49b58],
      [320, 0x58addb],
    ]) {
      rounded(g, x - 8, 120, 16, 520, 8, color, 3);
      for (let y = 130 + (w.distance % 36); y < 640; y += 36)
        g.lineStyle(2, 0xffffff, 0.6).lineBetween(x - 4, y, x + 4, y);
    }
    for (const row of w.rows) {
      const x = row.side < 0 ? 100 : 320;
      rounded(g, x - 43, row.y - 17, 86, 34, 9, 0x8f809d, 3);
      g.lineStyle(3, 0xece2f3)
        .lineBetween(x - 20, row.y - 8, x - 5, row.y + 8)
        .lineBetween(x + 5, row.y - 8, x + 20, row.y + 8);
      if (row.coin) {
        const cx = row.side < 0 ? 320 : 100;
        circle(g, cx, row.y, 10, 0xf4cc60, 2);
      }
    }
    const color = w.side < 0 ? 0xf49b58 : 0x58addb;
    g.lineStyle(2, color, 0.3).strokeCircle(
      w.x,
      500,
      25 + Math.sin(this.age * 5) * 3,
    );
    circle(g, w.x, 500, 14, w.recovery ? 0xb9bec5 : color, 3);
    this.text("polarity", w.x, 500, w.side < 0 ? "+" : "−", 22);
    this.text("distance", 210, 147, `${Math.floor(w.distance / 20)} m`, 17);
    for (let i = 0; i < 3; i++)
      circle(g, 180 + i * 30, 613, 6, i < w.lives ? 0xf49b58 : 0xb5cad0, 0);
    if (this.difficulty === "medium") {
      g.lineStyle(2, color, 0.4).lineBetween(
        w.x,
        500,
        w.side < 0 ? 115 : 305,
        500,
      );
    }
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} LIVES`,
      result: `${Math.floor(this.w.distance / 20)} metres travelled.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      x: this.w.x,
      side: this.w.side,
      rows: this.w.rows,
      lives: this.w.lives,
      time: this.w.time,
    };
  }
}
