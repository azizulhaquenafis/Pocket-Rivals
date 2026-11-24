import type Phaser from "phaser";
import type { GameContext } from "../../shared/contracts/GameModule";
import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle, rounded } from "../../shared/components/drawing";
import { clamp } from "../../shared/physics/FixedStep";
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

export class Game extends ArcadeGame {
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
  protected challenge = {
    title: "Color Switch",
    instructions:
      "Tap or press Space to hop. Keep the ball bouncing inside while the matching color comes around, then hop out. Drag or use the arrow keys to steer. Cross the dashed line to switch colors.",
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

  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
    ]);
    this.press(["Space", "ArrowUp", "KeyW"], () => this.w.hop());

    const release = () => {
      this.dragOrigin = null;
    };
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        this.dragOrigin = { pointerX: x, ballX: this.w.x, moved: false };
        this.w.hop();
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
    let axis = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) axis--;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) axis++;
    if (axis !== 0) this.target = null;
    else if (this.target !== null)
      axis = clamp((this.target - this.w.x) / 22, -1, 1);
    this.w.step(dt, axis);
    if (this.w.lives < lives) {
      this.target = null;
      this.dragOrigin = null;
      this.ctx.audio.play("fail", 0.4);
    }
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

    const lane = w.settings.lane;
    const active = w.obstacle();
    this.track.clear();
    const floor = START_Y + w.camera;
    if (!w.cleared && floor < 650) {
      rounded(
        this.track,
        COURSE_X - lane / 2 - 13,
        floor + BALL_RADIUS,
        lane + 26,
        12,
        6,
        0xd4c2e4,
        2,
      );
    }
    if (w.settings.guide) {
      for (const entry of active.shape === "wave" ? [true] : [true, false]) {
        const { x, y } = crossing(active, entry);
        if (!touchesWrongColor(active, x, y, w.settings.thickness))
          this.track
            .fillStyle(COLORS[active.color], 0.22)
            .fillCircle(x, y + w.camera, 15);
      }
    }

    const first = Math.max(0, w.cleared - 2);
    for (let i = first; i < first + OBSTACLE_SLOTS; i++) {
      const view = this.obstacles[i % OBSTACLE_SLOTS];
      const obstacle = i === w.cleared ? active : w.obstacle(i);
      const cy = obstacle.center + w.camera;
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
      view.outline.setPosition(COURSE_X, cy).setAlpha(alpha);
      view.paint.setPosition(COURSE_X, cy).setAlpha(alpha);
    }

    // The switch applies anywhere on this line, across the entire steering lane.
    const switchY = active.clearY + w.camera;
    const nextColor = COLORS[colorAt(w.cleared + 1)];
    g.lineStyle(4, 0xffffff, 0.9);
    for (let x = COURSE_X - lane / 2; x < COURSE_X + lane / 2; x += 12)
      g.lineBetween(x, switchY, Math.min(x + 7, COURSE_X + lane / 2), switchY);
    g.lineStyle(2, nextColor);
    for (let x = COURSE_X - lane / 2; x < COURSE_X + lane / 2; x += 12)
      g.lineBetween(x, switchY, Math.min(x + 7, COURSE_X + lane / 2), switchY);

    const by = w.y + w.camera;
    g.fillStyle(COLORS[w.color], 0.18).fillCircle(w.x, by + 6, 10);
    circle(g, w.x, by, BALL_RADIUS, COLORS[w.color], 2);
    if (w.switchFlash > 0) {
      const flash = w.switchFlash / SWITCH_FLASH_TIME;
      g.lineStyle(2, COLORS[w.color], flash).strokeCircle(
        w.x,
        by,
        10 + 9 * (1 - flash),
      );
    }
    g.fillStyle(0xffffff, 0.95).fillCircle(w.x - 2.4, by - 2.4, 2.3);
    if (w.grace) {
      g.lineStyle(2, COLORS[w.color], 0.7)
        .beginPath()
        .arc(
          w.x,
          by,
          13,
          -Math.PI / 2,
          -Math.PI / 2 + (1 - w.grace / RECOVERY_TIME) * Math.PI * 2,
        )
        .strokePath();
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
