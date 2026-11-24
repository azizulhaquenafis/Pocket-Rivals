import config from "./config";
import { ArcadeGame } from "../../shared/arcade/ArcadeGame";
import type { Difficulty } from "../../shared/contracts/AIController";
import { circle, rounded } from "../../shared/components/drawing";
import { ShadowWorld, CELL, LEFT, TOP } from "./Rules";
export class Game extends ArcadeGame {
  private w = new ShadowWorld();
  private keys = new Set<string>();
  protected challenge = {
    instructions: config.instructions,
    title: "Shadow Step",
    tiers: [
      "Longer warning, short searchlights, route guides.",
      "Faster searchlights and less time to hide.",
      "Long sightlines and quick detection.",
    ] as const,
  };
  protected configure(t: Difficulty) {
    this.w = new ShadowWorld(t);
  }
  protected bind() {
    this.keys = this.ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
    ]);
    this.tap((x, y) => this.w.route(x, y));
  }
  protected clearInput() {
    this.w.path = [];
    this.keys.clear();
  }
  protected step(dt: number) {
    const lives = this.w.lives;
    const k = this.keys;
    this.w.step(
      dt,
      +(k.has("ArrowRight") || k.has("KeyD")) -
        +(k.has("ArrowLeft") || k.has("KeyA")),
      +(k.has("ArrowDown") || k.has("KeyS")) -
        +(k.has("ArrowUp") || k.has("KeyW")),
    );
    if (this.w.lives < lives) this.ctx.audio.play("fail", 0.45);
  }
  protected draw() {
    const w = this.w,
      g = this.g;
    this.board(0xd8d4e8);
    rounded(g, LEFT - 5, TOP - 5, 318, 406, 12, 0xebe8f2, 2);
    g.lineStyle(1, 0xb9b3cb, 0.35);
    for (let c = 1; c < 7; c++)
      g.lineBetween(LEFT + c * CELL, TOP, LEFT + c * CELL, TOP + 396);
    for (let r = 1; r < 9; r++)
      g.lineBetween(LEFT, TOP + r * CELL, LEFT + 308, TOP + r * CELL);
    for (const guard of w.guards) {
      const points = [{ x: guard.x, y: guard.y }];
      for (let a = guard.angle - 0.43; a <= guard.angle + 0.431; a += 0.043) {
        let d = 0;
        for (; d < w.settings.range; d += 5) {
          const t = w.tile(
            guard.x + Math.cos(a) * d,
            guard.y + Math.sin(a) * d,
          );
          if (!w.free(t.c, t.r)) break;
        }
        points.push({
          x: guard.x + Math.cos(a) * d,
          y: guard.y + Math.sin(a) * d,
        });
      }
      g.fillStyle(0xf3cd67, 0.4).fillPoints(points, true);
      circle(g, guard.x, guard.y, 10, 0x657889, 2);
      g.lineStyle(3, 0x242b32).lineBetween(
        guard.x,
        guard.y,
        guard.x + Math.cos(guard.angle) * 15,
        guard.y + Math.sin(guard.angle) * 15,
      );
    }
    for (const n of w.walls) {
      const p = w.center(n % 7, Math.floor(n / 7));
      rounded(g, p.x - 20, p.y - 20, 40, 40, 7, 0x8b81a0, 3);
      g.lineStyle(2, 0xc7bdd5).lineBetween(
        p.x - 12,
        p.y - 12,
        p.x + 12,
        p.y - 12,
      );
    }
    const e = w.exit;
    rounded(g, e.x - 15, e.y - 17, 30, 34, 6, w.key ? 0x92b875 : 0xc4bfce, 2);
    this.text("exit", e.x, e.y, "↑", 24);
    if (!w.key) {
      const p = w.treasure;
      g.fillStyle(0xf4cc60).fillPoints(
        [
          { x: p.x, y: p.y - 12 },
          { x: p.x + 10, y: p.y },
          { x: p.x, y: p.y + 12 },
          { x: p.x - 10, y: p.y },
        ],
        true,
      );
      g.lineStyle(2, 0x242b32).strokePoints(
        [
          { x: p.x, y: p.y - 12 },
          { x: p.x + 10, y: p.y },
          { x: p.x, y: p.y + 12 },
          { x: p.x - 10, y: p.y },
        ],
        true,
      );
    }
    if (this.difficulty === "medium" && w.path.length) {
      g.lineStyle(2, 0x58addb, 0.45);
      g.beginPath();
      g.moveTo(w.x, w.y);
      for (const p of w.path) g.lineTo(p.x, p.y);
      g.strokePath();
    }
    circle(g, w.x, w.y, 10, w.recovery ? 0xaaa6b2 : 0xf49b58, 3);
    g.fillStyle(0x242b32).fillRoundedRect(w.x - 7, w.y - 5, 14, 5, 2);
    if (w.exposure) {
      g.lineStyle(3, 0xdc6461)
        .beginPath()
        .arc(
          w.x,
          w.y,
          15,
          -Math.PI / 2,
          -Math.PI / 2 + (Math.PI * 2 * w.exposure) / w.settings.exposure,
        )
        .strokePath();
    }
    this.text("room", 210, 139, `ROOM ${Math.min(5, w.level)} / 5`, 17);
    this.text(
      "goal",
      210,
      615,
      w.transition ? "CLEAR" : w.key ? "REACH THE EXIT" : "FIND THE GOLD",
      16,
    );
    for (let i = 0; i < 3; i++)
      circle(g, 180 + i * 30, 587, 5, i < w.lives ? 0xf49b58 : 0xb7afc6, 0);
  }
  protected state() {
    return {
      score: this.w.score,
      done: this.w.done,
      detail: `${this.w.lives} LIVES`,
      result:
        this.w.level > 5
          ? "All five rooms escaped."
          : `${this.w.level - 1} rooms escaped.`,
    };
  }
  snapshot() {
    return {
      ...this.state(),
      started: this.started,
      difficulty: this.difficulty,
      x: this.w.x,
      y: this.w.y,
      level: this.w.level,
      key: this.w.key,
      path: this.w.path,
      exposure: this.w.exposure,
    };
  }
}
