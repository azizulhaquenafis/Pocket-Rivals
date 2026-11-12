import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import { SnakeView } from "./SnakeView";
import type { SnakeWorld } from "./SnakeRules";
export function garden(g: Phaser.GameObjects.Graphics, w: SnakeWorld) {
  g.clear();
  rounded(g, 24, 112, 372, 538, 20, w.map.background, 4);
  rounded(g, 38, 138, 344, 404, 10, w.map.floor, 3);
  g.fillStyle(theme.ink, 0.08);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 17; x++) g.fillCircle(50 + x * 20, 150 + y * 20, 1);
  for (const c of w.map.blocks) {
    const x = 50 + c.x * 20,
      y = 150 + c.y * 20;
    rounded(g, x - 9, y - 8, 18, 18, 4, w.map.wall, 2);
    g.lineStyle(2, 0xffffff, 0.35).lineBetween(x - 5, y - 4, x + 3, y - 4);
  }
  for (const [x, y] of [
    [210, 574],
    [152, 620],
    [210, 620],
    [268, 620],
  ])
    rounded(g, x - 24, y - 22, 48, 44, 12, theme.white, 2);
}
export function snake(
  g: Phaser.GameObjects.Graphics,
  w: SnakeWorld,
  age: number,
  view: SnakeView,
) {
  g.clear();
  const head = view.update(w),
    v = w.direction === "up" || w.direction === "down",
    sign = w.direction === "up" || w.direction === "left" ? -1 : 1;
  for (const side of [-1, 1]) {
    const x = head.x + (v ? side * 4 : sign * 4),
      y = head.y + (v ? sign * 4 : side * 4);
    circle(g, x, y, 3.3, 0xfffdf5, 1);
    g.fillStyle(theme.ink).fillCircle(
      x + (v ? 0 : sign),
      y + (v ? sign : 0),
      1.5,
    );
  }
  if (w.food) {
    const x = 50 + w.food.x * 20,
      y = 150 + w.food.y * 20;
    circle(g, x, y, 6.5, 0xf49b58, 2);
    g.fillStyle(0xffffff, 0.45).fillCircle(x - 2, y - 2, 2);
    g.lineStyle(2, theme.ink).lineBetween(x, y - 6, x + 2, y - 10);
    g.fillStyle(0x528d69).fillEllipse(x + 4, y - 9, 6, 3);
  }
  if (w.bonus) {
    const x = 50 + w.bonus.x * 20,
      y = 150 + w.bonus.y * 20,
      r = 7 + Math.sin(age * 5) * 0.5;
    circle(g, x, y, r, 0xf4cc60, 2);
    g.lineStyle(2, 0xb47d2a)
      .beginPath()
      .arc(
        x,
        y,
        10,
        -Math.PI / 2,
        -Math.PI / 2 + (Math.PI * 2 * w.bonusMoves) / w.bonusLifetime,
        false,
      )
      .strokePath();
    g.fillStyle(0xfff7ce).fillTriangle(x, y - 4, x - 3, y + 2, x + 3, y + 2);
  }
}
