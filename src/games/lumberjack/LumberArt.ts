import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import type { LumberMatch } from "./Rules";
/** Local coordinates: feet at zero, tree grows upward; blue local view rotates as a whole. */
export function forest(
  g: Phaser.GameObjects.Graphics,
  m: LumberMatch,
  p: 0 | 1,
  flip: boolean,
  scroll: number,
  swing: number,
  side: number,
) {
  const v = m.players[p],
    color = p === 0 ? theme.orange : theme.blue;
  g.save();
  g.translateCanvas(210, p === 0 ? 625 : flip ? 137 : 359);
  if (flip) g.rotateCanvas(Math.PI);
  // Ground and restrained background foliage stay outside control/score areas.
  rounded(g, -166, -2, 332, 16, 7, 0xa6c982, 0);
  rounded(g, -24, -226, 48, 228, 7, 0xb77b50, 3);
  g.fillStyle(0xd79e6a).fillRect(-18, -222, 12, 218);
  for (let j = 0; j < 7; j++) {
    const y = -j * 28 - scroll,
      branch = m.pattern[v.score + j];
    g.lineStyle(2, 0x895c40, 0.6).lineBetween(-18, y - 4, 18, y - 4);
    if (!branch) continue;
    const x = branch * 24,
      tip = branch * 86;
    g.lineStyle(10, theme.ink).lineBetween(x, y - 16, tip, y - 22);
    g.lineStyle(6, 0xb77b50).lineBetween(x, y - 16, tip, y - 22);
    circle(g, tip, y - 20, 10, 0x79aa62, 3);
    circle(g, tip + branch * 12, y - 18, 9, 0x91bc68, 2);
    circle(g, tip - branch * 9, y - 18, 8, 0xa9cf7c, 2);
  }
  // Compact original lumberjack, kept beside the trunk and inside its half.
  g.save();
  g.translateCanvas(side * 66, 3);
  if (side > 0) g.scaleCanvas(-1, 1);
  const alive = v.alive ? color : 0x9ba39a;
  g.lineStyle(5, theme.ink)
    .lineBetween(-9, -14, -11, 0)
    .lineBetween(8, -14, 10, 0);
  rounded(g, -16, -40, 32, 27, 7, alive, 3);
  circle(g, 0, -53, 13, 0xf2c395, 3);
  rounded(g, -16, -67, 33, 12, 4, alive, 3);
  g.fillStyle(theme.ink).fillCircle(6, -54, 2);
  // Beard and hands distinguish the character from a rectangle control.
  g.fillStyle(0x704a36).fillTriangle(-9, -48, 11, -48, 3, -37);
  g.save();
  g.translateCanvas(12, -29);
  g.rotateCanvas(-0.7 + Math.sin(swing * Math.PI) * 1.1);
  g.lineStyle(7, theme.ink).lineBetween(0, 0, 27, -23);
  g.lineStyle(4, 0xe0b77e).lineBetween(0, 0, 27, -23);
  rounded(g, 19, -34, 20, 15, 3, 0xd5e3df, 3);
  g.restore();
  circle(g, 13, -29, 5, 0xf2c395, 2);
  g.restore();
  // Small reserved edge meter, no giant labels over branches.
  const fraction = v.alive ? Math.max(0, 1 - v.idle / m.limit(p)) : 0;
  rounded(g, -160, -195, 8, 156, 4, theme.paper, 2);
  if (fraction > 0)
    rounded(
      g,
      -159,
      -40 - 154 * fraction,
      6,
      154 * fraction,
      3,
      fraction < 0.25 ? theme.orange : 0x79aa62,
      0,
    );
  g.restore();
}
