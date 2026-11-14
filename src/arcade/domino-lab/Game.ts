import config from "./config";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import type { Difficulty } from "../../shared/contracts/AIController";
import { circle, rounded } from "../../shared/components/drawing";
import { DominoWorld, OX, OY, SIZE, type Cell } from "./Rules";
export class Game extends ArcadeGame {
  private w = new DominoWorld();
  protected challenge = {
    instructions: config.instructions,
    title: "Domino Lab",
    tiers: [
      "Long dominoes, reach guides and three spare pieces.",
      "Shorter reach and one spare piece.",
      "Exact piece budget. Plan without reach guides.",
    ] as const,
  };
  protected configure(t: Difficulty) {
    this.w = new DominoWorld(t);
  }
  private action(x: number, y: number) {
    if (y > 585) {
      if (x < 140) this.w.undo();
      else if (x > 280) {
        if (this.w.launch()) this.ctx.audio.play("wood", 0.5);
      } else if (this.w.phase === "plan") this.w.pieces = [];
      return;
    }
    const p = {
      c: Math.floor((x - OX) / SIZE),
      r: Math.floor((y - OY) / SIZE),
    };
    if (this.w.place(p)) this.ctx.audio.play("wood", 0.3);
  }
  protected bind() {
    this.tap((x, y) => this.action(x, y));
    this.press(
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Space",
        "Enter",
        "Backspace",
        "KeyR",
      ],
      (k) => {
        const w = this.w;
        if (k === "Enter") {
          if (w.launch()) this.ctx.audio.play("wood", 0.5);
        } else if (k === "Backspace") w.undo();
        else if (k === "KeyR" && w.phase === "plan") w.pieces = [];
        else if (k === "Space") w.place(w.cursor);
        else {
          w.cursor.c = Math.max(
            0,
            Math.min(
              6,
              w.cursor.c +
                (k === "ArrowRight" ? 1 : k === "ArrowLeft" ? -1 : 0),
            ),
          );
          w.cursor.r = Math.max(
            0,
            Math.min(
              8,
              w.cursor.r + (k === "ArrowDown" ? 1 : k === "ArrowUp" ? -1 : 0),
            ),
          );
        }
      },
    );
  }
  protected step(dt: number) {
    const lives = this.w.lives,
      domino = this.w.active;
    this.w.step(dt);
    if (this.w.active > domino) this.ctx.audio.play("wood", 0.2);
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.45);
  }
  private point(p: Cell) {
    return { x: OX + p.c * SIZE + SIZE / 2, y: OY + p.r * SIZE + SIZE / 2 };
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xe5e5cf);
    this.text("level", 210, 140, `LAB ${Math.min(6, w.level)} / 6`, 17);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 7; c++) {
        const p = this.point({ c, r });
        if (w.walls.has(r * 7 + c))
          rounded(g, p.x - 18, p.y - 18, 36, 36, 7, 0xb5b7a2, 2);
        else circle(g, p.x, p.y, 2, 0xb3b7a3, 0);
      }
    const chain = w.chain,
      last = chain[chain.length - 2],
      p = this.point(last);
    if (w.phase === "plan" && w.settings.guides) {
      g.lineStyle(1, 0x58addb, 0.6).strokeCircle(p.x, p.y, w.settings.reach);
    }
    for (let i = 0; i < chain.length; i++) {
      const a = this.point(chain[i]),
        b = this.point(chain[Math.min(i + 1, chain.length - 1)]),
        angle = w.angles[i] || 0,
        rot = Math.atan2(b.y - a.y, b.x - a.x),
        length = 13 + Math.sin(angle) * (w.settings.reach - 13);
      if (
        i < chain.length - 1 &&
        w.phase === "plan" &&
        (i < chain.length - 2 ||
          w.distance(chain[i], chain[i + 1]) <= w.settings.reach)
      ) {
        g.lineStyle(
          2,
          w.distance(chain[i], chain[i + 1]) <= w.settings.reach &&
            w.clearLine(chain[i], chain[i + 1])
            ? 0x82997a
            : 0xd17a68,
          0.6,
        ).lineBetween(a.x, a.y, b.x, b.y);
      }
      g.save();
      g.translateCanvas(a.x, a.y);
      g.rotateCanvas(rot);
      rounded(
        g,
        -6,
        -7,
        length,
        14,
        4,
        i === chain.length - 1 ? 0xf4cc60 : i === 0 ? 0x58addb : 0xf49b58,
        2,
      );
      g.lineStyle(1, 0x242b32).lineBetween(0, -5, 0, 5);
      g.fillStyle(0xfffcf3).fillCircle(5, 0, 2);
      g.restore();
    }
    if (w.phase === "plan") {
      const a = this.point(w.cursor);
      g.lineStyle(2, 0x58addb, 0.65).strokeRoundedRect(
        a.x - 17,
        a.y - 17,
        34,
        34,
        6,
      );
    }
    this.text(
      "pieces",
      210,
      565,
      w.phase === "clear"
        ? "CHAIN COMPLETE"
        : w.phase === "miss"
          ? "ADJUST YOUR CHAIN"
          : `${w.budget - w.pieces.length} PIECES · ${w.lives} TRIES`,
      15,
    );
    for (const [x, title, color] of [
      [87, "Undo", 0xfffcf3],
      [210, "Clear", 0xfffcf3],
      [333, "Topple", 0x58addb],
    ] as const) {
      rounded(g, x - 49, 592, 98, 43, 12, color, 2);
      this.text(title, x, 614, title, 16);
    }
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} TRIES`,
      result:
        this.w.level > 6
          ? "Six chain reactions mastered."
          : `${this.w.level - 1} puzzles solved.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      level: this.w.level,
      phase: this.w.phase,
      pieces: this.w.pieces,
      budget: this.w.budget,
      cursor: this.w.cursor,
    };
  }
}
