import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, circle, label } from "../../shared/components/drawing";
import { SnakeWorld, type Direction } from "./SnakeRules";
export class SnakeGame implements MiniGame {
  private ctx!: GameContext;
  private world = new SnakeWorld();
  private g!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private paused = false;
  private reported = false;
  private age = 0;
  private start: { x: number; y: number } | null = null;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    ctx.setHint("ARROWS OR WASD · SWIPE OR USE THE PAD");
    this.keys = ctx.input.keys([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
    ]);
    for (const [x, y, text] of [
      [210, 574, "↑"],
      [152, 620, "←"],
      [210, 620, "↓"],
      [268, 620, "→"],
    ] as const)
      this.labels.push(label(ctx.scene, x, y, text, 25));
    ctx.input.tap((x, y) => {
      if (this.paused) return;
      let dir: Direction | undefined;
      if (Math.abs(x - 210) < 24 && Math.abs(y - 574) < 23) dir = "up";
      else if (Math.abs(y - 620) < 24) {
        if (Math.abs(x - 152) < 24) dir = "left";
        if (Math.abs(x - 210) < 24) dir = "down";
        if (Math.abs(x - 268) < 24) dir = "right";
      }
      if (dir) this.world.steer(dir);
    });
    ctx.input.drag(
      (x, y) => {
        if (y < 130 || y > 550) return false;
        this.start = { x, y };
        return true;
      },
      () => {},
      (x, y) => {
        if (!this.start) return;
        const dx = x - this.start.x,
          dy = y - this.start.y;
        this.start = null;
        if (Math.hypot(dx, dy) > 15)
          this.world.steer(
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "right"
                : "left"
              : dy > 0
                ? "down"
                : "up",
          );
      },
      () => {
        this.start = null;
      },
    );
  }
  update(dt: number) {
    if (this.paused) return;
    this.age += dt;
    const map: Record<string, Direction> = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };
    for (const key of this.keys)
      if (!this.pressed.has(key)) this.world.steer(map[key]);
    this.pressed = new Set(this.keys);
    const before = this.world.score;
    if (this.age > 0.6) this.world.update(dt);
    if (this.world.score > before) this.ctx.audio.play("goal");
    const w = this.world,
      g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, theme.green, 4);
    rounded(g, 38, 138, 344, 404, 8, 0xdde9c4, 3);
    g.fillStyle(theme.ink, 0.08);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 17; x++) g.fillCircle(50 + x * 20, 150 + y * 20, 1);
    const t = Math.min(1, w.accumulator / w.interval);
    for (let i = w.body.length - 1; i >= 0; i--) {
      const c = w.body[i],
        old = w.previous[i] ?? c,
        x = 50 + (old.x + (c.x - old.x) * t) * 20,
        y = 150 + (old.y + (c.y - old.y) * t) * 20;
      rounded(g, x - 9, y - 9, 18, 18, 5, i ? theme.blue : theme.orange, 2);
      if (i === 0) {
        const vertical = w.direction === "up" || w.direction === "down";
        for (const side of [-1, 1])
          g.fillStyle(theme.ink).fillCircle(
            x + (vertical ? side * 4 : w.direction === "right" ? 4 : -4),
            y + (vertical ? (w.direction === "down" ? 4 : -4) : side * 4),
            2,
          );
      }
    }
    if (w.food) {
      circle(g, 50 + w.food.x * 20, 150 + w.food.y * 20, 6, theme.orange, 2);
      g.lineStyle(2, theme.ink).lineBetween(
        51 + w.food.x * 20,
        143 + w.food.y * 20,
        54 + w.food.x * 20,
        140 + w.food.y * 20,
      );
    }
    for (const [x, y] of [
      [210, 574],
      [152, 620],
      [210, 620],
      [268, 620],
    ])
      rounded(g, x - 24, y - 22, 48, 44, 12, theme.white, 2);
    this.ctx.setArcadeHUD(
      w.score,
      `LEVEL ${1 + Math.floor(w.score / 50)} · ${w.body.length} LITTLE SQUARES`,
    );
    if (w.dead && !this.reported) {
      this.reported = true;
      this.ctx.audio.play("draw");
      this.ctx.finishArcade(
        w.score,
        w.won ? "You filled the whole garden." : "A little longer next time.",
      );
    }
  }
  pause() {
    this.paused = true;
    this.world.clearInput();
    this.pressed.clear();
    this.start = null;
  }
  resume() {
    this.paused = false;
    this.age = 0;
  }
  dispose() {
    this.g.destroy();
    this.labels.forEach((l) => l.destroy());
  }
  snapshot() {
    return {
      body: this.world.body.map((c) => ({ ...c })),
      food: this.world.food,
      score: this.world.score,
      dead: this.world.dead,
      direction: this.world.direction,
    };
  }
}
