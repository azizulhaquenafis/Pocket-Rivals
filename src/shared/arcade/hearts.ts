import type Phaser from "phaser";
import { rounded } from "../components/drawing";

function cubic(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const u = 1 - t;
  return (
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3
  );
}

function heartPoints(cx: number, cy: number, s: number) {
  const pts: { x: number; y: number }[] = [];
  const segs: [number, number, number, number, number, number, number, number][] =
    [
      [0, -0.34, -0.18, -0.88, -0.96, -0.78, -0.96, -0.14],
      [-0.96, -0.14, -0.96, 0.32, -0.44, 0.62, 0, 0.92],
      [0, 0.92, 0.44, 0.62, 0.96, 0.32, 0.96, -0.14],
      [0.96, -0.14, 0.96, -0.78, 0.18, -0.88, 0, -0.34],
    ];
  const steps = 7;
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of segs) {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      pts.push({
        x: cx + cubic(x0, x1, x2, x3, t) * s,
        y: cy + cubic(y0, y1, y2, y3, t) * s,
      });
    }
  }
  return pts;
}

/** Crisp Pocket Rivals vector heart (filled coral-red or muted empty slot). */
export function drawHeart(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  filled: boolean,
) {
  const pts = heartPoints(cx, cy, size);
  g.fillStyle(filled ? 0xe56058 : 0xe5dfd0, filled ? 1 : 0.85).fillPoints(
    pts,
    true,
  );
  g.lineStyle(2.2, 0x242b32, filled ? 1 : 0.38).strokePoints(pts, true);
  if (filled) {
    g.fillStyle(0xffc9c4, 0.88).fillCircle(
      cx - size * 0.38,
      cy - size * 0.28,
      size * 0.2,
    );
  }
}

/** Unified bottom-bar vector hearts pill for all lives-based arcade games. */
export function drawHeartsHUD(
  g: Phaser.GameObjects.Graphics,
  lives: number,
  maxLives: number,
  cx = 210,
  cy = 690,
) {
  g.clear();
  const count = Math.max(1, maxLives);
  const gap = 28;
  const pillW = count * gap + 24;
  rounded(g, cx - pillW / 2, cy - 16, pillW, 32, 12, 0xfffdf5, 2);
  const startX = cx - ((count - 1) * gap) / 2;
  for (let i = 0; i < count; i++) {
    drawHeart(g, startX + i * gap, cy, 9.2, i < lives);
  }
}
