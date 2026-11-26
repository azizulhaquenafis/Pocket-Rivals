import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { SnakeView } from "./SnakeView";
import { SnakeSetup } from "./SnakeSetup";
import { garden, snake } from "./SnakeArt";
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
  private paused = false;
  private reported = false;
  private age = 0;
  private lastDir: Direction | null = null;
  private hadBonus = false;
  private wasDead = false;
  private start: { x: number; y: number } | null = null;
  private outsidePointerId: number | null = null;
  private outsideStart: { x: number; y: number } | null = null;
  private cleanupOutside?: () => void;
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
    // Allow swiping anywhere on the canvas below the top nav bar (inside AND outside the play grid)
    ctx.input.drag(
      (_x, y) => {
        if (!this.started || this.paused || y < 62) return false;
        this.start = { x: _x, y };
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
      { outside: true },
    );
    // Also allow starting swipes in the letterbox/outer stage area outside the canvas itself
    this.bindOutsideCanvasSwipe(ctx.scene.game.canvas);
    this.setup = new SnakeSetup((map, difficulty) => {
      this.world = new SnakeWorld(Math.random, map, difficulty);
      this.started = true;
      this.age = 0;
      this.lastDir = this.world.direction;
      this.hadBonus = !!this.world.bonus;
      this.wasDead = false;
      garden(this.background, this.world);
      ctx.audio.play("start");
    });
  }
  private bindOutsideCanvasSwipe(canvas: HTMLCanvasElement) {
    const toLogical = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width > 0 ? 420 / rect.width : 1;
      return {
        x: (e.clientX - rect.left) * scale,
        y: (e.clientY - rect.top) * scale,
      };
    };
    const clear = () => {
      this.outsidePointerId = null;
      this.outsideStart = null;
    };
    const down = (ev: Event) => {
      const e = ev as PointerEvent;
      if (
        !this.started ||
        this.paused ||
        this.outsidePointerId !== null ||
        e.button !== 0 ||
        e.target === canvas
      )
        return;
      if (
        e.target instanceof Element &&
        e.target.closest(
          "button, a, input, [role='dialog'], .snake-setup, #overlays",
        )
      )
        return;
      this.outsidePointerId = e.pointerId;
      this.outsideStart = toLogical(e);
      e.preventDefault();
    };
    const move = (ev: Event) => {
      const e = ev as PointerEvent;
      if (
        !this.started ||
        this.paused ||
        e.pointerId !== this.outsidePointerId ||
        !this.outsideStart
      )
        return;
      e.preventDefault();
      const p = toLogical(e);
      if (this.swipePoint(this.outsideStart, p.x, p.y)) this.outsideStart = p;
    };
    const up = (ev: Event) => {
      const e = ev as PointerEvent;
      if (e.pointerId !== this.outsidePointerId) return;
      if (this.started && !this.paused && this.outsideStart) {
        const p = toLogical(e);
        this.swipePoint(this.outsideStart, p.x, p.y);
      }
      clear();
    };
    const cancel = (ev: Event) => {
      const e = ev as PointerEvent;
      if (e.pointerId === this.outsidePointerId) clear();
    };
    window.addEventListener("pointerdown", down, { passive: false });
    window.addEventListener("pointermove", move, {
      capture: true,
      passive: false,
    });
    window.addEventListener("pointerup", up, { capture: true, passive: false });
    window.addEventListener("pointercancel", cancel, true);
    window.addEventListener("blur", clear);
    this.cleanupOutside = () => {
      clear();
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", cancel, true);
      window.removeEventListener("blur", clear);
    };
  }
  private swipePoint(origin: { x: number; y: number }, x: number, y: number) {
    const dx = x - origin.x,
      dy = y - origin.y;
    if (Math.hypot(dx, dy) < 15) return false;
    this.world.steer(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
    return true;
  }
  private swipe(x: number, y: number) {
    if (!this.start || this.paused) return;
    if (this.swipePoint(this.start, x, y)) this.start = { x, y };
  }
  update(dt: number) {
    if (this.paused || !this.started) return;
    this.age += dt;
    const before = this.world.score;
    if (this.age > 0.6) this.world.update(dt);
    const w = this.world;
    if (this.lastDir && w.direction !== this.lastDir && !w.dead)
      this.ctx.audio.play("soft", 0.25);
    if (!this.hadBonus && !!w.bonus) this.ctx.audio.play("metal", 0.75);
    if (w.score > before)
      this.ctx.audio.play(w.score - before > 1 ? "perfect" : "goal", 0.8);
    if (!this.wasDead && w.dead)
      this.ctx.audio.play(w.won ? "perfect" : "thud", 0.85);
    this.lastDir = w.direction;
    this.hadBonus = !!w.bonus;
    this.wasDead = w.dead;
    snake(this.g, w, this.age, this.view);
    const hud = `${w.map.name.toUpperCase()} · ${w.eaten}/${w.target} FRUIT`;
    if (this.hud !== `${w.score}:${hud}`) {
      this.hud = `${w.score}:${hud}`;
      this.ctx.setArcadeHUD(w.score, hud);
    }
    if (w.dead) this.defeat += dt;
    if (w.dead && this.defeat > 0.25 && !this.reported) {
      this.reported = true;
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
    this.outsidePointerId = null;
    this.outsideStart = null;
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.cleanupOutside?.();
    this.cleanupOutside = undefined;
    this.setup?.destroy();
    this.background.destroy();
    this.g.destroy();
    this.view.destroy();
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
