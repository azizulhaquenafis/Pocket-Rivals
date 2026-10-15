import type Phaser from "phaser";
/** Rotate only module-owned play content; host navigation stays fixed. */
export class TurnView {
  private root: Phaser.GameObjects.Container;
  private target = false;
  private flipped = false;
  private age = 0;
  constructor(
    scene: Phaser.Scene,
    children: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Text)[],
  ) {
    this.root = scene.add.container(210, 381);
    for (const child of children) {
      child.setPosition(child.x - 210, child.y - 381);
      this.root.add(child);
    }
  }
  set(flipped: boolean) {
    if (flipped !== this.target) {
      this.target = flipped;
      this.age = 0.28;
    }
  }
  update(dt: number) {
    if (this.age <= 0) return;
    this.age = Math.max(0, this.age - dt);
    if (this.age <= 0.14 && this.flipped !== this.target) {
      this.flipped = this.target;
      this.root.setRotation(this.flipped ? Math.PI : 0);
    }
    this.root.setAlpha(1 - 0.22 * Math.sin((Math.PI * this.age) / 0.28));
  }
  get ready() {
    return this.age === 0;
  }
  point(x: number, y: number) {
    return this.flipped ? { x: 420 - x, y: 762 - y } : { x, y };
  }
  get rotation() {
    return this.flipped ? Math.PI : 0;
  }
  destroy() {
    this.root.destroy(true);
  }
}
export const turnBackground = (player: 1 | 2) =>
  player === 1 ? 0xf7e1cc : 0xd9eaf4;
