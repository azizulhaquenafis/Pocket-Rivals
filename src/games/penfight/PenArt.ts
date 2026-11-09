import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import { turnBackground } from "../../shared/components/TurnView";
import type { PenMatch } from "./PenRules";
import type { Pen } from "./PenPhysics";
export interface Aim {
  x: number;
  y: number;
  dx: number;
  dy: number;
  offset: number;
}
export function drawPen(
  g: Phaser.GameObjects.Graphics,
  p: Pen,
  player: number,
) {
  g.save();
  g.translateCanvas(p.x, p.y);
  g.rotateCanvas(p.a);
  const color = player === 0 ? theme.orange : theme.blue;
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
      if (match.phase === "aim" && match.turn === i) {
        g.lineStyle(2, i === 0 ? theme.orange : theme.blue, 0.8).strokeCircle(
          p.x,
          p.y,
          49,
        );
        circle(g, p.x, p.y + 30, 3, i === 0 ? theme.orange : theme.blue, 0);
      }
      drawPen(g, p, i);
    }
  }
  if (aim) {
    const length = Math.hypot(aim.dx, aim.dy),
      power = Math.min(1, length / 118),
      angle = Math.atan2(aim.dy, aim.dx);
    const endX = aim.x + Math.cos(angle) * (22 + power * 82),
      endY = aim.y + Math.sin(angle) * (22 + power * 82);
    g.lineStyle(4, theme.ink, 0.18).lineBetween(aim.x, aim.y, endX, endY);
    g.lineStyle(3, theme.white).lineBetween(aim.x, aim.y, endX, endY);
    g.lineStyle(3, theme.ink)
      .lineBetween(
        endX,
        endY,
        endX - Math.cos(angle - 0.55) * 10,
        endY - Math.sin(angle - 0.55) * 10,
      )
      .lineBetween(
        endX,
        endY,
        endX - Math.cos(angle + 0.55) * 10,
        endY - Math.sin(angle + 0.55) * 10,
      );
    circle(g, aim.x, aim.y, 5, theme.white, 2);
    rounded(g, 158, 615, 104, 8, 4, theme.white, 1.5);
    if (power > 0.01)
      g.fillStyle(match.turn === 0 ? theme.orange : theme.blue).fillRoundedRect(
        160,
        617,
        100 * power,
        4,
        2,
      );
  }
}
