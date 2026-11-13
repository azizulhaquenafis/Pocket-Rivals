import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { rounded, circle } from "../../shared/components/drawing";
import { ClimberWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new ClimberWorld();
  private keys = new Set<string>();
  private target: number | null = null;
  protected challenge = {
    title: "Pocket Climber",
    tiers: [
      "Wide ledges, route hints and telegraphed rocks.",
      "Narrower moving ledges, more rocks and crumbling steps.",
      "Fast moving ledges and frequent hazards. Keep climbing.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new ClimberWorld(Math.random, tier);
  }
  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
    ]);
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || y < 112 || y > 650) return false;
        this.target = x;
        return true;
      },
      (x) => (this.target = x),
      () => (this.target = null),
      () => (this.target = null),
      { outside: true },
    );
  }
  protected clearInput() {
    this.target = null;
  }
  protected step(dt: number) {
    let axis = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) axis--;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) axis++;
    if (this.target !== null)
      axis = Math.max(-1, Math.min(1, (this.target - this.w.x) / 30));
    this.w.step(dt, axis);
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xddebd5);
    g.fillStyle(0xffffff, 0.55);
    for (let i = 0; i < 7; i++)
      g.fillEllipse(
        60 + ((i * 83) % 300),
        160 + ((i * 93 + w.camera * 0.15) % 450),
        75,
        20,
      );
    for (const p of w.platforms) {
      const x = w.left(p),
        y = p.y + w.camera;
      if (p.crumble && p.crumble >= 0.45) continue;
      const wobble = p.crumble ? Math.sin(p.crumble * 70) * 2 : 0;
      rounded(
        g,
        x + wobble,
        y,
        p.width,
        15,
        5,
        p.fragile ? 0xc39b7b : p.motion ? 0x58addb : 0x92b875,
        3,
      );
      g.lineStyle(3, 0xffffff, 0.45).lineBetween(
        x + 6,
        y + 4,
        x + p.width - 6,
        y + 4,
      );
      if (p.fragile)
        g.lineStyle(2, 0x765b49)
          .beginPath()
          .moveTo(x + p.width * 0.55, y + 2)
          .lineTo(x + p.width * 0.45, y + 8)
          .lineTo(x + p.width * 0.6, y + 14)
          .strokePath();
      if (p.motion) {
        g.fillStyle(0xffffff, 0.7).fillTriangle(
          x + p.width / 2 - 5,
          y + 8,
          x + p.width / 2,
          y + 5,
          x + p.width / 2,
          y + 11,
        );
        g.fillTriangle(
          x + p.width / 2 + 5,
          y + 8,
          x + p.width / 2,
          y + 5,
          x + p.width / 2,
          y + 11,
        );
      }
      if (p.star) {
        const points = [];
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5,
            r = i % 2 ? 5 : 11;
          points.push({
            x: x + p.width / 2 + Math.cos(a) * r,
            y: y - 35 + Math.sin(a) * r,
          });
        }
        g.fillStyle(0xf4cc60).fillPoints(points, true);
        g.lineStyle(2, 0x242b32).strokePoints(points, true);
      }
    }
    if (this.difficulty === "medium") {
      const p = w.platforms.find((p) => p.id === w.highest + 1);
      if (p) {
        const x = w.left(p) + p.width / 2,
          y = p.y + w.camera - 13;
        g.lineStyle(2, 0x60834b, 0.65)
          .lineBetween(x - 5, y - 4, x, y)
          .lineBetween(x, y, x + 5, y - 4);
      }
    }
    for (const r of w.rocks) {
      if (r.warning > 0) {
        g.lineStyle(2, 0xc65545, 0.4).lineBetween(r.x, 160, r.x, 625);
        g.fillStyle(0xc65545).fillTriangle(
          r.x - 7,
          165,
          r.x + 7,
          165,
          r.x,
          178,
        );
      } else {
        const y = r.y + w.camera;
        g.lineStyle(3, 0x9a8aa9, 0.3).lineBetween(
          r.x - r.vx * 0.12,
          y - 22,
          r.x,
          y - 8,
        );
        const points = [
          { x: r.x - 11, y: y - 4 },
          { x: r.x - 5, y: y - 11 },
          { x: r.x + 7, y: y - 9 },
          { x: r.x + 11, y: y + 3 },
          { x: r.x + 3, y: y + 10 },
          { x: r.x - 8, y: y + 7 },
        ];
        g.fillStyle(0x9a8aa9).fillPoints(points, true);
        g.lineStyle(2, 0x242b32).strokePoints(points, true);
        g.lineStyle(2, 0xcac0d2).lineBetween(r.x - 4, y - 5, r.x + 3, y - 6);
      }
    }
    const bodyY = w.y + w.camera;
    rounded(g, w.x - 14, bodyY - 5, 9, 17, 3, 0xb77a4f, 2);
    g.lineStyle(4, 0x242b32)
      .lineBetween(w.x - 5, bodyY + 9, w.x - 7, bodyY + 15)
      .lineBetween(w.x + 5, bodyY + 9, w.x + 7, bodyY + 15);
    rounded(
      g,
      w.x - 10,
      w.y + w.camera - 12,
      20,
      24,
      7,
      w.done ? 0xaaaaaa : 0xf49b58,
      3,
    );
    g.fillStyle(0xffd286).fillRoundedRect(w.x - 12, bodyY - 14, 24, 7, 3);
    g.lineStyle(2, 0x242b32).lineBetween(
      w.x - 13,
      bodyY - 7,
      w.x + 13,
      bodyY - 7,
    );
    g.fillStyle(0x242b32)
      .fillCircle(w.x - 4, w.y + w.camera - 4, 2)
      .fillCircle(w.x + 4, w.y + w.camera - 4, 2);
    this.text("height", 210, 135, `${w.highest} LEDGES`, 15);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.stars} STARS`,
      result: `Climbed ${this.w.highest} ledges.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      x: this.w.x,
      y: this.w.y,
      vy: this.w.vy,
      camera: this.w.camera,
      platforms: this.w.platforms,
      highest: this.w.highest,
      rocks: this.w.rocks,
    };
  }
}
