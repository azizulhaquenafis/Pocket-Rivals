import type Phaser from "phaser";
export const BUTTONS = [
  { x: 40, y: 550, w: 74, h: 70, p: 0, d: -1 },
  { x: 122, y: 550, w: 74, h: 70, p: 0, d: 1 },
  { x: 224, y: 550, w: 74, h: 70, p: 1, d: -1 },
  { x: 306, y: 550, w: 74, h: 70, p: 1, d: 1 },
] as const;
export class CarInput {
  private held = new Map<number, { p: 0 | 1; d: number }>();
  private enabled = true;
  constructor(
    private scene: Phaser.Scene,
    private ai: boolean,
  ) {
    scene.input.on("pointerdown", this.down);
    scene.input.on("pointermove", this.move);
    scene.input.on("pointerup", this.up);
    scene.input.on("pointerupoutside", this.up);
    scene.game.canvas.addEventListener("touchcancel", this.clear);
    scene.game.canvas.addEventListener("pointercancel", this.clear);
  }
  private button(p: Phaser.Input.Pointer) {
    const v = this.scene.cameras.main.getWorldPoint(p.x, p.y);
    return BUTTONS.find(
      (b) => v.x >= b.x && v.x <= b.x + b.w && v.y >= b.y && v.y <= b.y + b.h,
    );
  }
  private down = (p: Phaser.Input.Pointer) => {
    const b = this.button(p);
    if (this.enabled && b && !(b.p === 1 && this.ai))
      this.held.set(p.id, { p: b.p, d: b.d });
  };
  private move = (p: Phaser.Input.Pointer) => {
    const owner = this.held.get(p.id);
    if (!owner) return;
    const b = this.button(p);
    owner.d = b?.p === owner.p ? b.d : 0;
  };
  private up = (p: Phaser.Input.Pointer) => {
    this.held.delete(p.id);
  };
  clear = () => {
    this.held.clear();
  };
  value(p: 0 | 1) {
    return Math.max(
      -1,
      Math.min(
        1,
        [...this.held.values()]
          .filter((v) => v.p === p)
          .reduce((s, v) => s + v.d, 0),
      ),
    );
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
    this.scene.input.off("pointerdown", this.down);
    this.scene.input.off("pointermove", this.move);
    this.scene.input.off("pointerup", this.up);
    this.scene.input.off("pointerupoutside", this.up);
    this.scene.game.canvas.removeEventListener("touchcancel", this.clear);
    this.scene.game.canvas.removeEventListener("pointercancel", this.clear);
  }
}
