import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { FixedStep } from "../../shared/physics/FixedStep";
import { freshSeed } from "../../shared/ai/MatchRandom";
import { SpikeMatch } from "./Rules";
import { SpikeAI } from "./AI";
import { SpikeView } from "./SpikeView";
import { KEY_CODES, keyboardDirection, SpikeGamepads } from "./SpikeControls";
import { drawArena, JOYS, type Stick } from "./SpikeArt";
export class SpikeGame implements MiniGame {
  private ctx!: GameContext;
  private m = new SpikeMatch(freshSeed());
  private ai?: SpikeAI;
  private g!: Phaser.GameObjects.Graphics;
  private clip!: Phaser.GameObjects.Graphics;
  private mask!: Phaser.Display.Masks.GeometryMask;
  private fixed = new FixedStep();
  private view = new SpikeView();
  private pose?: ReturnType<SpikeView["sample"]>;
  private keys = new Set<string>();
  private pads = new SpikeGamepads();
  private movement = [
    { x: 0, y: 0, source: "none" },
    { x: 0, y: 0, source: "none" },
  ];
  private sticks: Stick[] = [
    { x: 0, y: 0, active: false },
    { x: 0, y: 0, active: false },
  ];
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
      this.ai = new SpikeAI(ctx.options.difficulty);
    }
    this.m = new SpikeMatch(
      this.ai?.personality.seed ?? freshSeed(),
      ctx.options.variant,
    );
    for (const i of [0, 1] as const) {
      if (i === 1 && this.ai) continue;
      const center = JOYS[i];
      ctx.input.drag(
        (x, y) => {
          if (
            this.paused ||
            this.done ||
            Math.hypot(x - center.x, y - center.y) > 58
          )
            return false;
          this.sticks[i].active = true;
          this.stick(i, x, y);
          return true;
        },
        (x, y) => this.stick(i, x, y),
        () => this.release(i),
        () => this.release(i),
      );
    }
    this.keys = ctx.input.keys(KEY_CODES);
    ctx.setHint("");
    ctx.setScore(0, 0);
    ctx.setClock("2:00", false);
    this.view.reset(this.m);
    this.pose = this.view.sample(this.m, 1, 0);
    this.draw();
    ctx.audio.play("start");
  }
  private stick(i: 0 | 1, x: number, y: number) {
    const dx = x - JOYS[i].x,
      dy = y - JOYS[i].y,
      len = Math.hypot(dx, dy),
      scale = Math.max(28, len);
    this.sticks[i].x = len < 5 ? 0 : dx / scale;
    this.sticks[i].y = len < 5 ? 0 : dy / scale;
  }
  private release(i: 0 | 1) {
    this.sticks[i] = { x: 0, y: 0, active: false };
    this.m.stop(i);
  }
  update(dt: number) {
    if (this.paused || this.done) return;
    this.m.advanceClock(dt);
    const pads = this.pads.poll(!!this.ai);
    for (const i of [0, 1] as const) {
      if (i === 1 && this.ai) continue;
      const key = keyboardDirection(this.keys, i, !!this.ai),
        pad = pads[i],
        touch = this.sticks[i];
      this.movement[i] =
        key.x || key.y
          ? { ...key, source: "keyboard" }
          : pad.x || pad.y
            ? { ...pad, source: "gamepad" }
            : {
                x: touch.x,
                y: touch.y,
                source: touch.active ? "touch" : "none",
              };
    }
    this.fixed.advance(dt, (h) => {
      this.view.capture(this.m);
      for (const i of [0, 1] as const) {
        if (i === 1 && this.ai) continue;
        const { x, y } = this.movement[i];
        if (x || y)
          this.m.target(
            i,
            this.m.players[i].x + x * 100,
            this.m.players[i].y + y * 100,
          );
        else this.m.stop(i);
      }
      this.ai?.update(h, this.m);
      const phase = this.m.phase,
        round = this.m.round,
        alive = this.m.players.map((p) => p.alive);
      this.m.step(h);
      if (this.m.phase !== phase) {
        if (this.m.phase === "extend") this.ctx.audio.play("shoot", 0.65);
        if (this.m.phase === "hold") this.ctx.audio.play("thud", 0.45);
        if (this.m.phase === "retract") this.ctx.audio.play("slide", 0.5);
        if (this.m.phase === "warning") this.ctx.audio.play("countdown", 0.5);
      }
      if (round !== this.m.round) {
        this.view.reset(this.m);
        this.ctx.audio.play("start", 0.5);
      }
      for (const i of [0, 1] as const)
        if (alive[i] && !this.m.players[i].alive)
          this.ctx.audio.play("fail", 0.6);
    });
    if (this.m.scores.join() !== this.scores) {
      if (this.scores) this.ctx.audio.play("goal", 0.65);
      this.scores = this.m.scores.join();
      this.ctx.setScore(...this.m.scores);
    }
    const seconds = Math.ceil(this.m.remaining);
    this.ctx.setClock(
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
      seconds <= 10,
    );
    this.pose = this.view.sample(
      this.m,
      this.fixed.fraction,
      Math.min(dt, 0.1),
    );
    this.ctx.reportAI(this.ai?.computationMs ?? 0);
    this.draw();
    if (this.m.winner) {
      this.finishAge += dt;
      if (this.finishAge > 0.7) {
        this.done = true;
        this.ctx.finish({ winner: this.m.winner, scores: this.m.scores });
      }
    }
  }
  private draw() {
    this.g.clear();
    drawArena(
      this.g,
      this.m,
      this.pose!,
      this.sticks.map((stick, i) =>
        stick.active
          ? stick
          : { ...stick, x: this.movement[i].x, y: this.movement[i].y },
      ),
      !!this.ai,
    );
  }
  pause() {
    this.paused = true;
    this.fixed.reset();
    this.pads.pause();
    this.movement.forEach((d) => {
      d.x = 0;
      d.y = 0;
      d.source = "none";
    });
    this.release(0);
    this.release(1);
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.done = true;
    this.pads.dispose();
    this.g.destroy();
    this.mask.destroy();
    this.clip.destroy();
  }
  snapshot() {
    return {
      sharedArena: true,
      map: this.m.map.id,
      visibleControls: this.ai ? [0] : [0, 1],
      players: this.m.players,
      scores: this.m.scores,
      warning: this.m.warning,
      direction: this.m.direction,
      wave: this.m.wave,
      round: this.m.round,
      phase: this.m.phase,
      lengths: this.m.lengths,
      between: this.m.between,
      winner: this.m.winner,
      remaining: this.m.remaining,
      sticks: this.sticks,
      controls: this.movement,
      renderState: this.pose,
      ai: this.ai?.personality.snapshot(),
    };
  }
}
