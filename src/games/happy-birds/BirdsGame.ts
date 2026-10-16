import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { BirdsMatch } from "./Rules";
import { BirdsAI } from "./AI";
import { BirdView } from "./BirdView";
import { label } from "../../shared/components/drawing";
import { arena } from "./BirdArt";
export class BirdsGame implements MiniGame {
  private ctx!: GameContext;
  private m = new BirdsMatch(freshSeed());
  private ai?: BirdsAI;
  private g!: Phaser.GameObjects.Graphics;
  private clip!: Phaser.GameObjects.Graphics;
  private mask!: Phaser.Display.Masks.GeometryMask;
  private goalLabels: Phaser.GameObjects.Text[] = [];
  private fixed = new FixedStep();
  private view = new BirdView();
  private renderState?: ReturnType<BirdView["sample"]>;
  private paused = false;
  private done = false;
  private scores = "";
  private finishAge = 0;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();
    this.clip = ctx.scene.make.graphics({ x: 0, y: 0 });
    this.clip.fillStyle(0xffffff).fillRoundedRect(22, 110, 376, 542, 22);
    this.mask = this.clip.createGeometryMask();
    this.g.setMask(this.mask);
    if (ctx.options.mode === "ai") {
      this.ai = new BirdsAI(ctx.options.difficulty);
      this.m = new BirdsMatch(this.ai.personality.seed);
    }
    ctx.input.tap((x, y) => {
      if (x >= 24 && x <= 396 && y >= 112 && y <= 650)
        this.flap(y < 380 ? 1 : 0);
    });
    ctx.input.press(["Space", "KeyA"], () => this.flap(0));
    ctx.input.press(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"], () =>
      this.flap(this.ai ? 0 : 1),
    );
    ctx.input.press(["Enter", "KeyL"], () => this.flap(1));
    ctx.setHint("");
    ctx.setScore(0, 0);
    ctx.setClock("", false);
    this.goalLabels = [
      label(ctx.scene, 73, 86, "★ / 15", 12, "#a17e2d"),
      label(ctx.scene, 73, 690, "★ / 15", 12, "#a17e2d"),
    ];
    if (!this.ai) this.goalLabels[0].setRotation(Math.PI);
    this.view.reset(this.m);
    this.renderState = this.view.sample(this.m, 1, 0);
    this.draw();
    ctx.audio.play("start");
  }
  private flap(p: 0 | 1, ai = false) {
    if (this.paused || this.done || (p === 1 && this.ai && !ai)) return;
    if (this.m.flap(p)) {
      this.view.wings[p] = 1;
      this.ctx.audio.play("shoot", 0.3);
    }
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.fixed.advance(dt, (h) => {
      this.view.capture(this.m);
      if (this.ai?.update(h, this.m)) this.flap(1, true);
      const oldRound = this.m.round,
        oldBetween = this.m.between;
      const old = this.m.players.map((p) => ({
        alive: p.alive,
        bounces: p.bounces,
        recovery: p.recovery,
      }));
      this.m.step(h);
      if (
        this.m.round !== oldRound ||
        (oldBetween > 0 && this.m.between === 0)
      ) {
        this.view.reset(this.m);
        this.ctx.audio.play("start", 0.5);
      }
      for (const i of [0, 1] as const) {
        const p = this.m.players[i];
        if (old[i].recovery > 0 && p.recovery === 0) {
          this.view.resetBird(this.m, i);
          this.view.wings[i] = 1;
          this.ctx.audio.play("start", 0.4);
        }
        if (old[i].alive && !p.alive) this.ctx.audio.play("thud", 0.6);
        else if (p.bounces > old[i].bounces) {
          this.view.bumps[i] = 1;
          this.ctx.audio.play("hit", 0.35);
        }
      }
    });
    this.renderState = this.view.sample(
      this.m,
      this.fixed.fraction,
      Math.min(0.1, dt),
    );
    if (this.m.scores.join() !== this.scores) {
      if (this.scores) this.ctx.audio.play("capture", 0.55);
      this.scores = this.m.scores.join();
      this.ctx.setScore(...this.m.scores);
    }
    this.draw();
    if (this.m.winner) {
      this.finishAge += dt;
      if (this.finishAge > 0.75) {
        this.done = true;
        this.ctx.finish({ winner: this.m.winner, scores: this.m.scores });
      }
    }
  }
  private draw() {
    this.g.clear();
    arena(this.g, this.m, this.renderState!, this.view.trails);
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
    this.goalLabels.forEach((t) => t.destroy());
    this.goalLabels = [];
  }
  snapshot() {
    return {
      players: this.m.players,
      walls: this.m.walls,
      sharedArena: true,
      scores: this.m.scores,
      round: this.m.round,
      between: this.m.between,
      winner: this.m.winner,
      stars: this.m.stars,
      bursts: this.m.bursts,
      goal: 15,
      renderState: this.renderState,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
