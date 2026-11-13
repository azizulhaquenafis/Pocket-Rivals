import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle } from "../../shared/components/drawing";
import { OrbitWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new OrbitWorld();
  protected challenge = {
    title: "Orbit Hop",
    tiers: [
      "Slower orbits, larger planets and a flight preview.",
      "Faster orbits, smaller landings and a short aim arrow.",
      "Fast orbits and compact planets. Time each launch.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new OrbitWorld(Math.random, tier);
  }
  private previewAge = -1;
  private path: { x: number; y: number }[] = [];
  private trail: { x: number; y: number }[] = [];
  protected bind() {
    const go = () => {
      if (this.w.launch()) this.ctx.audio.play("shoot", 0.5);
    };
    this.tap(go);
    this.press(["Space", "Enter"], go);
  }
  protected step(dt: number) {
    const lives = this.w.lives;
    this.w.step(dt);
    if (!this.w.orbit) {
      this.trail.push({ x: this.w.ball.x, y: this.w.ball.y });
      if (this.trail.length > 18) this.trail.shift();
    } else this.trail.length = 0;
    if (this.w.lives < lives) this.ctx.audio.play("fall");
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xe5ddf0);
    g.fillStyle(0xc7b8df, 0.3).fillEllipse(315, 265, 290, 190);
    g.lineStyle(1, 0xffffff, 0.45).strokeEllipse(210, 380, 320, 440);
    g.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 25; i++)
      g.fillCircle(
        42 + ((i * 79) % 330),
        155 + ((i * 117 + w.camera * 0.15) % 460),
        i % 3 === 0 ? 2 : 1,
      );
    for (const p of w.planets) {
      const y = p.y + w.camera;
      if (y < 80 || y > 700) continue;
      if (p.id === w.highest + 1 && this.difficulty === "medium")
        g.lineStyle(2, 0xffffff, 0.65).strokeCircle(
          p.x,
          y,
          p.r + 13 + Math.sin(this.age * 3) * 2,
        );
      g.fillStyle(0x242b32, 0.1).fillEllipse(
        p.x + 4,
        y + p.r + 6,
        p.r * 1.9,
        12,
      );
      circle(g, p.x, y, p.r, p.id % 2 ? 0xf49b58 : 0x58addb, 3);
      g.fillStyle(0xffffff, 0.25).fillCircle(
        p.x - p.r * 0.3,
        y - p.r * 0.3,
        p.r * 0.3,
      );
      g.fillStyle(0x242b32, 0.12).fillCircle(
        p.x + p.r * 0.35,
        y + p.r * 0.25,
        p.r * 0.2,
      );
      g.lineStyle(2, 0xffffff, 0.4).strokeEllipse(p.x, y, p.r * 2.7, p.r * 0.6);
    }
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      g.fillStyle(0xffffff, (i / this.trail.length) * 0.4).fillCircle(
        p.x,
        p.y + w.camera,
        (4 * i) / this.trail.length,
      );
    }
    if (w.orbit && !w.grace && this.difficulty === "medium") {
      if (this.age - this.previewAge > 0.08) {
        this.path = w.preview();
        this.previewAge = this.age;
      }
      this.path.forEach((p, i) =>
        g
          .fillStyle(0x242b32, 0.4 * (1 - i / this.path.length))
          .fillCircle(p.x, p.y + w.camera, 2),
      );
    }
    const b = w.ball,
      y = b.y + w.camera;
    if (w.orbit && !w.done && this.difficulty !== "impossible") {
      g.lineStyle(3, 0x242b32, 0.5).lineBetween(
        b.x,
        y,
        b.x + Math.sin(w.angle) * 38,
        y - Math.cos(w.angle) * 38,
      );
    }
    if (w.grace)
      g.lineStyle(3, 0xffffff, w.grace / 0.45).strokeCircle(
        b.x,
        y,
        9 + (1 - w.grace / 0.45) * 20,
      );
    circle(g, b.x, y, 7, w.grace ? 0xaaaaaa : 0xfffdf5, 2);
    this.text("status", 210, 136, `PLANET ${w.highest + 1}`, 14);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} LIVES`,
      result: `Reached planet ${this.w.highest + 1}.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      lives: this.w.lives,
      camera: this.w.camera,
      orbit: this.w.orbit,
      angle: this.w.angle,
      ball: { ...this.w.ball },
      planets: this.w.planets,
      current: this.w.current,
      highest: this.w.highest,
    };
  }
}
