import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { GravityMatch } from "./Rules";
import { GravityView } from "./GravityView";
import { course, runners } from "./GravityArt";
import { GravityAI } from "./AI";
export class GravityGame implements MiniGame {
  private ctx!: GameContext;
  private m = new GravityMatch(freshSeed());
  private ai?: GravityAI;
  private g!: Phaser.GameObjects.Graphics;
  private clip!: Phaser.GameObjects.Graphics;
  private mask!: Phaser.Display.Masks.GeometryMask;
  private fixed = new FixedStep();
  private view = new GravityView();
  private renderState?: ReturnType<GravityView["sample"]>;
  private paused = false;
  private done = false;
  private score = "";
  private finishAge = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.clip = ctx.scene.make.graphics({ x: 0, y: 0 });
    this.clip.fillStyle(0xffffff).fillRoundedRect(22, 110, 376, 542, 22);
    this.mask = this.clip.createGeometryMask();
    this.g.setMask(this.mask);
    this.m = new GravityMatch(this.m.seed, ctx.options.variant);
    if (ctx.options.mode === "ai") {
      this.ai = new GravityAI(ctx.options.difficulty);
      this.m = new GravityMatch(this.ai.personality.seed, ctx.options.variant);
    }
    ctx.input.tap((x, y) => {
      if (x >= 24 && x <= 396 && y >= 112 && y <= 650)
        this.flip(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "KeyA"], () => this.flip(0));
    ctx.input.press(["ArrowUp", "Enter", "KeyL"], () => this.flip(1));
    ctx.setHint("");
    ctx.setScore(0, 0);
    this.view.reset(this.m);
    ctx.setClock("", false);
    ctx.audio.play("start");
    this.draw();
  }
  private flip(p: 0 | 1, ai = false) {
    if (this.paused || this.done || (p === 1 && this.ai && !ai)) return;
    if (this.m.flip(p)) {
      this.view.flip(p);
      this.ctx.audio.play("shoot", 0.45);
    }
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      this.view.capture(this.m);
      if (this.ai?.update(this.m)) this.flip(1, true);
      const before = this.m.players.map((p) => ({ alive: p.alive, vy: p.vy }));
      const round = this.m.round;
      this.m.step(h);
      if (round !== this.m.round) {
        this.view.reset(this.m);
        this.ctx.audio.play("start", 0.65);
      }
      for (const i of [0, 1] as const) {
        const p = this.m.players[i];
        if (before[i].alive && !p.alive) this.ctx.audio.play("fail", 0.7);
        else if (Math.abs(before[i].vy) > 80 && p.vy === 0 && p.alive) {
          this.view.land(i);
          this.ctx.audio.play("wood", 0.35);
        }
      }
    });
    if (this.m.scores.join() !== this.score) {
      if (this.score) this.ctx.audio.play("goal");
      this.score = this.m.scores.join();
      this.ctx.setScore(...this.m.scores);
    }
    this.renderState = this.view.sample(
      this.m,
      this.fixed.fraction,
      Math.min(dt, 0.1),
    );
    this.draw();
    if (this.m.winner) this.finishAge += dt;
    if (this.m.winner && this.finishAge > 0.65) {
      this.done = true;
      this.ctx.finish({ winner: this.m.winner, scores: this.m.scores });
    }
  }
  private draw() {
    const g = this.g;
    g.clear();
    course(g, this.m, this.renderState?.distance ?? this.m.distance);
    runners(g, this.m, this.renderState);
  }
  pause() {
    this.paused = true;
    this.fixed.reset();
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.done = true;
    this.g.destroy();
    this.mask.destroy();
    this.clip.destroy();
  }
  snapshot() {
    return {
      players: this.m.players,
      gaps: this.m.gaps,
      obstacles: this.m.obstacles,
      sharedCourse: true,
      map: this.m.map.id,
      speed: this.m.speed(),
      age: this.m.age,
      patterns: [...this.m.patterns],
      renderState: this.renderState,
      distance: this.m.distance,
      scores: this.m.scores,
      round: this.m.round,
      between: this.m.between,
      winner: this.m.winner,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
