import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
/** Original glove silhouette, mirrored toward the shared gem. */
export function hand(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  rotation: number,
  color: number,
  reach: number,
) {
  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(rotation);
  g.translateCanvas(0, -reach);
  rounded(g, -19, -2, 38, 91, 10, 0x414b48, 4);
  rounded(g, -20, 12, 40, 13, 4, color, 3);
  rounded(g, -29, -51, 58, 61, 17, 0x414b48, 4);
  // Four individually outlined fingers and an angled thumb.
  for (let i = 0; i < 4; i++)
    rounded(
      g,
      -29 + i * 15,
      -84 + (i === 0 || i === 3 ? 8 : 0),
      14,
      48,
      7,
      0x414b48,
      4,
    );
  g.save();
  g.translateCanvas(-29, -24);
  g.rotateCanvas(-0.7);
  rounded(g, -10, -24, 18, 40, 8, 0x414b48, 4);
  g.restore();
  g.lineStyle(2, 0x81918b, 0.65).lineBetween(-17, -35, 17, -35);
  g.restore();
}
export function pedestal(
  g: Phaser.GameObjects.Graphics,
  active: boolean,
  time: number,
) {
  // Soft spotlight, compact plinth and a faceted original gemstone.
  g.fillStyle(active ? 0xfff0b3 : 0xffffff, active ? 0.25 : 0.08);
  g.fillTriangle(365, 327, 80, 255, 80, 463);
  rounded(g, 162, 337, 96, 70, 12, 0x8d9a88, 4);
  circle(g, 210, 366, 34, theme.paper, 3);
  if (!active) return;
  gem(g, 210, 364, 1, time);
}
export function gem(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
  time = 0,
) {
  g.save();
  g.translateCanvas(x, y);
  g.scaleCanvas(scale, scale);
  const bob = Math.sin(time * 5) * 2;
  const pts = [
    { x: 0, y: -27 + bob },
    { x: 27, y: -1 + bob },
    { x: 0, y: 27 + bob },
    { x: -27, y: -1 + bob },
  ];
  g.fillStyle(theme.blue).fillPoints(pts, true);
  g.lineStyle(4, theme.ink).strokePoints(pts, true);
  g.fillStyle(0xa9e6ee).fillTriangle(0, -20 + bob, 0, 16 + bob, -19, -1 + bob);
  g.restore();
}
