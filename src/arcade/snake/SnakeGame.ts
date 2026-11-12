import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { SnakeView } from "./SnakeView";
import { SnakeSetup } from "./SnakeSetup";
import { garden, snake } from "./SnakeArt";
import { label } from "../../shared/components/drawing";
import { SnakeWorld, type Direction } from "./SnakeRules";
export class SnakeGame implements MiniGame {
  private ctx!: GameContext;
  private world = new SnakeWorld();
  private background!: Phaser.GameObjects.Graphics;
  private setup?: SnakeSetup;
  private started = false;
  private defeat = 0;
  private hud = "";
  private view!: SnakeView;
  private g!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private paused = false;
  private reported = false;
  private age = 0;
  private start: { x: number; y: number } | null = null;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.background = ctx.scene.add.graphics();
    this.view = new SnakeView(ctx.scene);
    this.g = ctx.scene.add.graphics();
    garden(this.background, this.world);
    ctx.setHint("");
    const directions: Record<string, Direction> = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };
    ctx.input.press(Object.keys(directions), (key) => {
      if (!this.paused && this.started) this.world.steer(directions[key]);
    });
    for (const [x, y, text] of [
      [210, 574, "↑"],
      [152, 620, "←"],
      [210, 620, "↓"],
      [268, 620, "→"],
    ] as const)
      this.labels.push(label(ctx.scene, x, y, text, 25));
    ctx.input.tap((x, y) => {
      if (this.paused || !this.started) return;
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
        if (
          !this.started ||
          this.paused ||
          y < 138 ||
          y > 542 ||
          x < 38 ||
          x > 382
        )
          return false;
        this.start = { x, y };
        return true;
      },
      (x, y) => this.swipe(x, y),
      (x, y) => {
        this.swipe(x, y);
        this.start = null;
      },
      () => {
        this.start = null;
      },
    );
    this.setup = new SnakeSetup((map, difficulty) => {
      this.world = new SnakeWorld(Math.random, map, difficulty);
      this.started = true;
      this.age = 0;
      garden(this.background, this.world);
      ctx.audio.play("start");
    });
  }
  private swipe(x: number, y: number) {
    if (!this.start || this.paused) return;
    const dx = x - this.start.x,
      dy = y - this.start.y;
    if (Math.hypot(dx, dy) < 15) return;
    this.world.steer(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
    this.start = { x, y };
  }
  update(dt: number) {
    if (this.paused || !this.started) return;
    this.age += dt;
    const before = this.world.score;
    if (this.age > 0.6) this.world.update(dt);
    if (this.world.score > before) this.ctx.audio.play("goal");
    const w = this.world;
    snake(this.g, w, this.age, this.view);
    const hud = `${w.map.name.toUpperCase()} · ${w.eaten}/${w.target} FRUIT`;
    if (this.hud !== `${w.score}:${hud}`) {
      this.hud = `${w.score}:${hud}`;
      this.ctx.setArcadeHUD(w.score, hud);
    }
    if (w.dead) this.defeat += dt;
    if (w.dead && this.defeat > 0.25 && !this.reported) {
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
    this.start = null;
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.setup?.destroy();
    this.background.destroy();
    this.g.destroy();
    this.view.destroy();
    this.labels.forEach((l) => l.destroy());
  }
  snapshot() {
    return {
      started: this.started,
      map: this.world.map.id,
      difficulty: this.world.difficulty,
      eaten: this.world.eaten,
      target: this.world.target,
      bonus: this.world.bonus,
      bonusMoves: this.world.bonusMoves,
      body: this.world.body.map((c) => ({ ...c })),
      food: this.world.food,
      score: this.world.score,
      dead: this.world.dead,
      direction: this.world.direction,
    };
  }
}
