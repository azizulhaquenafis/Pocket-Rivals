import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle } from "../../shared/components/drawing";
import { OrbitWorld } from "./Rules";
export class Game extends ArcadeGame {
  private w = new OrbitWorld();
  protected challenge = {
    title: "Orbit Hop",
    tiers: [
      "Wide gravity fields, relaxed orbits and a curved flight guide.",
      "Smaller planets, longer leaps and a short launch arrow.",
      "Distant tiny planets, tight gravity fields and no aim guide.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new OrbitWorld(Math.random, tier);
  }
  private landingAge = 1;
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
    const wasOrbiting = this.w.orbit;
    this.w.step(dt);
    this.landingAge += dt;
    if (!wasOrbiting && this.w.orbit && this.w.lives === lives)
      this.landingAge = 0;
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
    g.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 25; i++)
      g.fillCircle(
        42 + ((i * 79) % 330),
        155 + ((i * 117 + w.camera * 0.15) % 460),
        i % 3 === 0 ? 2 : 1,
      );
    for (const p of w.planets) {
      const y = p.y + w.camera;
      const field = w.fieldRadius(p);
      if (y + field < 112 || y - field > 650) continue;
      const next = p.id === w.highest + 1;
      // The outer boundary is the actual attraction range, not a decorative hitbox.
      g.fillStyle(next ? 0xffffff : 0xb6a2d3, next ? 0.14 : 0.08).fillCircle(
        p.x,
        y,
        field,
      );
      g.lineStyle(1.5, 0x74608e, next ? 0.28 : 0.13).strokeCircle(
        p.x,
        y,
        field,
      );
      g.lineStyle(1, 0xffffff, 0.28).strokeCircle(p.x, y, p.r + 8);
      if (next) {
        for (let n = 0; n < 8; n++) {
          const a = (n * Math.PI) / 4 + this.age * 0.12;
          g.fillStyle(0xffffff, 0.6).fillCircle(
            p.x + Math.cos(a) * field,
            y + Math.sin(a) * field,
            1.5,
          );
        }
      }
      if (p.id === w.current && this.landingAge < 0.7) {
        const t = this.landingAge / 0.7;
        g.lineStyle(3, 0xffffff, (1 - t) * 0.8).strokeCircle(
          p.x,
          y,
          p.r + 9 + t * 26,
        );
      }
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
      circle(
        g,
        p.x,
        y,
        p.r,
        [0x58addb, 0xf49b58, 0xafd197, 0xb7a3d5][p.id % 4],
        3,
      );
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
      if (p.id % 3 === 0) {
        g.lineStyle(3, 0x74608e, 0.55).strokeEllipse(
          p.x,
          y + 3,
          p.r * 2.8,
          p.r * 0.6,
        );
      } else if (p.id % 3 === 1) {
        g.lineStyle(3, 0xffffff, 0.3).lineBetween(
          p.x - p.r * 0.65,
          y + p.r * 0.2,
          p.x + p.r * 0.65,
          y + p.r * 0.2,
        );
      }
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
    g.fillStyle(0xfffdf5, 0.92).fillRoundedRect(37, 122, 88, 25, 12);
    this.text("status", 81, 134, `PLANET ${w.highest + 1}`, 11);
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
      gravityFields: this.w.planets.map((p) => ({
        id: p.id,
        radius: this.w.fieldRadius(p),
      })),
      highest: this.w.highest,
    };
  }
}
