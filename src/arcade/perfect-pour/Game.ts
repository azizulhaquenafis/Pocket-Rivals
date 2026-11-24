import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { rounded } from "../../shared/components/drawing";
import { PourWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new PourWorld();
  private shapeRound = -1;
  private shape: { x: number; y: number }[] = [];
  private keys = new Set<string>();
  private touch = false;
  private wasDown = false;
  protected challenge = {
    title: "Perfect Pour",
    tiers: [
      "Gentle flow and a preview of water still falling.",
      "Faster flow with more water arriving after release.",
      "Fast flow and a narrower accuracy allowance.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new PourWorld(tier);
  }
  protected bind() {
    this.keys = this.ctx.input.keys(["Space", "Enter"]);
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        this.touch = true;
        return true;
      },
      () => {},
      () => (this.touch = false),
      () => {
        this.touch = false;
        this.w.cancel();
      },
      { outside: true },
    );
  }
  protected clearInput() {
    this.touch = false;
    this.wasDown = false;
    this.w.cancel();
  }
  protected step(dt: number) {
    const down = this.touch || this.keys.has("Space") || this.keys.has("Enter");
    if (down !== this.wasDown) {
      this.w.hold(down);
      if (down) this.ctx.audio.play("soft", 0.4);
      this.wasDown = down;
    }
    this.w.step(dt);
  }
  protected draw() {
    const g = this.g,
      w = this.w;
    this.board(0xd5eaf0);
    const base = 560;
    const shape = this.shape;
    if (this.shapeRound !== w.round) {
      this.shapeRound = w.round;
      shape.length = 0;
      for (let h = 270; h >= 0; h -= 5)
        shape.push({ x: 210 - w.width(h) / 2, y: base - h });
      for (let h = 0; h <= 270; h += 5)
        shape.push({ x: 210 + w.width(h) / 2, y: base - h });
    }
    g.fillStyle(0xfffdf5).fillPoints(shape, true);
    const fill = w.heightFor(w.volume),
      water: { x: number; y: number }[] = [];
    for (let h = fill; h > 0; h -= 3)
      water.push({ x: 210 - w.width(h) / 2 + 3, y: base - h });
    water.push(
      { x: 210 - w.width(0) / 2 + 3, y: base - 3 },
      { x: 210 + w.width(0) / 2 - 3, y: base - 3 },
    );
    for (let h = 0; h < fill; h += 3)
      water.push({ x: 210 + w.width(h) / 2 - 3, y: base - h });
    water.push({ x: 210 + w.width(fill) / 2 - 3, y: base - fill });
    if (fill > 3) g.fillStyle(0x58addb).fillPoints(water, true);
    g.lineStyle(4, 0x242b32).strokePoints(shape, false);
    if (this.difficulty === "medium" && w.pending > 0) {
      const incomingY = base - w.heightFor(w.volume + w.pending);
      g.lineStyle(2, 0x58addb, 0.7).lineBetween(
        210 - w.width(base - incomingY) / 2,
        incomingY,
        210 + w.width(base - incomingY) / 2,
        incomingY,
      );
    }
    const targetY = base - w.heightFor(w.capacity * w.target);
    g.lineStyle(3, 0xf49b58);
    for (let x = 125; x < 295; x += 14)
      g.lineBetween(x, targetY, x + 8, targetY);
    rounded(g, 180, 196, 60, 38, 10, 0x9a8aa9, 3);
    g.lineStyle(8, 0x242b32).lineBetween(210, 225, 210, 244);
    if (w.holding || w.pending > 10) {
      g.fillStyle(0x58addb, 0.8);
      for (let i = 0; i < 7; i++) {
        const y =
          248 + ((w.time * 280 + i * 42) % Math.max(1, base - fill - 248));
        g.fillEllipse(210, y, 6, 12);
      }
    }
    this.text("round", 210, 140, `POUR ${w.round} / 10`, 16);
    this.text(
      "rating",
      210,
      610,
      w.between ? `${w.rating} / 100` : w.started ? "" : "HOLD TO POUR",
      20,
    );
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: "",
      lives: this.w.lives,
      maxLives: 3,
      result: this.w.lives
        ? "Ten vessels filled."
        : `Reached pour ${this.w.round}.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      round: this.w.round,
      volume: this.w.volume,
      capacity: this.w.capacity,
      target: this.w.target,
      holding: this.w.holding,
      rating: this.w.rating,
      between: this.w.between,
    };
  }
}
