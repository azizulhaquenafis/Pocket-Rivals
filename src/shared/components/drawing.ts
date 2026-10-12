import Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
export function rounded(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: number,
  line = 3,
) {
  g.fillStyle(color).fillRoundedRect(x, y, w, h, r);
  if (line) g.lineStyle(line, theme.ink).strokeRoundedRect(x, y, w, h, r);
}
export function circle(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  color: number,
  line = 3,
) {
  g.fillStyle(color).fillCircle(x, y, r);
  if (line) g.lineStyle(line, theme.ink).strokeCircle(x, y, r);
}
export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 20,
  color = "#242b32",
) {
  return scene.add
    .text(x, y, text, {
      fontFamily: "Fredoka, sans-serif",
      fontSize: `${size}px`,
      fontStyle: "600",
      color,
    })
    .setResolution(Math.min(window.devicePixelRatio || 1, 2))
    .setOrigin(0.5);
}
export function symbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  player: 1 | 2,
  size = 22,
  scale = 1,
) {
  const s = size * scale;
  g.lineStyle(11 * scale, theme.ink);
  if (player === 1) {
    g.lineBetween(x - s, y - s, x + s, y + s);
    g.lineBetween(x + s, y - s, x - s, y + s);
    g.lineStyle(6 * scale, theme.orange);
    g.lineBetween(x - s, y - s, x + s, y + s);
    g.lineBetween(x + s, y - s, x - s, y + s);
  } else {
    g.strokeCircle(x, y, s);
    g.lineStyle(6 * scale, theme.blue);
    g.strokeCircle(x, y, s);
  }
}
