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
  private graphics!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private effects = new Impacts();
  private paused = false;
  private ai?:AirHockeyAI;
  initialize(ctx: GameContext) {
    this.ctx = ctx;
    if(ctx.options.mode==="ai")this.ai=new AirHockeyAI(ctx.options.difficulty);
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
    this.status = label(ctx.scene, 210, 300, "READY?", 28);
    this.world = new HockeyWorld(
      (x, y) => {
        this.effects.burst(x, y, theme.white);
        ctx.audio.play("hit");
      },
      (p) => this.goal(p),
    );
    ctx.setScore(0, 0);
  }
  private goal(p: Player) {
    this.ctx.setScore(...this.world.scores);
    this.ctx.audio.play("goal");
    if (this.world.done)
      this.ctx.finish({ winner: p, scores: [...this.world.scores] });
  }
  update(dt: number) {
    if (this.paused) return;
    const w = this.world;
    this.clock.advance(dt, (step) =>
      w.step(step, [
        this.ctx.input.players[0].down
          ? this.ctx.input.players[0]
          : w.mallets[0],
        this.ai ? this.ai.update(step,w) : this.ctx.input.players[1].down
          ? this.ctx.input.players[1]
          : w.mallets[1],
      ]),
    );
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
      w.cooldown > 0.5 ? "READY?" : w.cooldown > 0 ? "GO!" : "",
    );
  }
  pause() {
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
  }
  snapshot() {
    return {
      puck: { ...this.world.puck },
      mallets: this.world.mallets.map((m) => ({ ...m })),
      scores: [...this.world.scores],
    };
  }
}
