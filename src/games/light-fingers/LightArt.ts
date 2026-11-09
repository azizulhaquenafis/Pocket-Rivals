import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
function blend(a: number, b: number, t: number) {
  let result = 0;
  for (const shift of [16, 8, 0])
    result |=
      Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) <<
      shift;
  return result;
}
/** Original glove silhouette, mirrored toward the shared gem. */
export function hand(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  rotation: number,
  color: number,
  reach: number,
  gray = 0,
  grip = 0,
) {
  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(rotation);
  g.translateCanvas(0, -reach);
  const glove = blend(0x414b48, 0x989c9a, gray);
  rounded(g, -19, -2, 38, 85, 10, glove, 4);
  rounded(g, -20, 12, 40, 13, 4, blend(color, 0xadb2ae, gray), 3);
  rounded(g, -29, -51, 58, 61, 17, glove, 4);
  // Four individually outlined fingers and an angled thumb.
  for (let i = 0; i < 4; i++)
    rounded(
      g,
      -29 + i * 15,
      -84 + (i === 0 || i === 3 ? 8 : 0) + grip * 6,
      14,
      48 - grip * 6,
      7,
      glove,
      4,
    );
  g.save();
  g.translateCanvas(-29, -24);
  g.rotateCanvas(-0.7 + grip * 0.3);
  rounded(g, -10, -24, 18, 40, 8, glove, 4);
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
  g.fillTriangle(365, 343, 80, 271, 80, 479);
  rounded(g, 162, 353, 96, 70, 12, 0x8d9a88, 4);
  circle(g, 210, 382, 34, theme.paper, 3);
  if (!active) return;
  gem(g, 210, 380, 1, time);
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
