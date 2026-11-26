import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import { SnakeView } from "./SnakeView";
import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ORIGIN_X,
  GRID_ORIGIN_Y,
  GRID_ROWS,
  type SnakeWorld,
} from "./SnakeRules";
export function garden(g: Phaser.GameObjects.Graphics, w: SnakeWorld) {
  g.clear();
  rounded(g, 24, 112, 372, 538, 20, w.map.background, 4);
  rounded(g, 38, 129, 344, 504, 12, w.map.floor, 3);
  g.fillStyle(theme.ink, 0.08);
  for (let y = 0; y < GRID_ROWS; y++)
    for (let x = 0; x < GRID_COLS; x++)
      g.fillCircle(
        GRID_ORIGIN_X + x * CELL_SIZE,
        GRID_ORIGIN_Y + y * CELL_SIZE,
        1,
      );
  for (const c of w.map.blocks) {
    const x = GRID_ORIGIN_X + c.x * CELL_SIZE,
      y = GRID_ORIGIN_Y + c.y * CELL_SIZE;
    rounded(g, x - 9, y - 8, 18, 18, 4, w.map.wall, 2);
    g.lineStyle(2, 0xffffff, 0.35).lineBetween(x - 5, y - 4, x + 3, y - 4);
  }
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
    const x = GRID_ORIGIN_X + w.food.x * CELL_SIZE,
      y = GRID_ORIGIN_Y + w.food.y * CELL_SIZE;
    circle(g, x, y, 6.5, 0xf49b58, 2);
    g.fillStyle(0xffffff, 0.45).fillCircle(x - 2, y - 2, 2);
    g.lineStyle(2, theme.ink).lineBetween(x, y - 6, x + 2, y - 10);
    g.fillStyle(0x528d69).fillEllipse(x + 4, y - 9, 6, 3);
  }
  if (w.bonus) {
    const x = GRID_ORIGIN_X + w.bonus.x * CELL_SIZE,
      y = GRID_ORIGIN_Y + w.bonus.y * CELL_SIZE,
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
