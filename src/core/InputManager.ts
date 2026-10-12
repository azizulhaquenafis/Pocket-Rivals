import Phaser from "phaser";
import { FIELD } from "./ThemeManager";
import type { Player } from "../shared/contracts/GameModule";
export interface TouchPoint {
  x: number;
  y: number;
  down: boolean;
  id: number | null;
}
/** Scene-owned subscriptions. Each half owns at most one pointer, never a global activePointer. */
export class InputManager {
  readonly players: [TouchPoint, TouchPoint] = [
    { x: 210, y: 600, down: false, id: null },
    { x: 210, y: 160, down: false, id: null },
  ];
  private cleanups: (() => void)[] = [];
  private enabled = true;
  constructor(private scene: Phaser.Scene) {}
  dragHalves() {
    const down = (p: Phaser.Input.Pointer) => {
      const pos = this.scene.cameras.main.getWorldPoint(p.x, p.y);
      if (
        !this.enabled ||
        pos.y < FIELD.top ||
        pos.y > FIELD.bottom ||
        pos.x < FIELD.left ||
        pos.x > FIELD.right
      )
        return;
      const player = this.players[pos.y >= FIELD.middle ? 0 : 1];
      if (player.id !== null) return;
      player.id = p.id;
      player.down = true;
      player.x = pos.x;
      player.y = pos.y;
    };
    const move = (p: Phaser.Input.Pointer) => {
      if (!this.enabled) return;
      const pos = this.scene.cameras.main.getWorldPoint(p.x, p.y);
      const player = this.players.find((v) => v.id === p.id);
      if (player) {
        player.x = pos.x;
        player.y = pos.y;
      }
    };
    const up = (p: Phaser.Input.Pointer) => {
      const player = this.players.find((v) => v.id === p.id);
      if (player) {
        player.down = false;
        player.id = null;
      }
    };
    this.on("pointerdown", down);
    this.on("pointermove", move);
    this.on("pointerup", up);
    this.on("pointerupoutside", up);
    const cancel = () => this.clear();
    this.scene.game.canvas.addEventListener("touchcancel", cancel);
    this.scene.game.canvas.addEventListener("pointercancel", cancel);
    this.cleanups.push(() => {
      this.scene.game.canvas.removeEventListener("touchcancel", cancel);
      this.scene.game.canvas.removeEventListener("pointercancel", cancel);
    });
  }
  tap(fn: (x: number, y: number, player: Player) => void) {
    this.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.enabled) {
        const pos = this.scene.cameras.main.getWorldPoint(p.x, p.y);
        fn(pos.x, pos.y, pos.y >= FIELD.middle ? 1 : 2);
      }
    });
  }
  private on(event: string, handler: (...args: any[]) => void) {
    this.scene.input.on(event, handler);
    this.cleanups.push(() => this.scene.input.off(event, handler));
  }
  clear() {
    this.players.forEach((p) => {
      p.down = false;
      p.id = null;
    });
  }
  pause() {
    this.enabled = false;
    this.clear();
  }
  resume() {
    this.enabled = true;
    this.clear();
  }
  dispose() {
    this.pause();
    this.cleanups.splice(0).forEach((fn) => fn());
  }
  get listenerCount() {
    return this.cleanups.length;
  }
}
