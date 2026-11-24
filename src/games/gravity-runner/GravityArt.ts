import { drawTrap } from "./TrapArt";
import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import { rounded, circle } from "../../shared/components/drawing";
import type { RunnerMap } from "./Maps";
import type { GravityMatch } from "./Rules";
const left = 84,
  right = 336,
  scale = (right - left) / 170;
const trackY = (x: number, distance: number) => 548 - (x - distance) * 1.05;
function wall(
  g: Phaser.GameObjects.Graphics,
  side: -1 | 1,
  top: number,
  bottom: number,
  distance: number,
  map: RunnerMap,
) {
  if (bottom <= top) return;
  const x = side === -1 ? 24 : right,
    edge = side === -1 ? left : right;
  g.fillStyle(map.wall).fillRect(x, top, 60, bottom - top);
  g.fillStyle(map.highlight).fillRect(
    x + (side === -1 ? 6 : 18),
    top,
    22,
    bottom - top,
  );
  g.lineStyle(3, theme.ink)
    .lineBetween(edge, top, edge, bottom)
    .lineBetween(x, top, x + 60, top)
    .lineBetween(x, bottom, x + 60, bottom);
  g.fillStyle(map.edge).fillRect(
    side === -1 ? edge - 10 : edge,
    top,
    10,
    bottom - top,
  );
  // Texture positions belong to the world, never to a clipped segment edge.
  const phase = (548 + distance * 1.05) % 13;
  for (
    let y = Math.ceil((top + 3 - phase) / 13) * 13 + phase;
    y < bottom - 3;
    y += 13
  )
    g.fillStyle(map.detail).fillEllipse(
      side === -1 ? edge - 5 : edge + 5,
      y,
      5,
      8,
    );
  g.lineStyle(1, map.detail, 0.35);
  const soil = (548 + distance * 1.05) % 39;
  for (let y = Math.ceil((top - soil) / 39) * 39 + soil; y < bottom; y += 39)
    g.lineBetween(x + 8, y, x + 48, y);
}
export function course(
  g: Phaser.GameObjects.Graphics,
  m: GravityMatch,
  distance = m.distance,
  age = m.age,
) {
  const map = m.map;
  rounded(g, 24, 112, 372, 538, 20, map.sky, 4);
  g.fillGradientStyle(map.sky, map.sky, map.haze, map.haze).fillRect(
    24,
    112,
    372,
    538,
  );
  for (let i = 0; i < 3; i++) {
    const y = 170 + ((i * 195 + distance * 0.09) % 580) - 80;
    g.fillStyle(map.haze, 0.32).fillEllipse(i % 2 ? 330 : 80, y, 260, 140);
    g.fillStyle(0xffffff, 0.65)
      .fillEllipse(i % 2 ? 160 : 270, y + 50, 46, 12)
      .fillCircle(i % 2 ? 151 : 260, y + 46, 9);
  }
  // Distinct quiet scenery in each landscape, all anchored to the scrolling world.
  for (let i = 0; i < 9; i++) {
    const x = 106 + ((i * 71) % 208),
      y = 115 + ((i * 83 + distance * 0.18) % 540);
    g.lineStyle(1.5, map.detail, 0.45);
    if (map.id === "ice") {
      g.lineBetween(x - 4, y, x + 4, y)
        .lineBetween(x, y - 4, x, y + 4)
        .lineBetween(x - 3, y - 3, x + 3, y + 3);
    } else if (map.id === "blue") g.strokeCircle(x, y, 3 + (i % 3));
    else if (map.id === "purple") {
      g.lineBetween(x - 3, y, x + 3, y).lineBetween(x, y - 3, x, y + 3);
    } else g.fillStyle(map.detail, 0.45).fillEllipse(x, y, 4, 8);
  }
  for (const side of [-1, 1] as const) {
    let edge = 116;
    for (let i = m.gaps.length - 1; i >= 0; i--) {
      const gap = m.gaps[i];
      if (gap.side !== side) continue;
      const a = Math.max(116, trackY(gap.x + gap.width, distance)),
        b = Math.min(646, trackY(gap.x, distance));
      if (b <= 116 || a >= 646) continue;
      wall(g, side, edge, a, distance, map);
      g.fillStyle(map.haze, 0.45).fillRect(
        side === -1 ? 27 : 339,
        a,
        54,
        Math.max(0, b - a),
      );
      edge = Math.max(edge, b);
    }
    wall(g, side, edge, 646, distance, map);
  }
  for (const o of m.obstacles) {
    const top = trackY(o.x + o.width, distance),
      bottom = trackY(o.x, distance);
    if (bottom < 112 || top > 650) continue;
    if (
      o.kind !== "platform" &&
      !["ledge", "spikes", "beam", "bridge"].includes(o.kind)
    ) {
      drawTrap(g, o, map, distance, age);
      continue;
    }
    const x =
        o.side === -1
          ? left
          : o.side === 1
            ? right - o.depth * scale
            : 210 - (o.depth * scale) / 2,
      w = o.depth * scale;
    const color =
      o.kind === "platform"
        ? map.rail
        : o.kind === "bridge"
          ? 0xb49a7c
          : o.kind === "beam"
            ? 0x8296a3
            : o.kind === "spikes"
              ? 0xd58a80
              : 0xb98265;
    g.fillStyle(color).fillRect(x, top, w, bottom - top);
    g.lineStyle(3, theme.ink).strokeRect(x, top, w, bottom - top);
    if (o.kind === "platform") {
      g.fillStyle(map.edge)
        .fillRect(x + 2, top + 2, 4, bottom - top - 4)
        .fillRect(x + w - 6, top + 2, 4, bottom - top - 4);
      // Rungs are world anchored, so the rail scrolls without texture jitter.
      const start = Math.ceil(o.x / 36) * 36;
      for (let d = start; d < o.x + o.width; d += 36) {
        const y = trackY(d, distance);
        if (y < 114 || y > 648) continue;
        g.lineStyle(2, map.detail, 0.65).lineBetween(x + 8, y, x + w - 8, y);
      }
    } else if (o.kind === "ledge") {
      g.fillStyle(0xa7c87f).fillRect(
        o.side === -1 ? x + w - 9 : x,
        top + 2,
        8,
        bottom - top - 4,
      );
    } else if (o.kind === "spikes") {
      for (let y = top + 3; y < bottom - 10; y += 14) {
        g.fillStyle(0xffd7a1).fillTriangle(
          x + 4,
          y,
          x + w - 4,
          y + 7,
          x + 4,
          y + 12,
        );
      }
    } else if (o.kind === "bridge") {
      g.lineStyle(2, 0x795f4a);
      for (let y = top + 7; y < bottom - 3; y += 10)
        g.lineBetween(x + 3, y, x + w - 3, y);
      g.lineStyle(2, 0xf1dbc2).lineBetween(x + 4, top + 2, x + 4, bottom - 2);
      g.lineStyle(2, theme.ink).strokePoints(
        [
          { x: x + w * 0.3, y: (top + bottom) / 2 - 6 },
          { x: x + w * 0.6, y: (top + bottom) / 2 },
          { x: x + w * 0.4, y: (top + bottom) / 2 + 6 },
        ],
        false,
      );
    } else {
      g.lineStyle(3, 0xb9d1d6).lineBetween(
        x + 5,
        top + 5,
        x + w - 5,
        bottom - 5,
      );
      circle(g, x + w / 2, top + 7, 2, theme.ink, 0);
      circle(g, x + w / 2, bottom - 7, 2, theme.ink, 0);
    }
  }
  g.lineStyle(4, theme.ink).strokeRoundedRect(24, 112, 372, 538, 20);
}
export function runners(
  g: Phaser.GameObjects.Graphics,
  m: GravityMatch,
  view?: {
    age: number;
    players: { y: number; vy: number; angle: number; landing: number }[];
  },
) {
  const age = view?.age ?? m.age;
  for (const i of [0, 1] as const) {
    const p = m.players[i],
      pose = view?.players[i],
      py = pose?.y ?? p.y,
      pvy = pose?.vy ?? p.vy,
      color = i === 0 ? theme.orange : theme.blue,
      shine = i === 0 ? 0xffca94 : 0xa8e0fb,
      blush = i === 0 ? 0xde7342 : 0x3b8dbe;
    const x = left + Math.max(-22, Math.min(192, py)) * scale,
      y = 548 + (i === 0 ? 12 : -12);
    if (p.alive)
      for (let j = 3; j >= 1; j--)
        g.fillStyle(color, 0.16 / j).fillCircle(
          x - pvy * j * 0.012,
          y + j * 9,
          Math.max(1.2, 3.2 - j * 0.45),
        );
    g.save();
    g.translateCanvas(x, y);
    const angle =
      pose?.angle ?? (p.gravity === 1 ? -Math.PI / 2 : Math.PI / 2);
    g.rotateCanvas(angle);
    // Keep the runner always facing forward UP the track on both walls!
    const facing = Math.sin(angle) <= 0 ? 1 : -1;
    const squash = pose?.landing ?? 0;
    g.scaleCanvas(
      facing * (1 + 0.08 * squash),
      1 - 0.1 * squash,
    );
    const grounded = Math.exp(-Math.abs(pvy) / 95);
    const phase = age * 21 + i * 1.4;
    const stride = p.alive ? Math.sin(phase) * 4.2 * grounded : 0;
    const liftA = p.alive ? Math.max(0, -Math.cos(phase)) * 2.4 * grounded : 0;
    const liftB = p.alive ? Math.max(0, Math.cos(phase)) * 2.4 * grounded : 0;
    const tailWave = p.alive ? Math.sin(age * 17 + i) * 2.4 : 0;

    // 1. Fluttering white ninja headband tail streaming behind the mascot
    g.fillStyle(0xfffdf5).fillTriangle(
      -9,
      -5.5,
      -21.5,
      -8 + tailWave,
      -19,
      -1.5 + tailWave * 0.7,
    );
    g.lineStyle(2.2, theme.ink).strokeTriangle(
      -9,
      -5.5,
      -21.5,
      -8 + tailWave,
      -19,
      -1.5 + tailWave * 0.7,
    );

    // 2. Proper articulated pumping legs & rounded runner shoes underneath
    // Back leg
    g.lineStyle(4.2, theme.ink).lineBetween(
      -4,
      6.5,
      -5.2 - stride,
      11.2 - liftA,
    );
    g.fillStyle(theme.ink).fillEllipse(
      -4.2 - stride,
      12 - liftA,
      7.2,
      4.8,
    );
    // Front leg
    g.lineStyle(4.2, theme.ink).lineBetween(
      4,
      6.5,
      5.2 + stride,
      11.2 - liftB,
    );
    g.fillStyle(theme.ink).fillEllipse(
      6.2 + stride,
      12 - liftB,
      7.2,
      4.8,
    );

    // 3. Signature chubby Gravity-Runner logo bean body
    const bodyCol = p.alive ? color : 0xaaa99c;
    rounded(g, -10, -11.5, 20, 21, 9, bodyCol, 2.5);
    if (p.alive) {
      // Glossy top-back highlight strokes matching the preview mascot
      g.lineStyle(2.4, shine, 0.9)
        .lineBetween(-6, -8.5, -1, -9.2)
        .lineBetween(-6.5, 1.5, -6.5, 5.5);
    }

    // 4. Crisp white ninja headband strapped across the forehead
    rounded(g, -10, -7.2, 20, 4.4, 1.8, 0xfffdf5, 2);

    // 5. Proper expressive eyes (white sclera + dark pupils + bright shine) + blush + smile
    if (p.alive) {
      for (const ex of [0.8, 6.2]) {
        g.fillStyle(0xfffdf5).fillEllipse(ex, 0.6, 4.6, 5.2);
        g.lineStyle(1.3, theme.ink, 0.85).strokeEllipse(ex, 0.6, 4.6, 5.2);
        g.fillStyle(theme.ink).fillCircle(ex + 0.7, 0.7, 1.65);
        g.fillStyle(0xfffdf5).fillCircle(ex + 1.2, -0.1, 0.65);
      }
      g.fillStyle(blush, 0.6).fillEllipse(-2.8, 3.6, 3.8, 2.2);
      g.lineStyle(1.8, theme.ink).beginPath();
      g.arc(3.6, 3.8, 2.4, 0.2, Math.PI - 0.2, false);
      g.strokePath();
    } else {
      // Cute X X dizzy eyes when knocked out
      g.lineStyle(1.8, theme.ink);
      for (const ex of [0.8, 6.2]) {
        g.lineBetween(ex - 1.8, -1.2, ex + 1.8, 2.4);
        g.lineBetween(ex + 1.8, -1.2, ex - 1.8, 2.4);
      }
    }

    g.restore();
    if (!p.alive) {
      g.lineStyle(3, color, 0.7).strokeCircle(x, y, 19);
    }
  }
}
