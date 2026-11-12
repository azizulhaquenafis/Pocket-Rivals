import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import type { Cell, SnakeWorld } from "./SnakeRules";

type Piece = {
  joint: Phaser.GameObjects.Image;
  link: Phaser.GameObjects.Image;
};
/** Retained, single-atlas sprites avoid rebuilding circle geometry every frame. */
export class SnakeView {
  private readonly texture: string;
  private readonly layers: Phaser.GameObjects.Container[];
  private readonly pieces: Piece[][] = [[], []];
  private readonly dots: Phaser.GameObjects.Image[] = [];
  private readonly points: Cell[] = [];
  private readonly head = { x: 0, y: 0 };
  constructor(private scene: Phaser.Scene) {
    this.texture = `snake-body-${scene.sys.settings.key}`;
    const source = scene.make.graphics({ x: 0, y: 0 });
    source.fillStyle(0xffffff).fillCircle(16, 16, 15).fillRect(40, 0, 40, 40);
    source.generateTexture(this.texture, 96, 48);
    source.destroy();
    const atlas = scene.textures.get(this.texture);
    atlas.add("joint", 0, 0, 0, 32, 32);
    atlas.add("link", 0, 42, 2, 36, 36);
    this.layers = [
      scene.add.container(),
      scene.add.container(),
      scene.add.container(),
    ];
  }
  update(w: SnakeWorld) {
    const t = w.dead ? 1 : Math.min(1, w.accumulator / w.interval);
    let count = 0;
    const append = (x: number, y: number) => {
      const p = this.points[count] ?? (this.points[count] = { x: 0, y: 0 });
      p.x = 50 + x * 20;
      p.y = 150 + y * 20;
      count++;
    };
    for (let i = 0; i < w.body.length; i++) {
      const c = w.body[i],
        old = w.previous[i] ?? w.previous.at(-1) ?? c;
      const x = old.x + (c.x - old.x) * t,
        y = old.y + (c.y - old.y) * t;
      // Retain the grid corner rather than cutting diagonally across it.
      if (i) {
        const last = this.points[count - 1];
        if (
          Math.abs(last.x - (50 + x * 20)) > 1e-6 &&
          Math.abs(last.y - (150 + y * 20)) > 1e-6
        ) {
          const corner = w.previous[i - 1] ?? c;
          append(corner.x, corner.y);
        }
      }
      append(x, y);
    }
    for (let layer = 0; layer < 2; layer++) {
      const width = layer ? 14 : 19;
      const tint = layer ? (w.dead ? 0x9ca4a0 : w.map.snake) : theme.ink;
      const pool = this.pieces[layer];
      for (let i = 0; i < count; i++) {
        if (!pool[i]) {
          const link = this.scene.add
            .image(0, 0, this.texture, "link")
            .setOrigin(0, 0.5);
          const joint = this.scene.add.image(0, 0, this.texture, "joint");
          this.layers[layer].add([link, joint]);
          pool[i] = { joint, link };
        }
        const { joint, link } = pool[i],
          p = this.points[i],
          next = this.points[i + 1];
        joint
          .setVisible(true)
          .setPosition(p.x, p.y)
          .setDisplaySize((width * 32) / 30, (width * 32) / 30)
          .setTint(tint);
        link.setVisible(i < count - 1);
        if (i < count - 1)
          link
            .setPosition(p.x, p.y)
            .setRotation(Math.atan2(next.y - p.y, next.x - p.x))
            .setDisplaySize(Math.hypot(next.x - p.x, next.y - p.y), width)
            .setTint(tint);
      }
      for (let i = count; i < pool.length; i++) {
        pool[i].joint.setVisible(false);
        pool[i].link.setVisible(false);
      }
    }
    let dot = 0;
    for (let i = 2; i < w.body.length; i += 2) {
      const c = w.body[i],
        old = w.previous[i] ?? w.previous.at(-1) ?? c;
      if (!this.dots[dot]) {
        this.dots[dot] = this.scene.add
          .image(0, 0, this.texture, "joint")
          .setDisplaySize(6, 6)
          .setAlpha(0.7);
        this.layers[2].add(this.dots[dot]);
      }
      this.dots[dot++]
        .setVisible(true)
        .setPosition(
          50 + (old.x + (c.x - old.x) * t) * 20,
          150 + (old.y + (c.y - old.y) * t) * 20,
        )
        .setTint(w.map.light);
    }
    for (let i = dot; i < this.dots.length; i++) this.dots[i].setVisible(false);
    this.head.x = this.points[0].x;
    this.head.y = this.points[0].y;
    return this.head;
  }
  destroy() {
    this.layers.forEach((layer) => layer.destroy());
    this.scene.textures.remove(this.texture);
  }
}
