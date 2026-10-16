import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { label } from "../../shared/components/drawing";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed, MatchRandom } from "../../shared/ai/MatchRandom";
import { ShooterWorld } from "./ShooterWorld";
import { drawShooter } from "./ShooterArt";
export class SpaceShooterGame implements MiniGame {
  private ctx!: GameContext;
  private world = new ShooterWorld(new MatchRandom(freshSeed()).next);
  private g!: Phaser.GameObjects.Graphics;
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
        if (this.paused || x < 24 || x > 396 || y < 400 || y > 650)
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
  }
  update(dt: number) {
    if (this.paused || this.reported) return;
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
    if (w.lives < before.lives) this.ctx.audio.play("thud", 0.6);
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
    this.ctx.setArcadeHUD(w.score, "♥ ".repeat(w.lives));
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
    this.dragging = false;
    this.clock.reset();
  }
  resume() {
    this.paused = false;
    this.clock.reset();
  }
  dispose() {
    this.reported = true;
    this.g.destroy();
    this.mask.destroy();
    this.clip.destroy();
    [this.banner, this.level, this.weapon, this.toast].forEach((t) =>
      t.destroy(),
    );
  }
  snapshot() {
    const w = this.world;
    return {
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
      poolSize: w.projectiles.length,
    };
  }
}
