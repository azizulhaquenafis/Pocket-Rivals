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
          ? 0xf13939
          : active && m.phase !== "recover"
            ? 0xee8d73
            : 0x91aaa7,
        warning ? 0.8 + 0.2 * Math.sin(m.phaseAge * 10) ** 2 : 1,
      ).fillRect(-5, c - SHAFT / 2 - 1, 5, SHAFT + 2);
      if (warning) {
        g.fillStyle(
          0xf13939,
          0.08 + 0.05 * Math.sin(m.phaseAge * 10) ** 2,
        ).fillRect(2, c - SHAFT / 2, 9, SHAFT);
        g.lineStyle(3, 0xff4b45).lineBetween(
          5,
          c - SHAFT / 2,
          5,
          c + SHAFT / 2,
        );
      }
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
      color = i === 0 ? theme.orange : theme.blue,
      shine = i === 0 ? 0xffca94 : 0xa8e0fb,
      blush = i === 0 ? 0xde7342 : 0x3b8dbe;
    const activeRun = p.alive && p.moving && !m.between;
    const phase = m.total * 24 + i * 1.6;
    const stride = activeRun ? Math.sin(phase) * 3.4 : 0;
    const hop = activeRun ? Math.abs(Math.sin(phase)) * 1.4 : 0;
    const liftA = activeRun ? Math.max(0, -Math.cos(phase)) * 2.2 : 0;
    const liftB = activeRun ? Math.max(0, Math.cos(phase)) * 2.2 : 0;
    // Direction vector from SpikeView facing angle (angle=0 is UP, +PI/2 is RIGHT)
    const dirX = Math.sin(p.angle),
      dirY = -Math.cos(p.angle);
    const faceX = dirX >= -0.05 ? 1 : -1;
    const tailWave = p.alive ? Math.sin(m.total * 15 + i) * 2 : 0;

    // Ground contact shadow
    g.fillStyle(theme.ink, 0.16).fillEllipse(p.x + 1.5, p.y + 10.5, 22, 9);

    g.save();
    g.translateCanvas(p.x, p.y - 1.5 - hop);
    // Subtle natural sprint lean in movement direction without flipping upside-down
    g.rotateCanvas(activeRun ? dirX * 0.14 : 0);

    // 1. Fluttering white headband tail trailing behind facing direction
    const tx = -faceX;
    g.fillStyle(0xfffdf5).fillTriangle(
      tx * 8.5,
      -5.5,
      tx * 18.5,
      -8.5 + tailWave,
      tx * 16.5,
      -2.2 + tailWave * 0.7,
    );
    g.lineStyle(2, theme.ink).strokeTriangle(
      tx * 8.5,
      -5.5,
      tx * 18.5,
      -8.5 + tailWave,
      tx * 16.5,
      -2.2 + tailWave * 0.7,
    );

    // 2. Proper animated pumping legs & rounded runner shoes underneath
    g.lineStyle(3.8, theme.ink).lineBetween(
      -3.8,
      6.2,
      -4.6 - stride * faceX,
      10.8 - liftA,
    );
    g.fillStyle(theme.ink).fillEllipse(
      -4.2 - stride * faceX + faceX * 1.2,
      11.4 - liftA,
      6.4,
      4.4,
    );
    g.lineStyle(3.8, theme.ink).lineBetween(
      3.8,
      6.2,
      4.6 + stride * faceX,
      10.8 - liftB,
    );
    g.fillStyle(theme.ink).fillEllipse(
      4.2 + stride * faceX + faceX * 1.2,
      11.4 - liftB,
      6.4,
      4.4,
    );

    // 3. Chubby Gravity-Runner logo bean body sized cleanly for radius-9 gameplay
    const bodyCol = p.alive ? color : 0x9c9b96;
    rounded(g, -9.5, -10.5, 19, 19.5, 8.5, bodyCol, 2.3);
    if (p.alive) {
      g.lineStyle(2.2, shine, 0.9)
        .lineBetween(-faceX * 5.2, -7.8, -faceX * 1, -8.3)
        .lineBetween(-faceX * 5.8, 1.5, -faceX * 5.8, 5);
    }

    // 4. Crisp white ninja headband strapped across the forehead
    rounded(g, -9.5, -6.8, 19, 4.1, 1.7, 0xfffdf5, 1.9);

    // 5. Expressive white-sclera eyes tracking movement direction + cheek blush + smile
    const lookX = dirX * 1.5;
    const lookY = dirY * 0.9;
    const eyeCenter = faceX * 2.2;
    if (p.alive) {
      for (const offset of [-2.8, 2.8]) {
        const ex = eyeCenter + offset;
        const ey = 0.6 + lookY * 0.4;
        g.fillStyle(0xfffdf5).fillEllipse(ex, ey, 4.4, 5);
        g.lineStyle(1.3, theme.ink, 0.85).strokeEllipse(ex, ey, 4.4, 5);
        g.fillStyle(theme.ink).fillCircle(ex + lookX * 0.55, ey + lookY * 0.45, 1.55);
        g.fillStyle(0xfffdf5).fillCircle(
          ex + lookX * 0.55 + 0.5,
          ey + lookY * 0.45 - 0.7,
          0.6,
        );
      }
      g.fillStyle(blush, 0.58).fillEllipse(-faceX * 3.8, 3.6, 3.4, 2);
      g.lineStyle(1.6, theme.ink).beginPath();
      g.arc(eyeCenter, 3.6, 2.2, 0.2, Math.PI - 0.2, false);
      g.strokePath();
    } else {
      g.lineStyle(1.8, theme.ink);
      for (const offset of [-2.8, 2.8]) {
        const ex = eyeCenter + offset;
        g.lineBetween(ex - 1.6, -1, ex + 1.6, 2.2);
        g.lineBetween(ex + 1.6, -1, ex - 1.6, 2.2);
      }
    }

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
