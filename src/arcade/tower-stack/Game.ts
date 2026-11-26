import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { rounded } from "../../shared/components/drawing";
import config from "./config";
import { PERFECT_FLASH, TowerWorld } from "./Rules";

export class Game extends ArcadeGame {
  private w = new TowerWorld();
  protected override autoScoreSound = false;
  protected challenge = {
    title: "Tower Stack",
    instructions: config.instructions,
    desktopControls: config.desktopControls?.ai,
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

    // Subtle sunlit glow aura behind the newly landed block on a perfect stack
    if (w.flash > 0 && w.blocks.length > 1) {
      const top = w.top;
      const topY = 595 - top.level * 28 + w.camera;
      const p = 1 - Math.min(1, w.flash / PERFECT_FLASH);
      const fade = Math.sin(p * Math.PI);
      const decay = 1 - p;
      const padOuter = 7 + p * 14;
      const padInner = 3 + p * 6;
      g.fillStyle(0xffe680, 0.17 * decay).fillRoundedRect(
        top.x - padOuter,
        topY - padOuter * 0.65,
        top.width + padOuter * 2,
        26 + padOuter * 1.3,
        10,
      );
      g.fillStyle(0xfff6c8, 0.3 * fade).fillRoundedRect(
        top.x - padInner,
        topY - padInner * 0.6,
        top.width + padInner * 2,
        26 + padInner * 1.2,
        7,
      );
    }

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

    // Crisp luminous sheen + expanding edge ring & delicate corner glints over the perfect block
    if (w.flash > 0 && w.blocks.length > 1) {
      const top = w.top;
      const topY = 595 - top.level * 28 + w.camera;
      const p = 1 - Math.min(1, w.flash / PERFECT_FLASH);
      const fade = Math.sin(p * Math.PI);
      const decay = 1 - p;
      const ring = 2 + p * 12;
      g.fillStyle(0xfffdf5, 0.42 * fade).fillRoundedRect(
        top.x + 2,
        topY + 2,
        Math.max(2, top.width - 4),
        9,
        3,
      );
      g.lineStyle(2.4 * (1 - p * 0.45), 0xfffce4, 0.85 * decay).strokeRoundedRect(
        top.x - ring,
        topY - ring * 0.55,
        top.width + ring * 2,
        26 + ring * 1.1,
        7,
      );
      for (const side of [-1, 1] as const) {
        for (let k = 0; k < 2; k++) {
          const sx =
            (side < 0 ? top.x : top.x + top.width) + side * (8 + p * (18 + k * 10));
          const sy = topY + (k === 0 ? 4 : 20) - p * 6;
          const r = (4.5 - k * 1.2) * fade;
          if (r > 0.6) {
            g.fillStyle(0xfffce4, 0.9 * decay);
            g.fillTriangle(sx, sy - r, sx + r * 0.35, sy, sx - r * 0.35, sy);
            g.fillTriangle(sx, sy + r, sx + r * 0.35, sy, sx - r * 0.35, sy);
            g.fillTriangle(sx - r, sy, sx, sy + r * 0.35, sx, sy - r * 0.35);
            g.fillTriangle(sx + r, sy, sx, sy + r * 0.35, sx, sy - r * 0.35);
          }
        }
      }
    }

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
        0x92b875,
        3,
      );
    g.fillStyle(0xb3a1bd, 0.65);
    for (const p of w.debris) g.fillRect(p.x, p.y + w.camera, p.width, 24);
    const labelAlpha = w.flash > 0 ? Math.min(1, w.flash / 0.18) : 0;
    this.text(
      "level",
      210,
      140 - (w.flash > 0 ? (1 - w.flash / PERFECT_FLASH) * 6 : 0),
      w.flash > 0 ? (w.combo > 1 ? `PERFECT ×${w.combo}` : "PERFECT") : "",
      17,
      "#9f6d18",
      labelAlpha,
    );
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
