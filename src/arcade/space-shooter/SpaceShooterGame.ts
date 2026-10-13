import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { ShooterWorld } from "./ShooterWorld";
export class SpaceShooterGame implements MiniGame {
  private ctx!: GameContext;
  private world = new ShooterWorld();
  private g!: Phaser.GameObjects.Graphics;
  private banner!: Phaser.GameObjects.Text;
  private keys = new Set<string>();
  private target = 210;
  private dragging = false;
  private paused = false;
  private reported = false;
  private age = 0;
  private clock = new FixedStep();
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.banner = label(ctx.scene, 210, 375, "", 22);
    this.keys = ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
      "Space",
    ]);
    ctx.setHint("DRAG TO MOVE + FIRE · ARROWS / A D + SPACE");
    ctx.input.drag(
      (x, y) => {
        if (this.paused || y < 400 || y > 650) return false;
        this.target = x;
        this.dragging = true;
        return true;
      },
      (x) => {
        this.target = x;
      },
      () => {
        this.dragging = false;
      },
      () => {
        this.dragging = false;
      },
    );
  }
  update(dt: number) {
    if (this.paused) return;
    this.age += dt;
    const w = this.world,
      before = w.score,
      lives = w.lives;
    this.clock.advance(dt, (step) => {
      if (this.age < 0.7) return;
      if (this.keys.has("ArrowLeft") || this.keys.has("KeyA"))
        this.target = w.player.x - 370 * step;
      else if (this.keys.has("ArrowRight") || this.keys.has("KeyD"))
        this.target = w.player.x + 370 * step;
      else if (!this.dragging) this.target = w.player.x;
      w.step(step, this.target, this.dragging || this.keys.has("Space"));
    });
    if (w.score > before) this.ctx.audio.play("hit");
    if (w.lives < lives) this.ctx.audio.play("draw");
    const g = this.g;
    g.clear();
    rounded(g, 24, 112, 372, 538, 20, 0xd8d4e6, 4);
    g.fillStyle(theme.ink, 0.18);
    for (let i = 0; i < 35; i++) {
      const x = 38 + ((i * 137) % 345),
        y = 126 + ((i * 67 + this.age * 5) % 506);
      g.fillCircle(x, y, i % 3 === 0 ? 2 : 1);
    }
    for (const e of w.enemies) {
      if (!e.alive) continue;
      const color =
        e.kind === 0 ? theme.orange : e.kind === 1 ? theme.blue : theme.green;
      g.fillStyle(color).lineStyle(3, theme.ink);
      g.fillRoundedRect(
        e.x - 14,
        e.y - 10,
        28,
        20,
        e.kind === 1 ? 9 : 5,
      ).strokeRoundedRect(e.x - 14, e.y - 10, 28, 20, e.kind === 1 ? 9 : 5);
      g.fillStyle(theme.ink)
        .fillRect(e.x - 7, e.y - 3, 4, 5)
        .fillRect(e.x + 3, e.y - 3, 4, 5);
      g.lineStyle(3, theme.ink)
        .lineBetween(e.x - 9, e.y + 10, e.x - 13, e.y + 15)
        .lineBetween(e.x + 9, e.y + 10, e.x + 13, e.y + 15);
      if (e.hp > 1) g.lineBetween(e.x - 6, e.y - 14, e.x + 6, e.y - 14);
    }
    for (const p of w.projectiles)
      if (p.active) {
        g.lineStyle(
          p.enemy ? 4 : 5,
          p.enemy ? 0xbd694f : theme.white,
        ).lineBetween(p.x, p.y, p.x, p.y + (p.enemy ? -9 : 11));
      }
    const x = w.player.x,
      y = w.player.y;
    g.fillStyle(
      theme.orange,
      w.invulnerable > 0 ? 0.5 + 0.5 * Math.sin(this.age * 18) ** 2 : 1,
    ).lineStyle(3, theme.ink);
    g.fillTriangle(x, y - 18, x - 20, y + 14, x + 20, y + 14).strokeTriangle(
      x,
      y - 18,
      x - 20,
      y + 14,
      x + 20,
      y + 14,
    );
    g.fillStyle(theme.blue).fillRoundedRect(x - 5, y - 4, 10, 14, 4);
    g.lineStyle(3, theme.ink).strokeRoundedRect(x - 5, y - 4, 10, 14, 4);
    if (this.dragging || this.keys.has("Space")) {
      g.fillStyle(theme.white).fillTriangle(
        x - 5,
        y + 17,
        x + 5,
        y + 17,
        x,
        y + 24 + Math.sin(this.age * 35) * 4,
      );
    }
    this.banner.setText(
      w.transitioning
        ? `WAVE ${w.wave} CLEARED!`
        : this.age < 0.7
          ? "READY, RIVAL?"
          : "",
    );
    this.ctx.setArcadeHUD(
      w.score,
      `WAVE ${w.wave}     ${"♥ ".repeat(w.lives)}${"♡ ".repeat(3 - w.lives)}`,
    );
    if (w.dead && !this.reported) {
      this.reported = true;
      this.ctx.finishArcade(
        w.score,
        `You reached wave ${w.wave}. The stars await.`,
      );
    }
  }
  pause() {
    this.paused = true;
    this.dragging = false;
    this.clock.reset();
  }
  resume() {
    this.paused = false;
    this.clock.reset();
  }
  dispose() {
    this.g.destroy();
    this.banner.destroy();
  }
  snapshot() {
    return {
      player: { ...this.world.player },
      score: this.world.score,
      lives: this.world.lives,
      wave: this.world.wave,
      dead: this.world.dead,
      enemies: this.world.enemies.filter((e) => e.alive).map((e) => ({ ...e })),
      projectiles: this.world.projectiles
        .filter((p) => p.active)
        .map((p) => ({ ...p })),
    };
  }
}
