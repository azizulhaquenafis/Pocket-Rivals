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
  private clearHandlers: (() => void)[] = [];
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
  drag(
    start: (x: number, y: number) => boolean,
    move: (x: number, y: number) => void,
    end: (x: number, y: number) => void,
    cancel: () => void = () => {},
    options: { outside?: boolean } = {},
  ) {
    if (options.outside) return this.capturedDrag(start, move, end, cancel);
    let id: number | null = null;
    const point = (p: Phaser.Input.Pointer) =>
      this.scene.cameras.main.getWorldPoint(p.x, p.y);
    this.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.enabled || id !== null) return;
      const v = point(p);
      if (start(v.x, v.y)) id = p.id;
    });
    this.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.enabled && p.id === id) {
        const v = point(p);
        move(v.x, v.y);
      }
    });
    const up = (p: Phaser.Input.Pointer) => {
      if (p.id !== id) return;
      id = null;
      if (this.enabled) {
        const v = point(p);
        end(v.x, v.y);
      }
    };
    this.on("pointerup", up);
    this.on("pointerupoutside", up);
    const clear = () => {
      id = null;
      cancel();
    };
    this.clearHandlers.push(clear);
    this.scene.game.canvas.addEventListener("touchcancel", clear);
    this.scene.game.canvas.addEventListener("pointercancel", clear);
    this.cleanups.push(() => {
      this.scene.game.canvas.removeEventListener("touchcancel", clear);
      this.scene.game.canvas.removeEventListener("pointercancel", clear);
    });
  }
  /** Opt-in aiming: own a native pointer until release, even outside the canvas. */
  private capturedDrag(
    start: (x: number, y: number) => boolean,
    move: (x: number, y: number) => void,
    end: (x: number, y: number) => void,
    cancel: () => void,
  ) {
    const canvas = this.scene.game.canvas;
    let id: number | null = null;
    const point = (e: PointerEvent) =>
      this.scene.cameras.main.getWorldPoint(
        this.scene.scale.transformX(e.pageX),
        this.scene.scale.transformY(e.pageY),
      );
    const release = () => {
      const previous = id;
      id = null; // lostpointercapture must not cancel a completed shot.
      if (previous !== null && canvas.hasPointerCapture(previous))
        canvas.releasePointerCapture(previous);
    };
    const clear = () => {
      release();
      cancel();
    };
    const down = (e: PointerEvent) => {
      if (!this.enabled || id !== null || e.button !== 0) return;
      const p = point(e);
      if (!start(p.x, p.y)) return;
      id = e.pointerId;
      e.preventDefault();
      try {
        canvas.setPointerCapture(id);
      } catch {
        /* Window listeners remain a fallback. */
      }
    };
    const motion = (e: PointerEvent) => {
      if (!this.enabled || e.pointerId !== id) return;
      e.preventDefault();
      const p = point(e);
      move(p.x, p.y);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      e.preventDefault();
      const p = point(e);
      release();
      if (this.enabled) end(p.x, p.y);
    };
    const interrupted = (e: PointerEvent) => {
      if (e.pointerId === id) clear();
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", motion, {
      capture: true,
      passive: false,
    });
    window.addEventListener("pointerup", up, { capture: true, passive: false });
    window.addEventListener("pointercancel", interrupted, true);
    canvas.addEventListener("lostpointercapture", interrupted);
    window.addEventListener("blur", clear);
    this.clearHandlers.push(clear);
    this.cleanups.push(() => {
      clear();
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", motion, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", interrupted, true);
      canvas.removeEventListener("lostpointercapture", interrupted);
      window.removeEventListener("blur", clear);
    });
  }
  press(codes: string[], callback: (code: string) => void) {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    const seen = new WeakSet<KeyboardEvent>();
    const handler = (event: KeyboardEvent) => {
      if (seen.has(event)) return;
      seen.add(event);
      if (this.enabled && !event.repeat && codes.includes(event.code)) {
        event.preventDefault();
        callback(event.code);
      }
    };
    keyboard.on("keydown", handler);
    this.cleanups.push(() => keyboard.off("keydown", handler));
  }
  keys(codes: string[]) {
    const held = new Set<string>(),
      keyboard = this.scene.input.keyboard;
    if (!keyboard) return held;
    const down = (e: KeyboardEvent) => {
        if (this.enabled && codes.includes(e.code)) {
          e.preventDefault();
          held.add(e.code);
        }
      },
      up = (e: KeyboardEvent) => held.delete(e.code);
    keyboard.on("keydown", down);
    keyboard.on("keyup", up);
    this.cleanups.push(() => {
      keyboard.off("keydown", down);
      keyboard.off("keyup", up);
    });
    this.clearHandlers.push(() => held.clear());
    return held;
  }
  private on(event: string, handler: (...args: any[]) => void) {
    this.scene.input.on(event, handler);
    this.cleanups.push(() => this.scene.input.off(event, handler));
  }
  clear() {
    this.clearHandlers.forEach((fn) => fn());
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
    this.clearHandlers = [];
  }
  get listenerCount() {
    return this.cleanups.length;
  }
}
