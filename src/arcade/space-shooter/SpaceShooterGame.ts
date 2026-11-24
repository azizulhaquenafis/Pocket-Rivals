import { ArcadeSetup } from "../../shared/arcade/ArcadeSetup";
import { drawHeartsHUD } from "../../shared/arcade/hearts";
import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed, MatchRandom } from "../../shared/ai/MatchRandom";
import { ShooterWorld } from "./ShooterWorld";
import { drawShooter } from "./ShooterArt";
export class SpaceShooterGame implements MiniGame {
  private setup?: ArcadeSetup;
  private started = false;
  private ctx!: GameContext;
  private world = new ShooterWorld(new MatchRandom(freshSeed()).next);
  private g!: Phaser.GameObjects.Graphics;
  private hudG!: Phaser.GameObjects.Graphics;
  private lastHearts = "";
  private clip!: Phaser.GameObjects.Graphics;
  private mask!: Phaser.Display.Masks.GeometryMask;
  private banner!: Phaser.GameObjects.Text;
  private level!: Phaser.GameObjects.Text;
  private weapon!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private keys = new Set<string>();
  private target = 210;
  private dragging = false;
  private paused = false;
  private reported = false;
  private age = 0;
  private soundAge = 0;
  private clock = new FixedStep();
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.clip = ctx.scene.make.graphics({ x: 0, y: 0 });
    this.clip.fillStyle(0xffffff).fillRoundedRect(22, 110, 376, 542, 22);
    this.mask = this.clip.createGeometryMask();
    this.g.setMask(this.mask);
    this.hudG = ctx.scene.add.graphics();
    ctx.setArcadeHUD(0, "");
    this.banner = label(ctx.scene, 210, 375, "", 22);
    this.level = label(ctx.scene, 66, 138, "LV 1", 12, "#fff9ed");
    this.weapon = label(ctx.scene, 188, 138, "BLASTER", 11);
    this.toast = label(ctx.scene, 210, 548, "", 14);
    this.keys = ctx.input.keys([
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
      "Space",
    ]);
    ctx.setHint("");
    ctx.input.drag(
      (x, y) => {
        if (
          !this.started ||
          this.paused ||
          x < 24 ||
          x > 396 ||
          y < 400 ||
          y > 650
        )
          return false;
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
    this.draw();
    this.setup = new ArcadeSetup(
      {
        title: "Star Patrol",
        tiers: [
          "Steady formations, slower attacks and generous warning flashes.",
          "Quicker formations and more frequent enemy fire.",
          "Fast projectiles, short warnings and relentless attacks.",
        ],
      },
      (tier) => {
        this.world = new ShooterWorld(new MatchRandom(freshSeed()).next, tier);
        this.started = true;
        this.age = 0;
        this.keys.clear();
        this.clock.reset();
        ctx.audio.play("start", 0.5);
        this.draw();
        this.syncHearts();
      },
    );
  }
  private syncHearts() {
    const max = Math.max(3, this.world.lives);
    const key = this.started ? `${this.world.lives}:${max}` : "";
    if (key === this.lastHearts) return;
    this.lastHearts = key;
    if (this.started) drawHeartsHUD(this.hudG, this.world.lives, max);
    else this.hudG.clear();
  }
  update(dt: number) {
    if (!this.started || this.paused || this.reported) return;
    this.age += Math.min(dt, 0.1);
    const w = this.world,
      before = {
        score: w.score,
        lives: w.lives,
        wave: w.wave,
        pickup: w.pickupSerial,
        shot: w.shotSerial,
      };
    this.clock.advance(dt, (h) => {
      if (this.age < 0.7) return;
      if (this.keys.has("ArrowLeft") || this.keys.has("KeyA"))
        this.target = w.player.x - 370 * h;
      else if (this.keys.has("ArrowRight") || this.keys.has("KeyD"))
        this.target = w.player.x + 370 * h;
      else if (!this.dragging) this.target = w.player.x;
      w.step(h, this.target, this.dragging || this.keys.has("Space"));
    });
    if (w.score > before.score) this.ctx.audio.play("hit", 0.35);
    if (w.lives < before.lives) {
      this.ctx.audio.play("damage", 0.95);
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function"
      ) {
        try {
          navigator.vibrate([70, 40, 110]);
        } catch {
          /* Optional haptics must never interrupt gameplay. */
        }
      }
    }
    if (w.pickupSerial > before.pickup)
      this.ctx.audio.play(
        w.announcement.kind === "life" ? "perfect" : "capture",
        0.65,
      );
    if (w.wave > before.wave) this.ctx.audio.play("start", 0.5);
    if (w.shotSerial > before.shot && this.age - this.soundAge > 0.18) {
      this.ctx.audio.play("shoot", 0.12);
      this.soundAge = this.age;
    }
    this.draw();
    this.ctx.setArcadeHUD(w.score, "");
    this.syncHearts();
    if (w.dead && !this.reported) {
      this.reported = true;
      this.ctx.finishArcade(
        w.score,
        `Level ${w.wave} · ${w.kills} enemies cleared.`,
      );
    }
  }
  private draw() {
    const w = this.world;
    drawShooter(
      this.g,
      w,
      this.age,
      this.clock.fraction,
      this.dragging || this.keys.has("Space"),
    );
    this.level.setText(`LV ${w.wave}`);
    this.weapon.setText(w.weaponName + (w.rapid > 0 ? " · RAPID" : ""));
    this.banner.setText(
      w.transitioning
        ? `LEVEL ${w.wave} CLEARED`
        : this.age < 0.7
          ? "READY, PILOT?"
          : "",
    );
    const t = w.announcement.remaining / 1.5;
    this.toast
      .setText(t > 0 ? w.announcement.text : "")
      .setAlpha(Math.min(1, t * 3))
      .setY(548 - (1 - t) * 15);
  }
  pause() {
    this.paused = true;
    this.setup?.setPaused(true);
    this.dragging = false;
    this.clock.reset();
  }
  resume() {
    this.paused = false;
    this.setup?.setPaused(false);
    this.clock.reset();
  }
  dispose() {
    this.setup?.destroy();
    this.reported = true;
    this.g.destroy();
    this.hudG.destroy();
    this.mask.destroy();
    this.clip.destroy();
    [this.banner, this.level, this.weapon, this.toast].forEach((t) =>
      t.destroy(),
    );
  }
  snapshot() {
    const w = this.world;
    return {
      started: this.started,
      difficulty: w.difficulty,
      player: { ...w.player },
      score: w.score,
      lives: w.lives,
      wave: w.wave,
      dead: w.dead,
      enemies: w.enemies.filter((e) => e.alive).map((e) => ({ ...e })),
      projectiles: w.projectiles
        .filter((p) => p.active)
        .map(({ hits, ...p }) => ({ ...p })),
      pickups: w.pickups.filter((p) => p.active).map((p) => ({ ...p })),
      gear: {
        level: w.weaponLevel,
        rapid: w.rapid,
        laser: w.laser,
        drone: w.drone,
        shield: w.shield,
      },
      pickupSerial: w.pickupSerial,
      kills: w.kills,
      elapsed: w.elapsed,
      transitioning: w.transitioning,
      announcement: { ...w.announcement },
      lifeLost: { ...w.lifeLost },
      poolSize: w.projectiles.length,
    };
  }
}
