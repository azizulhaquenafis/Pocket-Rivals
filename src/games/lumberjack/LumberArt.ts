import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import { STUN_SECONDS, type LumberMatch } from "./Rules";
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
    color = p === 0 ? theme.orange : theme.blue,
    stunned = v.stun > 0;
  g.save();
  // Keep both grass strips and trunks cleanly inside their respective sky panels.
  g.translateCanvas(210, p === 0 ? 627 : flip ? 136 : 352);
  if (flip) g.rotateCanvas(Math.PI);
  // Ground and restrained background foliage stay outside control/score areas.
  rounded(g, -166, -2, 332, 14, 7, 0xa6c982, 0);
  rounded(g, -24, -226, 48, 228, 7, 0xb77b50, 3);
  g.fillStyle(0xd79e6a).fillRect(-18, -222, 12, 218);
  // World-anchored bark grain and knots scroll continuously with every chop.
  g.fillStyle(0x805339, 0.3).fillRect(15, -221, 7, 218);
  for (let j = 0; j < 8; j++) {
    const seg = v.index + j,
      y = -36 - j * 28 - scroll;
    if (y - 24 < -226) continue;
    const gx = -10 + ((seg * 7) % 3) * 8;
    g.lineStyle(1.5, 0x754b32, 0.45).lineBetween(gx, y - 20, gx - 2, y - 6);
    if (seg % 5 === 2 && y - 16 > -220)
      g.lineStyle(1.5, 0x754b32, 0.6).strokeEllipse(4, y - 14, 10, 16);
    g.lineStyle(2, 0x895c40, 0.6).lineBetween(-18, y - 4, 18, y - 4);
    const branch = m.pattern[seg];
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
  const shake =
    stunned && v.stun > STUN_SECONDS - 0.35
      ? Math.sin(m.time * 58) * 3.5 * ((v.stun - (STUN_SECONDS - 0.35)) / 0.35)
      : 0;
  g.save();
  g.translateCanvas(side * 66 + shake, 3);
  if (side > 0) g.scaleCanvas(-1, 1);
  const alive = v.alive && !stunned ? color : 0x9ba39a;
  g.lineStyle(5, theme.ink)
    .lineBetween(-9, -14, -11, 0)
    .lineBetween(8, -14, 10, 0);
  rounded(g, -16, -40, 32, 27, 7, alive, 3);
  // Trousers, boots and a checked work shirt, all inside the character lane.
  rounded(g, -14, -16, 12, 13, 2, 0x466079, 2);
  rounded(g, 3, -16, 12, 13, 2, 0x466079, 2);
  rounded(g, -16, -5, 16, 7, 2, 0x614737, 2);
  rounded(g, 2, -5, 17, 7, 2, 0x614737, 2);
  g.lineStyle(2, theme.ink, 0.28)
    .lineBetween(-11, -38, -11, -17)
    .lineBetween(2, -38, 2, -17)
    .lineBetween(-13, -31, 13, -31)
    .lineBetween(-13, -23, 13, -23);
  circle(g, 0, -53, 13, 0xf2c395, 3);
  rounded(g, -16, -67, 33, 12, 4, alive, 3);
  if (stunned) {
    g.lineStyle(2, theme.ink)
      .lineBetween(3.5, -56.5, 8.5, -51.5)
      .lineBetween(8.5, -56.5, 3.5, -51.5);
  } else {
    g.fillStyle(theme.ink).fillCircle(6, -54, 2);
  }
  // Beard and hands distinguish the character from a rectangle control.
  g.fillStyle(0x704a36).fillTriangle(-9, -48, 11, -48, 3, -37);
  g.save();
  g.translateCanvas(12, -29);
  g.rotateCanvas(
    stunned ? 0.35 : -0.7 + Math.sin(swing * Math.PI) * 1.1,
  );
  g.lineStyle(7, theme.ink).lineBetween(0, 0, 27, -23);
  g.lineStyle(4, 0xe0b77e).lineBetween(0, 0, 27, -23);
  rounded(g, 19, -34, 20, 15, 3, 0xd5e3df, 3);
  g.restore();
  circle(g, 13, -29, 5, 0xf2c395, 2);
  if (swing > 0 && v.alive && !stunned) {
    const t = 1 - swing;
    for (let i = 0; i < 3; i++) {
      const x = 39 - t * (12 + i * 8),
        y = -27 - Math.sin(t * Math.PI) * (13 + i * 5);
      g.fillStyle(0xdba778, swing).fillTriangle(
        x,
        y,
        x + 5,
        y - 2,
        x + 3,
        y + 3,
      );
    }
  }
  if (stunned) {
    // Orbiting dizzy stars above the stunned lumberjack's hat.
    for (let i = 0; i < 3; i++) {
      const a = m.time * 5.8 + (i * Math.PI * 2) / 3,
        sx = Math.cos(a) * 18,
        sy = -77 + Math.sin(a) * 5;
      circle(g, sx, sy, 3.6, 0xf6cc65, 1.8);
    }
  }
  g.restore();
  if (stunned) {
    // Keep the 3s recovery ring in the clear outer sky corner, away from branches.
    const ratio = Math.max(0, Math.min(1, v.stun / STUN_SECONDS)),
      rx = side * 144,
      ry = -196,
      r = 14;
    circle(g, rx, ry, r, theme.paper, 2.5);
    g.lineStyle(4.5, color)
      .beginPath()
      .arc(rx, ry, r - 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio)
      .strokePath();
  }
  g.restore();
}
