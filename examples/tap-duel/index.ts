import type Phaser from "phaser";
import type { GameContext, MiniGame } from "../../shared/interfaces/MiniGame";
import { FIELD, theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
class TapDuel implements MiniGame {
  private score: [number, number] = [0, 0];
  private paused = false;
  private finished = false;
  private graphics!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  initialize(ctx: GameContext) {
    ctx.setHint("TAP YOUR HALF · FIRST TO 10");
    ctx.setScore(0, 0);
    this.graphics = ctx.scene.add.graphics();
    rounded(this.graphics, 24, 112, 372, 260, 22, theme.blue);
    rounded(this.graphics, 24, 390, 372, 260, 22, theme.orange);
    this.labels = [
      label(ctx.scene, 210, 510, "TAP!", 34),
      label(ctx.scene, 210, 250, "TAP!", 34).setRotation(Math.PI),
    ];
    ctx.input.tap((x, y, player) => {
      if (
        this.paused ||
        this.finished ||
        x < FIELD.left ||
        x > FIELD.right ||
        y < FIELD.top ||
        y > FIELD.bottom
      )
        return;
      this.score[player - 1]++;
      ctx.setScore(...this.score);
      ctx.audio.play("hit");
      if (this.score[player - 1] === 10) {
        this.finished = true;
        ctx.finish({ winner: player, scores: [...this.score] });
      }
    });
  }
  update(_dt: number) {}
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  dispose() {
    this.graphics.destroy();
    this.labels.forEach((text) => text.destroy());
  }
}
export default () => new TapDuel();
