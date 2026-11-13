import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { rounded, circle } from "../../shared/components/drawing";
import { RicochetWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new RicochetWorld();
  private aim: { x: number; y: number } | null = null;
  protected bind() {
    this.ctx.input.drag(
      (x, y) => {
        if (
          !this.active ||
          this.w.moving ||
          this.w.transition ||
          Math.hypot(x - this.w.ball.x, y - this.w.ball.y) > 55
        )
          return false;
        this.aim = { x, y };
        return true;
      },
      (x, y) => {
        if (this.aim) this.aim = { x, y };
      },
      (x, y) => {
        if (
          this.aim &&
          this.active &&
          this.w.fire((this.w.ball.x - x) * 3, (this.w.ball.y - y) * 3)
        )
          this.ctx.audio.play("shoot");
        this.aim = null;
      },
      () => (this.aim = null),
      { outside: true },
    );
    this.press(
      ["ArrowLeft", "ArrowRight", "KeyA", "KeyD"],
      (k) => (this.w.angle += k === "ArrowLeft" || k === "KeyA" ? -0.08 : 0.08),
    );
    this.press(["Space", "Enter"], () => {
      if (
        this.w.fire(Math.cos(this.w.angle) * 400, Math.sin(this.w.angle) * 400)
      )
        this.ctx.audio.play("shoot");
    });
  }
  protected clearInput() {
    this.aim = null;
  }
  protected step(dt: number) {
    this.w.step(dt);
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xe1ecd9);
    rounded(g, 40, 150, 340, 478, 14, 0xfaf7ee, 2);
    for (const r of w.walls) rounded(g, r.x, r.y, r.w, r.h, 5, 0x9a8aa9, 3);
    for (const t of w.targets)
      if (t.alive) {
        circle(g, t.x, t.y, 14, 0x58addb, 3);
        circle(g, t.x, t.y, 5, 0xfffdf5, 0);
      }
    const b = w.ball;
    if (!w.moving && !w.transition) {
      let dx = Math.cos(w.angle) * 75,
        dy = Math.sin(w.angle) * 75;
      if (this.aim) {
        dx = b.x - this.aim.x;
        dy = b.y - this.aim.y;
        const d = Math.hypot(dx, dy) || 1;
        dx *= Math.min(100, d) / d;
        dy *= Math.min(100, d) / d;
      }
      g.lineStyle(3, 0xf49b58, 0.7).lineBetween(b.x, b.y, b.x + dx, b.y + dy);
    }
    circle(g, b.x, b.y, 7, 0xf49b58, 2);
    this.text(
      "status",
      210,
      133,
      w.transition ? "ROOM CLEAR" : `ROOM ${w.level + 1} / 8`,
      14,
    );
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.shots} SHOTS LEFT`,
      result: this.w.won
        ? "All eight rooms cleared."
        : `Reached room ${this.w.level + 1}.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      level: this.w.level,
      ball: { ...this.w.ball },
      targets: this.w.targets,
      moving: this.w.moving,
      shots: this.w.shots,
    };
  }
}
