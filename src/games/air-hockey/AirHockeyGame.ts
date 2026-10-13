import { saveHockey, restoreHockey } from "./HockeyState";
import { PossessionClock } from "./PossessionClock";
import { MatchClock } from "../../shared/rules/MatchClock";
import { AirHockeyAI } from "./AirHockeyAI";
import Phaser from "phaser";
import type {
  GameContext,
  MiniGame,
  Player,
} from "../../shared/contracts/GameModule";
import { theme, FIELD } from "../../core/ThemeManager";
import { FixedStep } from "../../shared/physics/FixedStep";
import { circle, rounded, label } from "../../shared/components/drawing";
import { Impacts } from "../../shared/effects/Impacts";
import { HockeyWorld } from "./AirHockeyPhysics";
export class AirHockey implements MiniGame {
  private ctx!: GameContext;
  private world!: HockeyWorld;
  private clock = new FixedStep();
  private matchClock = new MatchClock();
  private graphics!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private effects = new Impacts();
  private possession = new PossessionClock();
  private possessionLabel!: Phaser.GameObjects.Text;
  private violation = false;
  private sinceSave = 0;
  private paused = false;
  private ai?: AirHockeyAI;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    if (ctx.options.mode === "ai")
      this.ai = new AirHockeyAI(ctx.options.difficulty);
    ctx.input.dragHalves();
    ctx.setHint("DRAG YOUR MALLET · FIRST TO 5");
    this.bg = ctx.scene.add.graphics();
    const g = this.bg;
    rounded(g, 24, 112, 372, 538, 44, theme.ice, 4);
    g.lineStyle(2, 0x90b9bf).strokeRoundedRect(40, 128, 340, 506, 12);
    g.lineStyle(3, 0x90b9bf).lineBetween(25, 381, 395, 381);
    g.strokeCircle(210, 381, 55);
    g.strokeCircle(210, 381, 6);
    g.fillStyle(theme.blue, 0.15).fillCircle(210, 145, 52);
    g.fillStyle(theme.orange, 0.15).fillCircle(210, 617, 52);
    rounded(g, 147, 102, 126, 18, 7, theme.blue, 3);
    rounded(g, 147, 642, 126, 18, 7, theme.orange, 3);
    this.graphics = ctx.scene.add.graphics();
    this.possessionLabel = label(ctx.scene, 340, 140, "", 12);
    this.status = label(ctx.scene, 210, 300, "READY?", 28);
    this.world = new HockeyWorld(
      (x, y) => {
        this.effects.burst(x, y, theme.white);
        ctx.audio.play("hit");
      },
      (p) => this.goal(p),
    );
    restoreHockey(
      this.world,
      this.matchClock,
      this.possession,
      ctx.restoredState,
    );
    ctx.setScore(...this.world.scores);
    this.save();
  }
  private goal(p: Player) {
    this.possession.reset();
    this.ai?.reset();
    this.ctx.setScore(...this.world.scores);
    this.ctx.audio.play("goal");
    const winner = this.matchClock.score(this.world.scores);
    if (winner !== null) {
      this.world.done = true;
      this.ctx.finish({ winner, scores: [...this.world.scores] });
    }
  }
  update(dt: number) {
    if (this.paused) return;
    const w = this.world;
    const winner = this.matchClock.advance(dt, w.scores);
    this.ctx.setClock(this.matchClock.text, this.matchClock.remaining <= 10);
    if (this.matchClock.overtime)
      this.ctx.setHint("SUDDEN DEATH · NEXT POINT WINS");
    if (winner !== null) {
      w.done = true;
      this.ctx.finish({ winner, scores: [...w.scores] });
      return;
    }
    this.clock.advance(dt, (step) => {
      w.step(step, [
        this.ctx.input.players[0].down
          ? this.ctx.input.players[0]
          : w.mallets[0],
        this.ai
          ? this.ai.update(step, w)
          : this.ctx.input.players[1].down
            ? this.ctx.input.players[1]
            : w.mallets[1],
      ]);
      if (w.cooldown <= 0 && !w.done) {
        const penalty = this.possession.advance(step, w.puck.y);
        if (penalty) {
          this.violation = true;
          w.awardPoint(penalty);
        }
      }
    });
    if (w.cooldown <= 0) this.violation = false;
    this.possessionLabel
      .setText(
        this.possession.side ? `${Math.ceil(this.possession.remaining)}s` : "",
      )
      .setPosition(348, this.possession.side === 1 ? 619 : 143)
      .setColor(this.possession.remaining <= 5 ? "#ae432c" : "#62858b")
      .setAlpha(this.possession.remaining <= 5 ? 1 : 0.7);
    this.sinceSave += dt;
    if (this.sinceSave >= 1) {
      this.sinceSave = 0;
      this.save();
    }
    const g = this.graphics;
    g.clear();
    w.mallets.forEach((m, i) => {
      g.fillStyle(theme.ink, 0.12).fillCircle(m.x, m.y + 5, 30);
      circle(g, m.x, m.y, 29, i === 0 ? theme.orange : theme.blue, 4);
      g.lineStyle(3, theme.ink, 0.2).strokeCircle(m.x, m.y, 19);
      circle(g, m.x, m.y - 2, 12, i === 0 ? theme.orange : theme.blue, 3);
      g.lineStyle(2, theme.white, 0.7)
        .beginPath()
        .arc(m.x, m.y - 2, 8, 3.5, 5)
        .strokePath();
    });
    g.fillStyle(theme.ink, 0.12).fillCircle(w.puck.x, w.puck.y + 4, 12);
    circle(g, w.puck.x, w.puck.y, 11, theme.ink, 0);
    g.fillStyle(0x5b6770).fillCircle(w.puck.x - 2, w.puck.y - 3, 4);
    this.effects.draw(g, dt);
    this.status.setText(
      w.cooldown > 0.5
        ? this.violation
          ? "POSSESSION!"
          : "READY?"
        : w.cooldown > 0
          ? "GO!"
          : "",
    );
  }
  private save() {
    if (!this.world.done)
      this.ctx.saveState(
        saveHockey(this.world, this.matchClock, this.possession),
      );
  }
  pause() {
    this.save();
    this.paused = true;
    this.clock.reset();
  }
  resume() {
    this.paused = false;
    this.clock.reset();
  }
  dispose() {
    this.bg.destroy();
    this.graphics.destroy();
    this.status.destroy();
    this.possessionLabel.destroy();
  }
  snapshot() {
    return {
      possession: {
        side: this.possession.side,
        remaining: this.possession.remaining,
      },
      puck: { ...this.world.puck },
      mallets: this.world.mallets.map((m) => ({ ...m })),
      timer: {
        remaining: this.matchClock.remaining,
        overtime: this.matchClock.overtime,
      },
      scores: [...this.world.scores],
    };
  }
}
