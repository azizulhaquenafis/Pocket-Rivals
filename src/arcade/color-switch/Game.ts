import type { Difficulty } from "../../shared/contracts/AIController";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import { circle, rounded } from "../../shared/components/drawing";
import { ColorWorld, COLORS } from "./Rules";
const CHAPTERS = [
  { name: "PRISM GARDEN", background: 0xeee5f1, accent: 0xd4c2e4 },
  { name: "SKY RIBBON", background: 0xe1eef2, accent: 0xb7d9e7 },
  { name: "PEACH PARADE", background: 0xf6e4d6, accent: 0xecc7a9 },
  { name: "MINT TRAIL", background: 0xe3eddb, accent: 0xc1d7ac },
];
export class Game extends ArcadeGame {
  private w = new ColorWorld();
  private keys = new Set<string>();
  private target: number | null = null;
  protected challenge = {
    title: "Color Switch",
    tiers: [
      "Wide paths, gentle shapes and matching-color crossing cues.",
      "Narrow paths and faster shapes. Find your own crossing.",
      "Tight paths, thick barriers and quick rotations. Precise timing.",
    ] as const,
  };
  protected configure(tier: Difficulty) {
    this.w = new ColorWorld(tier);
  }
  protected bind() {
    const hop = () => {
      if (this.w.transition || this.w.grace) return;
      this.w.hop();
      this.ctx.audio.play("soft", 0.4);
    };
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
    ]);
    this.press(["Space", "ArrowUp", "KeyW"], hop);
    this.ctx.input.drag(
      (x, y) => {
        if (!this.active || x < 24 || x > 396 || y < 112 || y > 650)
          return false;
        this.target = x;
        hop();
        return true;
      },
      (x) => {
        this.target = x;
      },
      () => {
        this.target = null;
      },
      () => {
        this.target = null;
      },
      { outside: true },
    );
  }
  protected clearInput() {
    this.target = null;
  }
  protected step(dt: number) {
    const lives = this.w.lives;
    let axis = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) axis--;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) axis++;
    if (this.target !== null)
      axis = Math.max(-1, Math.min(1, (this.target - this.w.x) / 22));
    this.w.step(dt, axis);
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.4);
  }
  protected draw() {
    const g = this.g,
      w = this.w;
    const theme = CHAPTERS[(w.chapter - 1) % CHAPTERS.length];
    this.board(theme.background);
    g.fillStyle(theme.accent, 0.45)
      .fillCircle(42, 236, 95)
      .fillCircle(368, 570, 105);
    g.fillStyle(0xffffff, 0.45).fillCircle(365, 210, 58);
    // Quiet world-space motes establish the climb without adding moving distractions.
    for (let i = 0; i < 16; i++) {
      const y = 174 + ((i * 77 + w.camera * 0.24) % 450);
      g.fillStyle(COLORS[i % 4], 0.2).fillCircle(
        47 + ((i * 83) % 325),
        y,
        2 + (i % 2),
      );
    }
    const cy = w.center + w.camera,
      fy = w.floor + w.camera;
    const lane = w.laneWidth / 2;
    g.fillStyle(0xffffff, 0.3).fillRoundedRect(
      w.laneX - lane - 9,
      cy - 102,
      w.laneWidth + 18,
      318,
      20,
    );
    g.lineStyle(1.5, theme.accent).lineBetween(
      w.laneX - lane - 8,
      cy - 90,
      w.laneX - lane - 8,
      fy - 20,
    );
    g.lineBetween(w.laneX + lane + 8, cy - 90, w.laneX + lane + 8, fy - 20);
    for (let y = cy + 106; y < fy - 12; y += 19)
      g.fillStyle(0x766480, 0.25).fillCircle(w.laneX, y, 1.6);
    // The landing shelf is a real safe checkpoint; its world position rises each stage.
    rounded(
      g,
      w.laneX - lane - 13,
      fy + 10,
      w.laneWidth + 26,
      12,
      6,
      theme.accent,
      2,
    );
    g.lineStyle(2, 0xffffff, 0.7).lineBetween(
      w.laneX - lane - 6,
      fy + 13,
      w.laneX + lane + 6,
      fy + 13,
    );
    if (w.shape === "ring") {
      g.fillStyle(0xffffff, 0.28).fillCircle(w.laneX, cy, 60);
      for (let i = 0; i < 4; i++) {
        const a = w.angle + (i * Math.PI) / 2,
          b = a + Math.PI / 2;
        g.lineStyle(w.settings.thickness + 4, 0x242b32)
          .beginPath()
          .arc(w.laneX, cy, 75, a, b, false)
          .strokePath();
        g.lineStyle(w.settings.thickness, COLORS[i])
          .beginPath()
          .arc(w.laneX, cy, 75, a + 0.013, b - 0.013, false)
          .strokePath();
      }
    } else {
      const segments = w.segments();
      // Outline all edges first to avoid black seams between adjacent colored pieces.
      for (const s of segments)
        g.lineStyle(w.settings.thickness + 4, 0x242b32).lineBetween(
          s.x1,
          s.y1 + w.camera,
          s.x2,
          s.y2 + w.camera,
        );
      for (const s of segments)
        g.lineStyle(w.settings.thickness, COLORS[s.color]).lineBetween(
          s.x1,
          s.y1 + w.camera,
          s.x2,
          s.y2 + w.camera,
        );
    }
    // A small jewel above the obstacle marks the actual completion height.
    const jy = cy - 108;
    g.fillStyle(0xffffff, 0.55).fillCircle(w.laneX, jy, 15);
    g.lineStyle(2, 0x242b32).fillStyle(COLORS[w.color]);
    g.beginPath()
      .moveTo(w.laneX, jy - 8)
      .lineTo(w.laneX + 7, jy)
      .lineTo(w.laneX, jy + 8)
      .lineTo(w.laneX - 7, jy)
      .closePath()
      .fillPath()
      .strokePath();
    if (w.settings.guide && !w.transition) {
      // Mark actual matching crossings, never empty space inside a shape.
      const dx = w.x - w.laneX;
      const crossings =
        w.shape === "ring"
          ? [-1, 1].map(
              (side) =>
                w.center + side * Math.sqrt(Math.max(0, 75 * 75 - dx * dx)),
            )
          : w
              .segments()
              .filter(
                (s) =>
                  s.color === w.color &&
                  w.x >= Math.min(s.x1, s.x2) &&
                  w.x <= Math.max(s.x1, s.x2) &&
                  Math.abs(s.x2 - s.x1) > 0.001,
              )
              .map(
                (s) => s.y1 + ((s.y2 - s.y1) * (w.x - s.x1)) / (s.x2 - s.x1),
              );
      for (const y of crossings) {
        if (!w.touchesWrongColor(w.x, y))
          g.lineStyle(2, 0xffffff, 0.85).strokeCircle(w.x, y + w.camera, 11);
      }
    }
    const by = w.y + w.camera;
    g.fillStyle(COLORS[w.color], 0.18).fillCircle(w.x, by + 6, 10);
    circle(g, w.x, by, 8, w.grace ? 0xaaa6ac : COLORS[w.color], 2);
    g.fillStyle(0xffffff, 0.95).fillCircle(w.x - 2.4, by - 2.4, 2.3);
    if (w.grace) {
      g.lineStyle(2, COLORS[w.color], 0.7)
        .beginPath()
        .arc(
          w.x,
          by,
          13,
          -Math.PI / 2,
          -Math.PI / 2 + (1 - w.grace / 0.8) * Math.PI * 2,
        )
        .strokePath();
    }
    // Compact fixed chapter marker and five-stage progress; no gameplay instructions here.
    this.text("level", 210, 135, `${theme.name} · ${w.level}`, 12);
    for (let i = 0; i < 5; i++) {
      const active = i === (w.level - 1) % 5;
      g.fillStyle(
        i < (w.level - 1) % 5 ? 0x766480 : active ? COLORS[w.color] : 0xffffff,
        active ? 1 : 0.65,
      ).fillRoundedRect(178 + i * 14, 153, active ? 10 : 7, 4, 2);
    }
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} LIVES`,
      result: `${this.w.level - 1} stages crossed. Chapter ${this.w.chapter}.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      transition: this.w.transition,
      camera: this.w.camera,
      floor: this.w.floor,
      center: this.w.center,
      x: this.w.x,
      y: this.w.y,
      vy: this.w.vy,
      angle: this.w.angle,
      color: this.w.color,
      level: this.w.level,
      lives: this.w.lives,
      shape: this.w.shape,
      chapter: this.w.chapter,
      laneX: this.w.laneX,
      laneWidth: this.w.laneWidth,
    };
  }
}
