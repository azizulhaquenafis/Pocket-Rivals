import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { rounded } from "../../shared/components/drawing";
import { SlideWorld, canMove } from "./Rules";
const X = 48,
  Y = 190,
  S = 54;
export class Game extends ArcadeGame {
  private w = new SlideWorld();
  private drag: { i: number; x: number; y: number; delta: number } | null =
    null;
  protected bind() {
    this.tap((x, y) => {
      if (y > 560 && y < 625) {
        if (this.w.cleared) this.w.next();
        else if (x < 210) this.w.undo();
        else this.w.retry();
      }
    });
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || this.w.cleared) return false;
        const i = this.w.pieces.findIndex(
          (p) =>
            x >= X + p.x * S &&
            x < X + (p.x + (p.vertical ? 1 : p.n)) * S &&
            y >= Y + p.y * S &&
            y < Y + (p.y + (p.vertical ? p.n : 1)) * S,
        );
        if (i < 0) return false;
        this.w.selected = i;
        this.drag = { i, x, y, delta: 0 };
        return true;
      },
      (x, y) => this.preview(x, y),
      (x, y) => {
        this.preview(x, y);
        if (
          this.drag &&
          this.active &&
          this.w.move(this.drag.i, this.drag.delta)
        )
          this.ctx.audio.play("slide");
        this.drag = null;
      },
      () => (this.drag = null),
      { outside: true },
    );
    this.press(["Space"], () => {
      if (this.w.cleared) this.w.next();
      else this.w.selected = (this.w.selected + 1) % this.w.pieces.length;
    });
    this.press(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], (k) => {
      const p = this.w.pieces[this.w.selected];
      if (p.vertical !== (k === "ArrowUp" || k === "ArrowDown")) return;
      if (
        this.w.move(
          this.w.selected,
          k === "ArrowUp" || k === "ArrowLeft" ? -1 : 1,
        )
      )
        this.ctx.audio.play("slide");
    });
  }
  private preview(x: number, y: number) {
    if (!this.drag) return;
    const p = this.w.pieces[this.drag.i],
      d = Math.round((p.vertical ? y - this.drag.y : x - this.drag.x) / S);
    let valid = 0;
    for (
      let k = Math.sign(d);
      Math.abs(k) <= Math.abs(d) && k !== 0;
      k += Math.sign(d)
    ) {
      if (!canMove(this.w.pieces, this.drag.i, k)) break;
      valid = k;
    }
    this.drag.delta = valid;
  }
  protected clearInput() {
    this.drag = null;
  }
  protected step(_dt: number) {}
  protected draw() {
    const g = this.g,
      w = this.w;
    this.board(0xe7e1cb);
    rounded(g, X - 5, Y - 5, S * 6 + 10, S * 6 + 10, 12, 0xfaf7ed, 3);
    g.lineStyle(1, 0x242b32, 0.09);
    for (let i = 1; i < 6; i++) {
      g.lineBetween(X + i * S, Y, X + i * S, Y + S * 6);
      g.lineBetween(X, Y + i * S, X + S * 6, Y + i * S);
    }
    g.fillStyle(0xf49b58).fillTriangle(
      382,
      Y + 2.5 * S,
      373,
      Y + 2.5 * S - 12,
      373,
      Y + 2.5 * S + 12,
    );
    w.pieces.forEach((p, i) => {
      const d = this.drag?.i === i ? this.drag.delta : 0,
        x = X + (p.x + (p.vertical ? 0 : d)) * S + 4,
        y = Y + (p.y + (p.vertical ? d : 0)) * S + 4;
      rounded(
        g,
        x,
        y,
        S * (p.vertical ? 1 : p.n) - 8,
        S * (p.vertical ? p.n : 1) - 8,
        10,
        i === 0 ? 0xf49b58 : [0x58addb, 0x9ac480, 0xa88dc4][i % 3],
        w.selected === i ? 4 : 2,
      );
    });
    this.text(
      "level",
      210,
      145,
      w.cleared ? "PATH CLEAR" : `PUZZLE ${w.level + 1} / 8`,
      18,
    );
    rounded(g, 55, 565, 310, 48, 12, 0xfffdf5, 2);
    this.text(
      "buttons",
      210,
      590,
      w.cleared ? "NEXT →" : "UNDO                 RETRY",
      17,
    );
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.moves} MOVES`,
      result: "All eight puzzles solved.",
    };
  }
  snapshot() {
    return {
      ...this.state(),
      pieces: this.w.pieces.map((p) => ({ ...p })),
      level: this.w.level,
      moves: this.w.moves,
      cleared: this.w.cleared,
      selected: this.w.selected,
    };
  }
}
