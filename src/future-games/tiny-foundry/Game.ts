import { MOLDS } from "./Molds";
import config from "./config";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import type { Difficulty } from "../../shared/contracts/AIController";
import { circle, rounded } from "../../shared/components/drawing";
import { FoundryWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new FoundryWorld();
  private keys = new Set<string>();
  private pointer = false;
  protected challenge = {
    instructions: config.instructions,
    title: "Tiny Foundry",
    tiers: [
      "Wide molds, slow conveyor and forgiving fill targets.",
      "Faster molds and tighter casting tolerances.",
      "Narrow fast molds. Every drop matters.",
    ] as const,
  };
  protected configure(t: Difficulty) {
    this.w = new FoundryWorld(t);
  }
  protected bind() {
    this.keys = this.ctx.input.keys(["Space"]);
    this.press(["Enter"], () => this.w.finish());
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        if (y > 580) {
          this.w.finish();
          return false;
        }
        this.pointer = true;
        return true;
      },
      () => {},
      () => {
        this.pointer = false;
        this.w.hold(false);
      },
      () => {
        this.pointer = false;
        this.w.hold(false);
      },
      { outside: true },
    );
  }
  protected clearInput() {
    this.keys.clear();
    this.pointer = false;
    this.w.hold(false);
  }
  protected step(dt: number) {
    const lives = this.w.lives;
    this.w.hold(this.pointer || this.keys.has("Space"));
    this.w.step(dt);
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.45);
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xf0e1cf);
    rounded(g, 75, 179, 270, 55, 14, 0x8f819b, 3);
    rounded(g, 191, 226, 38, 30, 6, 0x64727b, 3);
    g.fillStyle(0xf4cc60).fillRoundedRect(90, 193, 75 + 20 * w.upgrade, 14, 5);
    for (let i = 0; i < 3; i++) circle(g, 286 + i * 15, 207, 3, 0xfffcf3, 0);
    g.fillStyle(0xebb98b, 0.25).fillTriangle(210, 260, 130, 473, 290, 473);
    rounded(g, 38, 554, 344, 22, 9, 0x8c9c9a, 3);
    for (let i = 0; i < 12; i++)
      circle(g, 48 + ((i * 30 + w.time * 30) % 324), 565, 4, 0x566869, 0);
    const x = w.x,
      width = w.settings.width;
    const mold = MOLDS[(Math.min(8, w.level) - 1) % MOLDS.length],
      map = (p: { x: number; y: number }) => ({
        x: x + p.x * width,
        y: 480 + p.y * 66,
      });
    const outline = mold.outline.map(map);
    g.fillStyle(0xfffcf3).fillPoints(outline, true);
    g.lineStyle(9, 0x8a999f).strokePoints(outline, true);
    if (w.fill > 0)
      g.fillStyle(0xf49b58).fillPoints(
        mold.fills[Math.round(w.fill)].points.map(map),
        true,
      );
    g.lineStyle(3, 0x242b32).strokePoints(outline, true);
    const targetY = 480 + mold.fills[w.target].y * 66;
    g.lineStyle(3, 0x242b32).lineBetween(
      x - width / 2 - 7,
      targetY,
      x + width / 2 + 7,
      targetY,
    );
    for (const d of w.drops) circle(g, d.x, d.y, 3, 0xf49b58, 0);
    this.text("stage", 210, 141, `CAST ${Math.min(8, w.level)} / 8`, 17);
    this.text("target", 100, 315, `${w.target}%`, 26);
    this.text("fill", 315, 315, `${Math.round(w.fill)}%`, 26);
    this.text("target-label", 100, 343, "TARGET", 12);
    this.text("fill-label", 315, 343, "FILLED", 12);
    this.text(
      "status",
      210,
      420,
      w.transition ? (w.accepted ? "CAST ACCEPTED" : "TRY AGAIN") : "",
      16,
    );
    this.text("upgrade", 315, 370, w.upgrade ? `NOZZLE +${w.upgrade}` : "", 13);
    rounded(
      g,
      104,
      594,
      212,
      40,
      12,
      w.settling || w.transition ? 0xc7c9be : 0x92b875,
      3,
    );
    this.text(
      "finish",
      210,
      614,
      w.settling && !w.transition
        ? "COOLING…"
        : w.transition
          ? `${w.grade} / 100`
          : "FINISH CAST",
      16,
    );
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} LIVES`,
      result:
        this.w.level > 8
          ? "Eight precision casts completed."
          : `${this.w.level - 1} casts completed.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      level: this.w.level,
      fill: this.w.fill,
      x: this.w.x,
      drops: this.w.drops.length,
      age: this.w.age,
      pouring: this.w.pouring,
      settling: this.w.settling,
    };
  }
}
