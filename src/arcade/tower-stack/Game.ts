import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { rounded } from "../../shared/components/drawing";
import { TowerWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new TowerWorld();
  protected override autoScoreSound = false;
  protected challenge = {
    title: "Tower Stack",
    tiers: [
      "Slower blocks, alignment guides and forgiving perfects.",
      "Faster blocks and tighter perfect placements.",
      "Fast blocks, precise placement and no guides.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new TowerWorld(tier);
  }
  protected bind() {
    const drop = () => {
      const ok = this.w.drop();
      if (!ok) {
        this.ctx.audio.play("fall", 0.85);
      } else if (this.w.flash) {
        this.ctx.audio.play("perfect", Math.min(1, 0.72 + this.w.combo * 0.06));
      } else {
        this.ctx.audio.play("wood", 0.8);
        this.ctx.audio.play("slice", 0.55);
      }
    };
    this.tap(drop);
    this.press(["Space", "Enter"], drop);
  }
  protected step(dt: number) {
    this.w.step(dt);
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xe6dded);
    for (const b of w.blocks)
      rounded(
        g,
        b.x,
        595 - b.level * 28 + w.camera,
        b.width,
        26,
        4,
        b.level % 2 ? 0x58addb : 0xf49b58,
        3,
      );
    if (this.difficulty === "medium") {
      g.lineStyle(2, 0x242b32, 0.2);
      for (const x of [w.top.x, w.top.x + w.top.width])
        g.lineBetween(
          x,
          595 - w.moving.level * 28 + w.camera - 15,
          x,
          595 - w.top.level * 28 + w.camera,
        );
    }
    const m = w.moving;
    if (!w.done)
      rounded(
        g,
        m.x,
        595 - m.level * 28 + w.camera,
        m.width,
        26,
        4,
        w.flash ? 0xf4cc60 : 0x92b875,
        3,
      );
    g.fillStyle(0xb3a1bd, 0.65);
    for (const p of w.debris) g.fillRect(p.x, p.y + w.camera, p.width, 24);
    this.text("level", 210, 140, w.flash ? "PERFECT" : "", 18);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.top.level} BLOCKS`,
      result: `${this.w.top.level} blocks stacked.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      moving: { ...this.w.moving },
      top: { ...this.w.top },
      combo: this.w.combo,
    };
  }
}
