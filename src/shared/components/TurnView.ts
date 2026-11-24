import { oppositeSideLayout } from "../utilities/DeviceLayout";
import type Phaser from "phaser";
const TURN_DURATION = 0.28;
/** Smoothly rotate module-owned play content; host navigation stays fixed. */
export class TurnView {
  private root: Phaser.GameObjects.Container;
  private target = false;
  private flipped = false;
  private fromAngle = 0;
  private toAngle = 0;
  private visualAngle = 0;
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
    flipped = flipped && oppositeSideLayout();
    if (flipped !== this.target) {
      this.target = flipped;
      this.fromAngle = this.visualAngle;
      this.toAngle = flipped ? Math.PI : 0;
      this.age = TURN_DURATION;
    }
  }
  update(dt: number) {
    if (this.age <= 0) return;
    this.age = Math.max(0, this.age - Math.min(dt, 0.2));
    const progress = 1 - this.age / TURN_DURATION;
    const eased = progress * progress * (3 - 2 * progress);
    this.visualAngle =
      this.fromAngle + (this.toAngle - this.fromAngle) * eased;
    if (this.age <= TURN_DURATION / 2 && this.flipped !== this.target) {
      this.flipped = this.target;
    }
    this.root.setRotation(this.age === 0 ? this.toAngle : this.visualAngle);
    this.root.setAlpha(
      this.age === 0 ? 1 : 1 - 0.1 * Math.sin(Math.PI * progress),
    );
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
