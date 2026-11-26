import type Phaser from "phaser";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { GameContext } from "../../shared/contracts/GameModule";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { rounded, circle, label } from "../../shared/components/drawing";
import { ClimberWorld, MAX_SPRINGS } from "./Rules";
export class Game extends ArcadeGame {
  protected override autoScoreSound = false;
  private w = new ClimberWorld();
  private wasDone = false;
  private keys = new Set<string>();
  private target: number | null = null;
  private springHud?: Phaser.GameObjects.Graphics;
  private springLabel?: Phaser.GameObjects.Text;
  private lastSpringHud = "";
  protected challenge = {
    title: "Pocket Climber",
    tiers: [
      "Wide ledges, route hints and telegraphed rocks.",
      "Narrower moving ledges, more rocks and crumbling steps.",
      "Fast moving ledges and frequent hazards. Keep climbing.",
    ] as const,
  };
  override initialize(ctx: GameContext) {
    super.initialize(ctx);
    this.springHud = ctx.scene.add.graphics();
    this.springLabel = label(ctx.scene, 196, 694, "SPRING", 13, "#242b32");
    this.springLabel.setVisible(false);
  }
  protected configure(tier: Difficulty) {
    this.w = new ClimberWorld(Math.random, tier);
    this.wasDone = false;
    this.lastSpringHud = "";
  }
  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
    ]);
    this.press(["Space", "ArrowUp", "KeyW"], () => this.useSpring());
    this.ctx.input.tap((x, y) => {
      if (this.active && x >= 112 && x <= 308 && y >= 660 && y <= 736) {
        this.useSpring();
      }
    });
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
  private useSpring() {
    if (this.w.spring()) {
      this.ctx.audio.play("perfect", 0.7);
    }
  }
  protected clearInput() {
    this.target = null;
  }
  protected step(dt: number) {
    const prevVy = this.w.vy;
    const prevStars = this.w.stars;
    const prevCrumbles = this.w.platforms.reduce(
      (n, p) => n + ((p.crumble ?? 0) > 0 ? 1 : 0),
      0,
    );
    const prevWarnings = this.w.rocks.reduce(
      (n, r) => n + (r.warning > 0 ? 1 : 0),
      0,
    );
    let axis = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) axis--;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) axis++;
    if (this.target !== null)
      axis = Math.max(-1, Math.min(1, (this.target - this.w.x) / 30));
    this.w.step(dt, axis);
    const crumbles = this.w.platforms.reduce(
      (n, p) => n + ((p.crumble ?? 0) > 0 ? 1 : 0),
      0,
    );
    const warnings = this.w.rocks.reduce(
      (n, r) => n + (r.warning > 0 ? 1 : 0),
      0,
    );
    if (this.w.stars > prevStars) this.ctx.audio.play("goal", 0.85);
    if (crumbles > prevCrumbles) this.ctx.audio.play("slice", 0.65);
    else if (prevVy > 0 && this.w.vy < 0 && this.w.springEffect < 0.38)
      this.ctx.audio.play("wood", 0.42);
    if (warnings > prevWarnings) this.ctx.audio.play("countdown", 0.42);
    if (!this.wasDone && this.w.done) {
      this.wasDone = true;
      this.ctx.audio.play(
        this.w.y + this.w.camera < 640 ? "damage" : "fall",
        0.85,
      );
    }
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
    if (w.springEffect > 0) {
      const p = 1 - w.springEffect / 0.42;
      const alpha = Math.max(0, 1 - p);
      const sx = w.springOriginX;
      const sy = w.springOriginY + w.camera;
      const coilH = 12 + p * 26;
      g.lineStyle(2.5, 0xf49b58, 0.55 * alpha).strokeEllipse(
        sx,
        sy + 2,
        24 + p * 34,
        9 + p * 8,
      );
      g.lineStyle(3, 0x242b32, 0.85 * alpha)
        .beginPath()
        .moveTo(sx - 9, sy)
        .lineTo(sx + 9, sy - coilH * 0.28)
        .lineTo(sx - 9, sy - coilH * 0.56)
        .lineTo(sx + 9, sy - coilH * 0.84)
        .lineTo(sx, sy - coilH)
        .strokePath();
      g.fillStyle(0xf49b58, 0.9 * alpha).fillRoundedRect(
        sx - 12,
        sy - coilH - 4,
        24,
        6,
        3,
      );
      g.lineStyle(2, 0x242b32, 0.9 * alpha).strokeRoundedRect(
        sx - 12,
        sy - coilH - 4,
        24,
        6,
        3,
      );
    }
    if (w.vy < -435) {
      g.lineStyle(2.5, 0xf49b58, 0.5)
        .lineBetween(w.x - 10, bodyY + 14, w.x - 10, bodyY + 32)
        .lineBetween(w.x + 10, bodyY + 14, w.x + 10, bodyY + 32);
    }
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
    this.text("height", 84, 134, `${w.highest} LEDGES`, 14);
    this.text("stars", 342, 134, `★ ${w.stars}`, 14, "#b87412");
    this.drawSpringButton();
  }
  private drawSpringButton() {
    if (!this.springHud || !this.springLabel) return;
    const pressed = this.w.springCooldown > 0.14 ? 1 : 0;
    const key = `${this.started ? 1 : 0}:${this.w.springs}:${pressed}`;
    if (key === this.lastSpringHud) return;
    this.lastSpringHud = key;
    const g = this.springHud;
    g.clear();
    if (!this.started) {
      this.springLabel.setVisible(false);
      return;
    }
    const available = this.w.springs > 0;
    const dy = pressed * 2;
    const x = 118,
      y = 672 + dy,
      w = 184,
      h = 44;
    if (!pressed) {
      g.fillStyle(0x242b32, 0.16).fillRoundedRect(x, y + 4, w, h, 16);
    }
    rounded(
      g,
      x,
      y,
      w,
      h,
      16,
      available ? 0xfffdf5 : 0xe9e5da,
      available ? 3 : 2,
    );
    // Compact coiled spring emblem on the left of the pill
    const cx = x + 28,
      cy = y + h / 2;
    const inkAlpha = available ? 1 : 0.4;
    g.lineStyle(2.4, 0x242b32, inkAlpha)
      .beginPath()
      .moveTo(cx - 8, cy + 9)
      .lineTo(cx + 8, cy + 4)
      .lineTo(cx - 8, cy - 1)
      .lineTo(cx + 8, cy - 6)
      .strokePath();
    g.fillStyle(available ? 0xf49b58 : 0xb8b4a8).fillRoundedRect(
      cx - 10,
      cy - 11,
      20,
      5,
      2.5,
    );
    g.lineStyle(1.8, 0x242b32, inkAlpha).strokeRoundedRect(
      cx - 10,
      cy - 11,
      20,
      5,
      2.5,
    );
    this.springLabel
      .setVisible(true)
      .setPosition(x + 82, y + h / 2)
      .setAlpha(available ? 1 : 0.45);
    for (let i = 0; i < MAX_SPRINGS; i++) {
      const px = x + 128 + i * 18;
      const py = y + h / 2;
      if (i < this.w.springs) {
        circle(g, px, py, 6, 0xf49b58, 2);
        g.fillStyle(0xfff5d6, 0.85).fillCircle(px - 1.8, py - 1.8, 1.8);
      } else {
        g.fillStyle(0xd8d4c8, 0.7).fillCircle(px, py, 5.5);
        g.lineStyle(1.6, 0x7e8588, 0.65).strokeCircle(px, py, 5.5);
      }
    }
  }
  override dispose() {
    this.springHud?.destroy();
    this.springLabel?.destroy();
    super.dispose();
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: "",
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
      springs: this.w.springs,
      maxSprings: MAX_SPRINGS,
      rocks: this.w.rocks,
    };
  }
}
