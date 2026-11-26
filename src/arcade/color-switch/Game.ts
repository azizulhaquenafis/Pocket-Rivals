import type Phaser from "phaser";
import type { GameContext } from "../../shared/contracts/GameModule";
import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle, rounded } from "../../shared/components/drawing";
import { clamp } from "../../shared/physics/FixedStep";
import config from "./config";
import {
  BALL_RADIUS,
  COLORS,
  COURSE_X,
  colorAt,
  ColorWorld,
  RECOVERY_TIME,
  START_Y,
  SWITCH_FLASH_TIME,
  crossing,
  visitColorBands,
  touchesWrongColor,
} from "./Rules";

import { CONTOURS, edgeAt, pointAt, type Contour } from "./Contours";

const OBSTACLE_SLOTS = 5;

interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  size: number;
  age: number;
  life: number;
  color: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  age: number;
  life: number;
  color: number;
}

interface BreakRing {
  x: number;
  y: number;
  age: number;
  duration: number;
  color: number;
  final: boolean;
}

export class Game extends ArcadeGame {
  protected override autoScoreSound = false;
  protected override endDelay = 1.15;
  private backdrop!: Phaser.GameObjects.Graphics;
  private track!: Phaser.GameObjects.Graphics;
  private obstacles: {
    outline: Phaser.GameObjects.Graphics;
    paint: Phaser.GameObjects.Graphics;
    index: number;
  }[] = [];
  private w = new ColorWorld();
  private keys = new Set<string>();
  private target: number | null = null;
  private dragOrigin: {
    pointerX: number;
    ballX: number;
    moved: boolean;
  } | null = null;
  private shards: Shard[] = [];
  private sparks: Spark[] = [];
  private ring: BreakRing | null = null;
  private shake = 0;
  protected challenge = {
    title: "Color Switch",
    instructions: config.instructions,
    desktopControls: config.desktopControls?.ai,
    tiers: [
      "Wide, slow bands and guides at open crossings.",
      "Narrower bands and quicker openings.",
      "Fast rotation and tight openings. Time your entry and exit.",
    ] as const,
  };

  initialize(ctx: GameContext) {
    this.backdrop = ctx.scene.add.graphics();
    this.track = ctx.scene.add.graphics();
    this.obstacles = Array.from({ length: OBSTACLE_SLOTS }, () => ({
      outline: ctx.scene.add.graphics().setVisible(false),
      paint: ctx.scene.add.graphics().setVisible(false),
      index: -1,
    }));
    super.initialize(ctx);
    const mask = this.g.mask!;
    this.backdrop.setMask(mask);
    this.track.setMask(mask);
    for (const view of this.obstacles) {
      view.outline.setMask(mask);
      view.paint.setMask(mask);
    }
  }

  protected configure(tier: Difficulty) {
    this.w = new ColorWorld(tier);
    for (const view of this.obstacles) view.index = -1;
    this.shards.length = 0;
    this.sparks.length = 0;
    this.ring = null;
    this.shake = 0;
    this.drawBackdrop();
  }

  dispose() {
    this.backdrop.destroy();
    this.track.destroy();
    for (const view of this.obstacles) {
      view.outline.destroy();
      view.paint.destroy();
    }
    super.dispose();
  }

  private hop() {
    this.w.hop();
    this.ctx.audio.play("shoot", 0.3);
  }

  private spawnBreak(final: boolean) {
    const b = this.w.lastBreak;
    if (!b) return;
    const bx = clamp(b.x, 38, 382);
    const by = clamp(b.y + this.w.camera, 130, 636);
    const ballColor = COLORS[b.color] ?? COLORS[0];
    this.shake = final ? 0.26 : 0.18;
    this.ring = {
      x: bx,
      y: by,
      age: 0,
      duration: final ? 0.65 : 0.42,
      color: ballColor,
      final,
    };
    this.shards.length = 0;
    this.sparks.length = 0;
    const shardCount = final ? 8 : 6;
    for (let i = 0; i < shardCount; i++) {
      const a = (i / shardCount) * Math.PI * 2 + (i % 2 ? 0.18 : -0.12);
      const speed = (final ? 82 : 64) + (i % 3) * 28;
      this.shards.push({
        x: bx + Math.cos(a) * 3,
        y: by + Math.sin(a) * 3,
        vx: Math.cos(a) * speed + b.vx * 0.18,
        vy: Math.sin(a) * speed - (final ? 46 : 32),
        angle: a,
        spin: (i % 2 ? 1 : -1) * (4.5 + (i % 3) * 2.2),
        size: (final ? 5.6 : 4.8) - (i % 2) * 1.1,
        age: 0,
        life: final ? 0.78 + (i % 3) * 0.08 : 0.46 + (i % 2) * 0.08,
        color: ballColor,
      });
    }
    const sparkCount = final ? 14 : 9;
    for (let i = 0; i < sparkCount; i++) {
      const a = (i / sparkCount) * Math.PI * 2 + 0.25;
      const speed = (final ? 115 : 85) + (i % 3) * 26;
      this.sparks.push({
        x: bx,
        y: by,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 20,
        r: (final ? 2.8 : 2.2) - (i % 2) * 0.5,
        age: 0,
        life: final ? 0.58 + (i % 3) * 0.09 : 0.36 + (i % 2) * 0.06,
        color: i % 3 === 0 ? 0xfffdf5 : ballColor,
      });
    }
  }

  private advanceEffects(dt: number) {
    this.shake = Math.max(0, this.shake - dt);
    if (this.ring) {
      this.ring.age += dt;
      if (this.ring.age >= this.ring.duration) this.ring = null;
    }
    const drag = Math.exp(-3.1 * dt);
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.age += dt;
      s.vx *= drag;
      s.vy = s.vy * drag + 260 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.angle += s.spin * dt;
      if (s.age >= s.life) this.shards.splice(i, 1);
    }
    const sparkDrag = Math.exp(-4.2 * dt);
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.age += dt;
      p.vx *= sparkDrag;
      p.vy = p.vy * sparkDrag + 110 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.age >= p.life) this.sparks.splice(i, 1);
    }
  }

  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
    ]);
    this.press(["Space", "ArrowUp", "KeyW"], () => this.hop());

    const release = () => {
      this.dragOrigin = null;
    };
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        this.dragOrigin = { pointerX: x, ballX: this.w.x, moved: false };
        this.hop();
        return true;
      },
      (x) => {
        if (!this.dragOrigin) return;
        const dx = x - this.dragOrigin.pointerX;
        if (!this.dragOrigin.moved && Math.abs(dx) < 4) return;
        this.dragOrigin.moved = true;
        const lane = this.w.settings.lane / 2;
        this.target = clamp(
          this.dragOrigin.ballX + dx,
          COURSE_X - lane,
          COURSE_X + lane,
        );
      },
      release,
      () => {
        release();
        this.target = null;
      },
      { outside: true },
    );
  }

  protected clearInput() {
    this.dragOrigin = null;
    this.target = null;
    this.keys.clear();
    this.w.clearInput();
  }

  protected step(dt: number) {
    const lives = this.w.lives;
    const cleared = this.w.cleared;
    let axis = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) axis--;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) axis++;
    if (axis !== 0) this.target = null;
    else if (this.target !== null)
      axis = clamp((this.target - this.w.x) / 22, -1, 1);
    this.w.step(dt, axis);
    this.advanceEffects(dt);
    if (this.w.cleared > cleared) {
      this.ctx.audio.play("metal", 0.75);
    }
    if (this.w.lives < lives) {
      this.target = null;
      this.dragOrigin = null;
      this.spawnBreak(this.w.done);
      this.ctx.audio.play(this.w.done ? "fail" : "damage", 0.75);
    }
  }

  protected override stepEnding(dt: number) {
    this.advanceEffects(dt);
  }

  private drawBackdrop() {
    const g = this.backdrop;
    const lane = this.w.settings.lane;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xeee5f1, 0);
    g.fillStyle(0xd4c2e4, 0.45)
      .fillCircle(42, 236, 95)
      .fillCircle(368, 570, 105);
    g.fillStyle(0xffffff, 0.45).fillCircle(365, 210, 58);
    for (let i = 0; i < 16; i++) {
      const y = 126 + ((i * 77) % 515);
      g.fillStyle(COLORS[i % 4], 0.2).fillCircle(
        47 + ((i * 83) % 325),
        y,
        2 + (i % 2),
      );
    }
    g.fillStyle(0xffffff, 0.28).fillRoundedRect(
      COURSE_X - lane / 2 - 9,
      112,
      lane + 18,
      538,
      20,
    );
  }

  protected draw() {
    const g = this.g;
    const w = this.w;
    if (!this.started) this.drawBackdrop();

    const sx =
      this.shake > 0
        ? Math.sin(this.age * 84) * (this.shake / 0.26) * 2.6
        : 0;
    const sy =
      this.shake > 0
        ? Math.cos(this.age * 70) * (this.shake / 0.26) * 2.0
        : 0;

    const lane = w.settings.lane;
    const active = w.obstacle();
    this.track.clear();
    const floor = START_Y + w.camera + sy;
    if (!w.cleared && floor < 650) {
      rounded(
        this.track,
        COURSE_X - lane / 2 - 13 + sx,
        floor + BALL_RADIUS,
        lane + 26,
        12,
        6,
        0xd4c2e4,
        2,
      );
    }
    if (w.settings.guide && !w.done) {
      for (const entry of active.shape === "wave" ? [true] : [true, false]) {
        const { x, y } = crossing(active, entry);
        if (!touchesWrongColor(active, x, y, w.settings.thickness))
          this.track
            .fillStyle(COLORS[active.color], 0.22)
            .fillCircle(x + sx, y + w.camera + sy, 15);
      }
    }

    const first = Math.max(0, w.cleared - 2);
    for (let i = first; i < first + OBSTACLE_SLOTS; i++) {
      const view = this.obstacles[i % OBSTACLE_SLOTS];
      const obstacle = i === w.cleared ? active : w.obstacle(i);
      const cy = obstacle.center + w.camera + sy;
      const visible =
        i <= w.cleared + 2 &&
        cy + obstacle.extent + 30 >= 112 &&
        cy - obstacle.extent - 30 <= 650;
      view.outline.setVisible(visible);
      view.paint.setVisible(visible);
      if (!visible) continue;

      const changed = view.index !== i;
      if (changed) {
        view.outline.clear().lineStyle(w.settings.thickness + 4, 0x242b32);
        for (const path of CONTOURS[obstacle.shape])
          strokeRange(view.outline, path, 0, path.length);
        view.index = i;
      }
      // The fixed outline is retained. Only the visible color runs are updated.
      if (changed || i >= w.cleared) {
        view.paint.clear();
        visitColorBands(obstacle, (path, from, to, offset) => {
          view.paint.lineStyle(
            w.settings.thickness,
            COLORS[colorAt(obstacle.color + offset)],
          );
          strokeRange(view.paint, path, from, to);
        });
      }
      const alpha = i < w.cleared ? 0.12 : i > w.cleared ? 0.55 : 1;
      view.outline.setPosition(COURSE_X + sx, cy).setAlpha(alpha);
      view.paint.setPosition(COURSE_X + sx, cy).setAlpha(alpha);
    }

    // The switch applies anywhere on this line, across the entire steering lane.
    const switchY = active.clearY + w.camera + sy;
    const nextColor = COLORS[colorAt(w.cleared + 1)];
    g.lineStyle(4, 0xffffff, 0.9);
    for (let x = COURSE_X - lane / 2; x < COURSE_X + lane / 2; x += 12)
      g.lineBetween(
        x + sx,
        switchY,
        Math.min(x + 7, COURSE_X + lane / 2) + sx,
        switchY,
      );
    g.lineStyle(2, nextColor);
    for (let x = COURSE_X - lane / 2; x < COURSE_X + lane / 2; x += 12)
      g.lineBetween(
        x + sx,
        switchY,
        Math.min(x + 7, COURSE_X + lane / 2) + sx,
        switchY,
      );

    // Ball-breaking shockwave ring, polygonal shards & glowing droplets
    if (this.ring) {
      const t = Math.min(1, this.ring.age / this.ring.duration);
      const ease = 1 - (1 - t) * (1 - t);
      const alpha = (1 - t) * 0.8;
      g.lineStyle(2.5 * (1 - t * 0.5), this.ring.color, alpha).strokeCircle(
        this.ring.x,
        this.ring.y,
        BALL_RADIUS + ease * (this.ring.final ? 34 : 22),
      );
    }
    for (const s of this.shards) {
      const t = Math.min(1, s.age / s.life);
      const alpha = Math.max(0, 1 - t * t);
      const sz = Math.max(1.2, s.size * (1 - t * 0.35));
      g.save();
      g.translateCanvas(s.x, s.y);
      g.rotateCanvas(s.angle);
      const pts = [
        { x: 0, y: -sz },
        { x: sz * 0.92, y: sz * 0.65 },
        { x: -sz * 0.78, y: sz * 0.45 },
      ];
      g.fillStyle(s.color, alpha).fillPoints(pts, true);
      g.lineStyle(1.8, 0x242b32, alpha).strokePoints(pts, true);
      g.restore();
    }
    for (const p of this.sparks) {
      const t = Math.min(1, p.age / p.life);
      g.fillStyle(p.color, (1 - t) * 0.9).fillCircle(
        p.x,
        p.y,
        Math.max(0.8, p.r * (1 - t * 0.45)),
      );
    }

    // Active ball (hides cleanly on final shatter, reforms smoothly after heart loss)
    const bx = w.x + sx;
    const by = w.y + w.camera + sy;
    if (!w.done) {
      if (w.grace > 0) {
        const t = 1 - w.grace / RECOVERY_TIME;
        const ease = 1 - (1 - t) * (1 - t);
        const r = Math.max(2.5, BALL_RADIUS * (0.38 + 0.62 * ease));
        g.lineStyle(2, COLORS[w.color], (1 - ease) * 0.75).strokeCircle(
          bx,
          by,
          20 - ease * 11,
        );
        circle(g, bx, by, r, COLORS[w.color], 2);
      } else {
        g.fillStyle(COLORS[w.color], 0.18).fillCircle(bx, by + 6, 10);
        circle(g, bx, by, BALL_RADIUS, COLORS[w.color], 2);
        if (w.switchFlash > 0) {
          const flash = w.switchFlash / SWITCH_FLASH_TIME;
          g.lineStyle(2, COLORS[w.color], flash).strokeCircle(
            bx,
            by,
            10 + 9 * (1 - flash),
          );
        }
        g.fillStyle(0xffffff, 0.95).fillCircle(bx - 2.4, by - 2.4, 2.3);
      }
    } else {
      // Graceful translucent veil & Game Over pill card matching Orbit Hop & Paper Glider
      const p = Math.min(1, this.ending / 0.55);
      const ease = 1 - (1 - p) * (1 - p) * (1 - p);
      g.fillStyle(0x242b32, ease * 0.22).fillRoundedRect(24, 112, 372, 538, 20);
      const bannerY = 382 + (1 - ease) * 14;
      g.fillStyle(0xfffdf5, ease * 0.95).fillRoundedRect(
        86,
        bannerY - 26,
        248,
        52,
        18,
      );
      g.lineStyle(3, 0x242b32, ease).strokeRoundedRect(
        86,
        bannerY - 26,
        248,
        52,
        18,
      );
      this.text(
        "gameover",
        210,
        bannerY - 7,
        "SHATTERED",
        16,
        "#242b32",
        ease,
      );
      this.text(
        "gameover-sub",
        210,
        bannerY + 12,
        `${w.cleared} ${w.cleared === 1 ? "SHAPE" : "SHAPES"} CLEARED`,
        10,
        "#697474",
        ease,
      );
    }
    if (!w.done) {
      this.text("gameover", 210, -100, "", 16, "#242b32", 0);
      this.text("gameover-sub", 210, -100, "", 10, "#697474", 0);
    }
  }

  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: "",
      lives: this.w.lives,
      maxLives: 3,
      result: `${this.w.cleared} ${this.w.cleared === 1 ? "shape" : "shapes"} cleared.`,
    };
  }

  snapshot() {
    const w = this.w;
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      camera: w.camera,
      floor: START_Y,
      x: w.x,
      y: w.y,
      vy: w.vy,
      color: w.color,
      cleared: w.cleared,
      lives: w.lives,
      grace: w.grace,
      switchFlash: w.switchFlash,
      time: w.time,
      laneWidth: w.settings.lane,
      obstacle: w.obstacle(),
    };
  }
}

function strokeRange(
  g: Phaser.GameObjects.Graphics,
  path: Contour,
  from: number,
  to: number,
) {
  const a = pointAt(path, from);
  const b = pointAt(path, to);
  g.beginPath().moveTo(a.x, a.y);
  const end = edgeAt(path, to);
  for (let i = edgeAt(path, from); i < end; i++) {
    const vertex = path.vertices[i];
    if (vertex.distance > from) g.lineTo(vertex.x, vertex.y);
  }
  g.lineTo(b.x, b.y);
  if (path.closed && from === 0 && to === path.length) g.closePath();
  g.strokePath();
}
