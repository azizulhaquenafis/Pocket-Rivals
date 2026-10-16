import { recoveryPose, recoveryColor } from "./Recovery";
import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { circle } from "../../shared/components/drawing";
import { WIDTH, HEIGHT, RADIUS, rowY } from "./ArenaPhysics";
import type { BirdsMatch } from "./Rules";
import type { BirdView } from "./BirdView";
const scale = 372 / WIDTH,
  ox = 24,
  oy = 113;
function spikes(
  g: Phaser.GameObjects.Graphics,
  side: 0 | 1,
  rows: readonly number[],
  ghost = false,
) {
  const edge = side === 0 ? 0 : WIDTH,
    tip = side === 0 ? 18 : WIDTH - 18;
  for (const row of rows) {
    const y = rowY(row);
    const pts = [
      { x: edge, y: y - 16 },
      { x: tip, y },
      { x: edge, y: y + 16 },
    ];
    if (!ghost) g.fillStyle(0x787088).fillPoints(pts, true);
    g.lineStyle(
      ghost ? 1.5 : 2.2,
      ghost ? 0xe6b966 : theme.ink,
      ghost ? 0.5 : 1,
    ).strokePoints(pts, true);
    if (!ghost)
      g.lineStyle(1, 0xb2a6bf).lineBetween(
        edge + (side === 0 ? 3 : -3),
        y - 10,
        tip + (side === 0 ? -4 : 4),
        y,
      );
  }
}
function star(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  color: number,
  alpha = 1,
  angle = 0,
) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5 + angle,
      size = i % 2 ? r * 0.45 : r;
    return { x: x + Math.cos(a) * size, y: y + Math.sin(a) * size };
  });
  g.fillStyle(color, alpha).fillPoints(points, true);
  g.lineStyle(1.5, theme.ink, alpha).strokePoints(points, true);
}
export function arena(
  g: Phaser.GameObjects.Graphics,
  m: BirdsMatch,
  view: ReturnType<BirdView["sample"]>,
  trails: BirdView["trails"],
) {
  g.fillStyle(0xc8e8ec).fillRect(24, 112, 372, 538);
  g.save();
  g.translateCanvas(ox, oy);
  g.scaleCanvas(scale, scale);
  g.fillGradientStyle(0xdff1f2, 0xdff1f2, 0xbfe1e4, 0xbfe1e4).fillRect(
    0,
    0,
    WIDTH,
    HEIGHT,
  );
  // Airy scenery replaces the nested rectangular frame and striped panels.
  for (const [x, y] of [
    [65, 105],
    [250, 315],
  ]) {
    g.fillStyle(0xffffff, 0.22)
      .fillEllipse(x, y, 62, 17)
      .fillCircle(x - 8, y - 7, 14)
      .fillCircle(x + 10, y - 5, 10);
  }
  for (let x = 0; x < WIDTH; x += 24) {
    const pts = [
      { x, y: 0 },
      { x: (x + Math.min(WIDTH, x + 24)) / 2, y: 16 },
      { x: Math.min(WIDTH, x + 24), y: 0 },
    ];
    g.fillStyle(0x787088).fillPoints(pts, true);
    g.lineStyle(1.5, theme.ink).strokePoints(pts, true);
    const bottom = pts.map((p) => ({ x: p.x, y: HEIGHT - p.y }));
    g.fillStyle(0x787088).fillPoints(bottom, true);
    g.strokePoints(bottom, true);
  }
  for (const side of [0, 1] as const) {
    spikes(g, side, m.walls[side].rows);
    if (m.walls[side].pending)
      spikes(g, side, m.walls[side].pending!.rows, true);
  }
  for (const s of m.stars) {
    const appear = Math.min(1, (m.age - s.born) / 0.18);
    const pulse = 1 + Math.sin(m.age * 3 + s.id) * 0.05;
    g.fillStyle(0xffdc7b, 0.14 * appear).fillCircle(s.x, s.y, 16 * pulse);
    star(
      g,
      s.x,
      s.y,
      10 * pulse * Math.max(0.1, appear),
      0xffd26d,
      appear,
      Math.sin(m.age * 2 + s.id) * 0.1,
    );
  }
  for (const b of m.bursts) {
    const t = b.age / 0.5,
      color = b.player === 0 ? theme.orange : theme.blue;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      star(
        g,
        b.x + Math.cos(a) * (8 + t * 24),
        b.y + Math.sin(a) * (8 + t * 24) - t * 12,
        3 * (1 - t),
        color,
        1 - t,
      );
    }
  }
  for (const i of [0, 1] as const) {
    const p = view[i],
      recovery = recoveryPose(p.recovery),
      tint = p.saturation,
      color = recoveryColor(i === 0 ? theme.orange : theme.blue, tint);
    for (let j = 5; j >= 0; j--) {
      const t = trails[i][j];
      g.fillStyle(color, 0.1 + (5 - j) * 0.035).fillCircle(
        t.x,
        t.y,
        Math.max(1.5, 4 - j * 0.45),
      );
    }
    g.save();
    g.translateCanvas(p.x, p.y);
    g.scaleCanvas(p.face, 1);
    g.rotateCanvas(p.angle);
    g.scaleCanvas(1 - 0.12 * p.bump, 1 + 0.08 * p.bump);
    // Broad, rounded silhouettes echo the original menu illustration.
    g.fillStyle(color).fillTriangle(-11, 1, -23, -4, -18, 9);
    g.lineStyle(2.4, theme.ink).strokeTriangle(-11, 1, -23, -4, -18, 9);
    circle(g, 0, 0, RADIUS, color, 2.6);
    g.fillStyle(0xfff7dc, 0.32).fillEllipse(1, 8, 20, 10);
    g.fillStyle(recoveryColor(0xf6ce78, tint)).fillTriangle(
      14,
      -1,
      25,
      4,
      14,
      8,
    );
    g.lineStyle(2, theme.ink).strokeTriangle(14, -1, 25, 4, 14, 8);
    circle(g, 7, -5, 5.7, 0xfffdf5, 1.4);
    g.fillStyle(theme.ink)
      .fillCircle(8.5, -5, 3)
      .fillStyle(0xffffff)
      .fillCircle(9, -6, 1);
    g.save();
    g.translateCanvas(-5, 4);
    const wing = p.alive ? p.wing : Math.sin(recovery.progress * Math.PI) * 0.2;
    g.rotateCanvas(-0.3 - wing * 1.25);
    g.fillStyle(recoveryColor(0xfff8df, tint)).fillEllipse(-5, 2, 19, 12);
    g.lineStyle(1.7, theme.ink).strokeEllipse(-5, 2, 19, 12);
    g.restore();
    g.restore();
    if (!p.alive) {
      const ring = 21 + Math.sin(recovery.progress * Math.PI) * 4;
      g.lineStyle(1.5, color, 0.35 * (1 - recovery.progress)).strokeCircle(
        p.x,
        p.y,
        ring,
      );
    }
  }
  if (m.between)
    for (let i = 0; i < 3; i++)
      g.fillStyle(
        theme.ink,
        Math.ceil(m.between * 3) > i ? 0.45 : 0.12,
      ).fillCircle(146 + i * 14, 72, 3);
  g.restore();
}
