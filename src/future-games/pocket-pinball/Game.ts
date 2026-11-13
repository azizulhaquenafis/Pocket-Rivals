import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle, rounded } from "../../shared/components/drawing";
import { PinballWorld, BUMPERS } from "./Rules";
export class Game extends ArcadeGame {
  private w = new PinballWorld();
  private keys = new Set<string>();
  private held: [boolean, boolean] = [false, false];
  private pulse = [0, 0];
  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
    ]);
    this.press(["Space", "Enter"], () => {
      if (this.w.launch()) this.ctx.audio.play("shoot");
    });
    this.tap((x, y) => {
      if (y > 595 && Math.abs(x - 210) < 55) {
        this.w.launch();
        return;
      }
      this.pulse[x < 210 ? 0 : 1] = 0.16;
      this.ctx.audio.play("wood", 0.3);
    });
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || y < 160 || y > 595) return false;
        this.held[x < 210 ? 0 : 1] = true;
        return true;
      },
      () => {},
      () => (this.held = [false, false]),
      () => (this.held = [false, false]),
    );
  }
  protected clearInput() {
    this.held = [false, false];
    this.pulse = [0, 0];
  }
  protected step(dt: number) {
    this.pulse = this.pulse.map((t) => Math.max(0, t - dt));
    this.w.step(
      dt,
      this.held[0] ||
        this.pulse[0] > 0 ||
        this.keys.has("ArrowLeft") ||
        this.keys.has("KeyA"),
      this.held[1] ||
        this.pulse[1] > 0 ||
        this.keys.has("ArrowRight") ||
        this.keys.has("KeyD"),
    );
  }
  protected draw() {
    const g = this.g,
      w = this.w;
    this.board(0xd5e8ef);
    rounded(g, 38, 156, 344, 476, 26, 0xf8f5e9, 3);
    for (const p of BUMPERS) {
      circle(g, p.x, p.y, p.r, 0x58addb, 4);
      circle(g, p.x, p.y, p.r * 0.4, 0xf4cc60, 2);
    }
    g.lineStyle(16, 0x242b32)
      .lineBetween(48, 460, 120, 545)
      .lineBetween(372, 460, 300, 545);
    g.lineStyle(10, 0x9ac480)
      .lineBetween(48, 460, 120, 545)
      .lineBetween(372, 460, 300, 545);
    for (const side of [0, 1] as const) {
      const f = w.flipper(side);
      g.lineStyle(20, 0x242b32).lineBetween(f.ax, f.ay, f.bx, f.by);
      g.lineStyle(14, side ? 0x58addb : 0xf49b58).lineBetween(
        f.ax,
        f.ay,
        f.bx,
        f.by,
      );
      circle(g, f.ax, f.ay, 10, side ? 0x58addb : 0xf49b58, 3);
      circle(g, f.bx, f.by, 8, side ? 0x58addb : 0xf49b58, 2);
    }
    for (const b of w.balls) circle(g, b.x, b.y, 7, 0xffffff, 2);
    this.text("top", 210, 134, w.combo > 1 ? `${w.combo}× COMBO` : "", 14);
    this.text("launch", 210, 618, w.balls.length ? "" : "LAUNCH ↑", 18);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} BALLS · ${this.w.hits} HITS`,
      result: `${this.w.hits} bumper hits.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      balls: this.w.balls.map((b) => ({ ...b })),
      lives: this.w.lives,
      left: this.w.left,
      right: this.w.right,
    };
  }
}
