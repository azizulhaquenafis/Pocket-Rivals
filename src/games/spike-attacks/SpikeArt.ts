import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import { laneCenter, SIZE, SHAFT } from "./ArenaPhysics";
import type { SpikeMatch } from "./Rules";
import type { SpikeView } from "./SpikeView";
export const BOARD = { x: 62, y: 226, scale: 296 / SIZE };
export const JOYS = [
  { x: 210, y: 595 },
  { x: 210, y: 158 },
];
export type Stick = { x: number; y: number; active: boolean };
function edge(g: Phaser.GameObjects.Graphics, side: number) {
  if (side === 1) {
    g.translateCanvas(SIZE, 0);
    g.scaleCanvas(-1, 1);
  } else if (side === 2) {
    g.rotateCanvas(Math.PI / 2);
    g.scaleCanvas(1, -1);
  } else if (side === 3) {
    g.translateCanvas(0, SIZE);
    g.rotateCanvas(-Math.PI / 2);
  }
}
export function drawArena(
  g: Phaser.GameObjects.Graphics,
  m: SpikeMatch,
  v: ReturnType<SpikeView["sample"]>,
  sticks: Stick[],
  solo = false,
) {
  rounded(g, 24, 112, 372, 538, 20, 0xd2dfe3, 4);
  for (let i = 0; i < 7; i++)
    g.fillStyle(0xffffff, 0.12).fillCircle(45 + i * 53, 378 + (i % 2) * 45, 25);
  g.save();
  g.translateCanvas(BOARD.x, BOARD.y);
  g.scaleCanvas(BOARD.scale, BOARD.scale);
  rounded(g, -9, -9, 338, 338, 10, 0x39434b, 3);
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      g.fillStyle(m.map.floor[(x + y) % 2]).fillRect(x * 80, y * 80, 80, 80);
      g.lineStyle(1.4, 0xffe4bd, 0.4).strokeRect(
        x * 80 + 4,
        y * 80 + 4,
        72,
        72,
      );
    }
  // Recesses stay fixed; shafts travel on one axis and return to exactly that recess.
  for (let side = 0; side < 4; side++) {
    g.save();
    edge(g, side);
    const active = side === m.direction;
    for (let lane = 0; lane < 4; lane++) {
      const c = laneCenter(lane),
        len = active ? v.lengths[lane] : 0;
      rounded(g, -37, c - SHAFT / 2 - 3, 39, SHAFT + 6, 4, 0x56636a, 2);
      g.fillStyle(0x303d45).fillRect(-32, c - SHAFT / 2, 32, SHAFT);
      const warning = active && m.phase === "warning" && !m.between;
      g.fillStyle(
        warning
          ? 0xf4b55f
          : active && m.phase !== "recover"
            ? 0xee8d73
            : 0x91aaa7,
        warning ? 0.65 + 0.35 * Math.sin(m.phaseAge * 10) ** 2 : 1,
      ).fillRect(-5, c - SHAFT / 2 - 1, 5, SHAFT + 2);
      g.fillStyle(0x242b32, 0.15).fillRect(
        -32,
        c - SHAFT / 2 + 5,
        Math.max(24, len + 32),
        SHAFT,
      );
      const base = len - 14;
      rounded(
        g,
        -32,
        c - SHAFT / 2,
        Math.max(2, base + 32),
        SHAFT,
        3,
        0xb58256,
        2.5,
      );
      g.fillStyle(0xd6a270).fillRect(
        -29,
        c - SHAFT / 2 + 4,
        Math.max(0, base + 28),
        8,
      );
      g.fillStyle(0x93633e, 0.35).fillRect(
        -29,
        c + SHAFT / 2 - 12,
        Math.max(0, base + 28),
        7,
      );
      g.lineStyle(2, theme.ink).lineBetween(
        base,
        c - SHAFT / 2,
        base,
        c + SHAFT / 2,
      );
      const pts = [
        { x: base, y: c - SHAFT / 2 },
        { x: len, y: c },
        { x: base, y: c + SHAFT / 2 },
      ];
      g.fillStyle(0xeaf1eb).fillPoints(pts, true);
      g.lineStyle(2.5, theme.ink).strokePoints(pts, true);
      g.lineStyle(1.5, 0xb7c8cc).lineBetween(
        base + 2,
        c - SHAFT / 2 + 6,
        len - 3,
        c,
      );
    }
    g.restore();
  }
  for (const b of m.map.blocks) {
    rounded(g, b.x + 2, b.y + 5, b.w, b.h, 7, 0x664f6b, 2);
    rounded(g, b.x, b.y, b.w, b.h, 7, 0x93809c, 3);
    g.lineStyle(2, 0xc2b1c5, 0.7).lineBetween(
      b.x + 8,
      b.y + 6,
      b.x + b.w - 8,
      b.y + 6,
    );
  }
  for (const i of [0, 1] as const) {
    const p = v.players[i],
      color = i === 0 ? theme.orange : theme.blue;
    g.fillStyle(theme.ink, 0.15).fillEllipse(p.x + 2, p.y + 5, 25, 17);
    g.save();
    g.translateCanvas(p.x, p.y);
    g.rotateCanvas(p.angle);
    const stride = p.moving && !m.between ? Math.sin(m.total * 25) * 2 : 0;
    rounded(g, -10, -3 + stride, 5, 9, 2, color, 1.5);
    rounded(g, 5, -3 - stride, 5, 9, 2, color, 1.5);
    circle(g, 0, 0, 9, p.alive ? color : 0x9c9b96, 2.2);
    rounded(g, -6, -7, 12, 7, 3, 0xf6f1df, 1.4);
    g.fillStyle(theme.ink).fillCircle(-2, -4, 1.4).fillCircle(2, -4, 1.4);
    g.restore();
    if (!p.alive) {
      g.lineStyle(2.5, color, 0.8).strokeCircle(
        p.x,
        p.y,
        15 + (1.15 - m.between) * 12,
      );
    }
  }
  g.restore();
  for (const i of [0, 1] as const) {
    if (i === 1 && solo) continue;
    const joy = JOYS[i],
      stick = sticks[i],
      color = i === 0 ? theme.orange : theme.blue;
    circle(g, joy.x, joy.y + 3, 31, 0xa9b9ba, 0);
    circle(g, joy.x, joy.y, 31, 0xf5f2e7, 2.5);
    g.lineStyle(2, color, 0.4).strokeCircle(joy.x, joy.y, 24);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      g.fillStyle(theme.ink, 0.28).fillCircle(
        joy.x + Math.cos(a) * 24,
        joy.y + Math.sin(a) * 24,
        1.8,
      );
    }
    circle(g, joy.x + stick.x * 16, joy.y + stick.y * 16, 16, color, 2.5);
    g.fillStyle(theme.white, 0.3).fillEllipse(
      joy.x + stick.x * 16 - 3,
      joy.y + stick.y * 16 - 5,
      10,
      5,
    );
  }
}
