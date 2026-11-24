import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import { turnBackground } from "../../shared/components/TurnView";
import { powerLimit, shotFromPull, type PenMatch } from "./PenRules";
import { DESK, type Pen } from "./PenPhysics";
export interface Aim {
  x: number;
  y: number;
  dx: number;
  dy: number;
  offset: number;
  path?: { x: number; y: number }[];
}
export function drawPen(
  g: Phaser.GameObjects.Graphics,
  p: Pen,
  player: number,
  active = false,
) {
  g.save();
  g.translateCanvas(p.x, p.y);
  g.rotateCanvas(p.a);
  const color = player === 0 ? theme.orange : theme.blue;
  if (active)
    g.lineStyle(1.5, color, 0.8).strokeRoundedRect(-46, -15, 92, 28, 14);
  rounded(g, -40, -6, 80, 16, 8, theme.ink, 0);
  rounded(g, -40, -9, 80, 16, 8, color, 2.5);
  rounded(g, -40, -9, 21, 16, 6, theme.paper, 2.5);
  g.lineStyle(2.5, theme.ink)
    .lineBetween(-34, -9, -14, -9)
    .lineBetween(-14, -9, -14, -3);
  g.fillStyle(theme.paper).fillTriangle(34, -7, 42, -1, 34, 5);
  g.lineStyle(2, theme.ink).strokeTriangle(34, -7, 42, -1, 34, 5);
  g.lineStyle(2, theme.white, 0.6).lineBetween(-8, -5, 25, -5);
  g.lineStyle(2, theme.ink, 0.35).lineBetween(-7, 3, 22, 3);
  g.restore();
}
export function drawDesk(
  g: Phaser.GameObjects.Graphics,
  match: PenMatch,
  bodies: Pen[],
  aim: Aim | null,
  roundAge: number,
) {
  g.clear();
  const winner = match.roundWinner;
  const player =
    typeof winner === "number" &&
    match.phase !== "aim" &&
    match.phase !== "moving"
      ? winner
      : match.turn;
  rounded(g, 24, 112, 372, 538, 22, turnBackground(player === 0 ? 1 : 2), 4);
  rounded(g, 40, 188, 340, 416, 16, 0xb9a284, 0);
  rounded(g, 40, 176, 340, 420, 16, 0xf0ddbd, 4);
  // Quiet wood lines and an inset edge: no surrounding wall in the simulation.
  g.lineStyle(1.5, 0xc8ad88, 0.55);
  for (let y = 224; y < 570; y += 69) g.lineBetween(53, y, 367, y);
  g.lineStyle(1, theme.white, 0.4).strokeRoundedRect(48, 185, 324, 402, 11);
  const { left, right, top, bottom } = match.desk;
  if (left > DESK.left) {
    g.fillStyle(0xaf5535, 0.17)
      .fillRect(DESK.left, DESK.top, left - DESK.left, DESK.bottom - DESK.top)
      .fillRect(right, DESK.top, DESK.right - right, DESK.bottom - DESK.top)
      .fillRect(left, DESK.top, right - left, top - DESK.top)
      .fillRect(left, bottom, right - left, DESK.bottom - bottom);
    g.lineStyle(2, 0x85513c).strokeRect(left, top, right - left, bottom - top);
  }
  const shrink = match.nextShrink;
  if (
    shrink &&
    shrink.inFlicks <= 2 &&
    (match.phase === "aim" || match.phase === "moving")
  ) {
    const next = shrink.desk;
    g.lineStyle(2, 0xb35836, 0.48).strokeRect(
      next.left,
      next.top,
      next.right - next.left,
      next.bottom - next.top,
    );
  }
  for (const p of bodies) {
    if (!p.out) continue;
    g.fillStyle(theme.ink, 0.12).fillEllipse(
      Math.max(45, Math.min(375, p.x)),
      Math.max(180, Math.min(598, p.y)),
      58,
      12,
    );
  }
  for (let i = 0; i < 2; i++) {
    const p = bodies[i];
    if (p.out) {
      const t = Math.min(1, roundAge / 0.65);
      g.save();
      g.translateCanvas(p.x, p.y);
      g.scaleCanvas(1 - t * 0.5, 1 - t * 0.5);
      if (t < 1) drawPen(g, { ...p, x: 0, y: t * 26 }, i);
      g.restore();
    } else {
      drawPen(g, p, i, match.phase === "aim" && match.turn === i);
    }
  }
  if (aim) {
    circle(g, aim.x, aim.y, 5, theme.white, 2);
    const shot = shotFromPull(aim.dx, aim.dy, aim.offset);
    if (!shot) return;
    const color = match.turn === 0 ? theme.orange : theme.blue;
    const power = Math.min(shot.power, powerLimit(match.shots));
    for (const point of aim.path ?? [])
      circle(g, point.x, point.y, 2.5, theme.white, 1.2);
    rounded(g, 158, 613, 104, 9, 4, theme.white, 1.5);
    g.fillStyle(color).fillRoundedRect(160, 615, 100 * power, 5, 2);
    const limit = powerLimit(match.shots);
    if (limit < 1) {
      const x = 160 + 100 * limit;
      g.lineStyle(1.5, theme.ink).lineBetween(x, 614, x, 621);
    }
  }
}
