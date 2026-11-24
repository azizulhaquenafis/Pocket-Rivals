import type Phaser from "phaser";
import { theme } from "../../../../core/ThemeManager";
import type { Course, Field, Point, Rect, Surface } from "../courses/types";
import { oil } from "../courses/foundry";
import type { GolfDynamics } from "../GolfDynamics";

const BG: Rect = { x: -900, y: -700, w: 3720, h: 2480 };

interface Star {
  x: number;
  y: number;
  r: number;
  color: number;
  phase: number;
  speed: number;
  sparkle: boolean;
}

const STARS: Star[] = (() => {
  const list: Star[] = [];
  const palette = [0xfffdf5, 0xcbeeff, 0xffe8a3, 0xe7d4ff, 0xa8e0f5];
  let s = 13379;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < 250; i++) {
    list.push({
      x: -550 + rand() * 3020,
      y: -450 + rand() * 1980,
      r: 1.5 + rand() * 2.7,
      color: palette[Math.floor(rand() * palette.length)],
      phase: rand() * Math.PI * 2,
      speed: 1.4 + rand() * 2.6,
      sparkle: i % 7 === 0,
    });
  }
  return list;
})();

const NEBULAE: ReadonlyArray<[number, number, number, number, number]> = [
  [360, 260, 340, 0x6f4eb8, 0.17],
  [920, 620, 390, 0x398da8, 0.14],
  [1540, 310, 330, 0xa24c8c, 0.14],
  [1480, 910, 350, 0x6144a6, 0.16],
  [320, 880, 310, 0x3a7ca8, 0.14],
  [960, 1140, 290, 0x7e4da6, 0.16],
  [960, -20, 280, 0x3582a3, 0.15],
  [-120, 540, 320, 0x714eb3, 0.15],
  [2060, 560, 320, 0x3d88a8, 0.15],
];

function drawSparkle(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number,
) {
  g.fillStyle(color, alpha);
  g.fillTriangle(x, y - size, x + size * 0.28, y, x - size * 0.28, y);
  g.fillTriangle(x, y + size, x + size * 0.28, y, x - size * 0.28, y);
  g.fillTriangle(x - size, y, x, y + size * 0.28, x, y - size * 0.28);
  g.fillTriangle(x + size, y, x, y + size * 0.28, x, y - size * 0.28);
}

function drawGear(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  teeth: number,
  angle: number,
  fill: number,
) {
  g.fillStyle(fill, 0.95);
  for (let i = 0; i < teeth; i++) {
    const a = angle + (i * Math.PI * 2) / teeth;
    const tx = x + Math.cos(a) * (r + 4);
    const ty = y + Math.sin(a) * (r + 4);
    g.fillCircle(tx, ty, Math.max(4, r * 0.2));
  }
  g.fillStyle(fill).fillCircle(x, y, r);
  g.lineStyle(3, theme.ink).strokeCircle(x, y, r);
  g.fillStyle(0x3a424b).fillCircle(x, y, r * 0.38);
  g.lineStyle(2.5, theme.ink).strokeCircle(x, y, r * 0.38);
}

function drawChevron(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  size: number,
  color: number,
  alpha: number,
  width = 4.5,
) {
  const px = -dirY,
    py = dirX;
  const tipX = x + dirX * size * 0.55;
  const tipY = y + dirY * size * 0.55;
  const backX = x - dirX * size * 0.45;
  const backY = y - dirY * size * 0.45;
  g.lineStyle(width, color, alpha);
  g.lineBetween(backX + px * size, backY + py * size, tipX, tipY);
  g.lineBetween(backX - px * size, backY - py * size, tipX, tipY);
}

function drawDashedCircle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  segments: number,
  color: number,
  alpha: number,
  lineWidth = 3,
  offset = 0,
) {
  g.lineStyle(lineWidth, color, alpha);
  const step = (Math.PI * 2) / segments;
  for (let i = 0; i < segments; i++) {
    const a0 = offset + i * step;
    const a1 = a0 + step * 0.55;
    g.beginPath();
    g.arc(cx, cy, r, a0, a1, false);
    g.strokePath();
  }
}

function drawPalmCluster(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale: number,
  t: number,
) {
  const sway = Math.sin(t * 1.4 + x * 0.01) * 0.06;
  const fronds = 5;
  for (let i = 0; i < fronds; i++) {
    const a = sway + (i * Math.PI * 2) / fronds + 0.3;
    const len = 34 * scale;
    const midX = x + Math.cos(a) * len * 0.55;
    const midY = y + Math.sin(a) * len * 0.55;
    const tipX = x + Math.cos(a) * len;
    const tipY = y + Math.sin(a) * len;
    const nx = -Math.sin(a) * 9 * scale;
    const ny = Math.cos(a) * 9 * scale;
    g.fillStyle(i % 2 === 0 ? 0x5da160 : 0x73b86e)
      .fillTriangle(x, y, midX + nx, midY + ny, tipX, tipY)
      .fillTriangle(x, y, midX - nx, midY - ny, tipX, tipY);
    g.lineStyle(2, theme.ink, 0.75).lineBetween(x, y, tipX, tipY);
  }
  g.fillStyle(0x9b6b43).fillCircle(x, y, 5.5 * scale);
  g.lineStyle(2, theme.ink).strokeCircle(x, y, 5.5 * scale);
}

function drawJungleBush(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  flowerColor?: number,
) {
  g.fillStyle(0x3f7048).fillCircle(x, y, r);
  g.lineStyle(3, theme.ink, 0.85).strokeCircle(x, y, r);
  g.fillStyle(0x5a945b).fillCircle(x - r * 0.22, y - r * 0.2, r * 0.72);
  g.fillStyle(0x7bb86d, 0.9).fillCircle(x - r * 0.32, y - r * 0.3, r * 0.38);
  if (flowerColor) {
    g.fillStyle(flowerColor).fillCircle(x + r * 0.22, y + r * 0.16, r * 0.2);
    g.fillStyle(0xfffdf5).fillCircle(x + r * 0.22, y + r * 0.16, r * 0.08);
  }
}

function drawRingedPlanet(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  r: number,
  bodyColor: number,
  bandColor: number,
  ringColor: number,
  tilt: number,
) {
  g.save();
  g.translateCanvas(x, y);
  g.rotateCanvas(tilt);
  // Back half of ring
  g.lineStyle(6, ringColor, 0.55).strokeEllipse(0, 0, r * 3.1, r * 0.95);
  // Planet body
  g.fillStyle(bodyColor).fillCircle(0, 0, r);
  g.fillStyle(bandColor, 0.45).fillRoundedRect(-r * 0.88, -r * 0.22, r * 1.76, r * 0.44, r * 0.2);
  g.fillStyle(0xfffdf5, 0.24).fillCircle(-r * 0.3, -r * 0.32, r * 0.36);
  g.lineStyle(3, theme.ink, 0.8).strokeCircle(0, 0, r);
  // Front ring arc
  g.lineStyle(5, ringColor, 0.9);
  g.beginPath();
  g.arc(0, 0, r * 1.48, 0.08, Math.PI - 0.08, false);
  g.strokePath();
  g.restore();
}

function drawHazardStrip(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean,
) {
  g.fillStyle(0xe5b249).fillRect(x, y, w, h);
  g.fillStyle(0x2d333b);
  const step = 34;
  if (horizontal) {
    for (let px = x; px < x + w; px += step) {
      const rw = Math.min(16, x + w - px);
      g.fillRect(px, y, rw, h);
    }
  } else {
    for (let py = y; py < y + h; py += step) {
      const rh = Math.min(16, y + h - py);
      g.fillRect(x, py, w, rh);
    }
  }
  g.lineStyle(2.5, theme.ink).strokeRect(x, y, w, h);
}

export function drawCourseBackdrop(
  g: Phaser.GameObjects.Graphics,
  c: Course,
  time: number,
  portrait = true,
) {
  if (c.id === "foundry") {
    // Full-bleed dark workshop steel bay
    g.fillStyle(0x3a414a).fillRect(BG.x, BG.y, BG.w, BG.h);
    g.lineStyle(2, 0x2c323a, 0.65);
    for (let gx = -840; gx <= 2760; gx += 120)
      g.lineBetween(gx, BG.y, gx, BG.y + BG.h);
    for (let gy = -660; gy <= 1740; gy += 120)
      g.lineBetween(BG.x, gy, BG.x + BG.w, gy);

    // Subtle warm furnace underglow pockets in outer bays
    for (const [fx, fy, fr] of [
      [320, 1135, 130],
      [1180, 1135, 140],
      [1640, 18, 125],
      [700, 18, 120],
    ]) {
      const glow = 0.13 + 0.04 * Math.sin(time * 2 + fx * 0.01);
      g.fillStyle(0xf07a36, glow).fillCircle(fx, fy, fr);
    }

    // Industrial boundary pipes along left/right & top/bottom outside the outer walls
    for (const py of [32, 1118]) {
      g.fillStyle(0x59646f).fillRect(-420, py - 9, 2760, 18);
      g.fillStyle(0x7c8a96, 0.65).fillRect(-420, py - 7, 2760, 5);
      g.lineStyle(2.5, theme.ink).strokeRect(-420, py - 9, 2760, 18);
      for (let fx = -200; fx <= 2120; fx += 240) {
        g.fillStyle(0xc48b47).fillRect(fx - 7, py - 14, 14, 28);
        g.lineStyle(2.5, theme.ink).strokeRect(fx - 7, py - 14, 14, 28);
      }
    }
    for (const px of [-38, 1958]) {
      g.fillStyle(0x59646f).fillRect(px - 9, -240, 18, 1560);
      g.lineStyle(2.5, theme.ink).strokeRect(px - 9, -240, 18, 1560);
    }

    // Slowly turning mechanical gears & grated furnace vents in boundary bays
    drawGear(g, 190, 26, 24, 8, time * 0.5, 0x99794c);
    drawGear(g, 240, 34, 18, 7, -time * 0.67, 0x7a8894);
    drawGear(g, 920, 24, 26, 9, time * 0.4, 0x8e7249);
    drawGear(g, 1540, 26, 24, 8, -time * 0.55, 0x7c8a96);
    drawGear(g, 380, 1126, 26, 9, -time * 0.45, 0x99794c);
    drawGear(g, 434, 1120, 18, 7, time * 0.65, 0x7c8a96);
    drawGear(g, 1120, 1126, 25, 8, time * 0.48, 0x8e7249);
    drawGear(g, 1720, 1126, 26, 9, -time * 0.4, 0x7a8894);
    drawGear(g, -62, 340, 32, 9, time * 0.35, 0x99794c);
    drawGear(g, -62, 780, 28, 8, -time * 0.45, 0x7a8894);
    drawGear(g, 1982, 360, 30, 9, -time * 0.4, 0x99794c);
    drawGear(g, 1982, 790, 28, 8, time * 0.42, 0x7a8894);

    // Grated vents & stacked steel ingots along borders
    for (const [vx, vy] of [
      [560, 16],
      [1260, 16],
      [760, 1104],
      [1440, 1104],
    ]) {
      g.fillStyle(0x272d34).fillRoundedRect(vx, vy, 96, 32, 6);
      g.fillStyle(0xe86c2c, 0.35 + 0.12 * Math.sin(time * 2.5 + vx)).fillRoundedRect(
        vx + 6,
        vy + 6,
        84,
        20,
        4,
      );
      g.lineStyle(3, 0x4e5761);
      for (let gx = vx + 16; gx < vx + 88; gx += 16)
        g.lineBetween(gx, vy + 3, gx, vy + 29);
      g.lineStyle(2.5, theme.ink).strokeRoundedRect(vx, vy, 96, 32, 6);
    }

    // Safety hazard stripe curbing framing the exterior of the foundry walls
    drawHazardStrip(g, -14, 56, 1948, 14, true);
    drawHazardStrip(g, -14, 1080, 1948, 14, true);
    drawHazardStrip(g, -14, 70, 14, 1010, false);
    drawHazardStrip(g, 1920, 70, 14, 1010, false);

    // Warm tiled industrial workshop floor inside the walls
    g.fillStyle(0xe7dcc3).fillRect(0, 70, 1920, 1010);
    const tile = 96;
    for (let tx = 28; tx < 1892; tx += tile) {
      for (let ty = 98; ty < 1052; ty += tile) {
        if ((Math.floor(tx / tile) + Math.floor(ty / tile)) % 2 === 0) {
          g.fillStyle(0xdfd2b6, 0.72).fillRect(
            tx,
            ty,
            Math.min(tile, 1892 - tx),
            Math.min(tile, 1052 - ty),
          );
        }
      }
    }
    g.lineStyle(1.5, 0xc8b99a, 0.65);
    for (let tx = 28 + tile; tx < 1892; tx += tile)
      g.lineBetween(tx, 98, tx, 1052);
    for (let ty = 98 + tile; ty < 1052; ty += tile)
      g.lineBetween(28, ty, 1892, ty);
    return;
  }

  if (c.id === "shoreline") {
    // Full-bleed rich layered tropical ocean
    g.fillStyle(0x52aac2).fillRect(BG.x, BG.y, BG.w, BG.h);
    // Sunlit shallower central lagoon
    g.fillStyle(0x63bdd3, 0.7).fillRoundedRect(-40, 20, 2000, 1110, 140);
    // Subtle sunlit depth bands
    for (let i = 0; i < 6; i++) {
      const y = -280 + i * 310 + Math.sin(time * 0.5 + i) * 14;
      g.fillStyle(0x78cde0, 0.2).fillEllipse(960, y, 2400, 110);
    }
    // Animated ocean wave crests oriented horizontally in screen space!
    g.lineStyle(3, 0xdcf8ff, 0.48);
    for (let wy = -180; wy <= 1300; wy += 105) {
      for (let wx = -260; wx <= 2180; wx += 210) {
        const shift = Math.sin(time * 1.4 + wy * 0.02 + wx * 0.01) * 16;
        const ox = wx + ((Math.round(wy / 105) & 1) ? 95 : 0) + shift;
        if (portrait) {
          // Portrait rotates +90deg CW: screen-horizontal waves run along world Y
          g.beginPath();
          g.arc(ox, wy, 18, Math.PI * 0.65, Math.PI * 1.35, false);
          g.strokePath();
          g.beginPath();
          g.arc(ox, wy + 28, 18, Math.PI * 0.65, Math.PI * 1.35, false);
          g.strokePath();
        } else {
          g.beginPath();
          g.arc(ox, wy, 18, Math.PI * 1.15, Math.PI * 1.85, false);
          g.strokePath();
          g.beginPath();
          g.arc(ox + 28, wy, 18, Math.PI * 1.15, Math.PI * 1.85, false);
          g.strokePath();
        }
      }
    }

    // Boundary ocean filler scenery: decorative coral reefs, mini palm islets, rocks, buoys & starfish
    const islets: ReadonlyArray<[number, number, number, boolean]> = [
      [280, 42, 34, true],
      [710, 38, 28, false],
      [1420, 42, 34, true],
      [1820, 42, 26, false],
      [340, 1104, 34, true],
      [1010, 1102, 30, true],
      [1640, 1104, 34, true],
      [-55, 280, 38, true],
      [-55, 860, 34, true],
      [1975, 320, 36, true],
      [1975, 820, 34, true],
      [715, 515, 28, true],
      [1135, 515, 30, true],
    ];
    for (const [ix, iy, ir, palm] of islets) {
      const foam = ir + 11 + Math.sin(time * 2.2 + ix * 0.02) * 2.5;
      g.fillStyle(0x92e3ed, 0.48).fillCircle(ix, iy, foam + 8);
      g.fillStyle(0xfffdf5, 0.58).fillCircle(ix, iy, foam);
      g.fillStyle(0xebd291).fillCircle(ix, iy, ir);
      g.lineStyle(3, theme.ink, 0.85).strokeCircle(ix, iy, ir);
      if (palm) drawPalmCluster(g, ix, iy, ir / 34, time);
      else {
        // Sea rocks
        g.fillStyle(0x8c9ca1).fillCircle(ix - 7, iy + 3, ir * 0.46);
        g.lineStyle(2.5, theme.ink).strokeCircle(ix - 7, iy + 3, ir * 0.46);
        g.fillStyle(0xa7b6ba).fillCircle(ix + 8, iy - 4, ir * 0.34);
        g.lineStyle(2.5, theme.ink).strokeCircle(ix + 8, iy - 4, ir * 0.34);
      }
    }

    // Bobbing harbor buoys in surrounding ocean (strictly outside whirlpools & bridges)
    for (const [bx, by] of [
      [1060, 42],
      [660, 1085],
      [1350, 1085],
      [1580, 425],
    ]) {
      const bob = Math.sin(time * 2.6 + bx) * 3;
      g.fillStyle(0xfffdf5, 0.45).fillCircle(bx, by + bob, 16);
      g.fillStyle(0xee6a4b).fillCircle(bx, by + bob, 11);
      g.fillStyle(0xfffdf5).fillCircle(bx, by + bob, 5.5);
      g.lineStyle(2.5, theme.ink).strokeCircle(bx, by + bob, 11);
    }

    // Seamless merged sandy islands (multi-pass union — zero internal black seams!)
    if (c.ground) {
      const foamPulse = 10 + Math.sin(time * 2.2) * 2.5;
      // Pass 1: turquoise shallows glow
      g.fillStyle(0x8ee2eb, 0.46);
      for (const r of c.ground)
        g.fillRoundedRect(r.x - 22, r.y - 22, r.w + 44, r.h + 44, 28);
      // Pass 2: gently breathing surf foam
      g.fillStyle(0xfffdf5, 0.65);
      for (const r of c.ground)
        g.fillRoundedRect(
          r.x - foamPulse,
          r.y - foamPulse,
          r.w + foamPulse * 2,
          r.h + foamPulse * 2,
          16,
        );
      // Pass 3: crisp coastal ink outline around outer perimeter only
      g.fillStyle(theme.ink);
      for (const r of c.ground)
        g.fillRoundedRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 8);
      // Pass 4: seamless warm golden sand interior across every island rect
      g.fillStyle(0xf6e2a5);
      for (const r of c.ground) g.fillRect(r.x, r.y, r.w, r.h);

      // Subtle beach speckles & corner shells (visual texture on sand)
      for (const [sx, sy] of [
        [95, 810],
        [360, 995],
        [100, 150],
        [490, 290],
        [520, 990],
        [1140, 1000],
        [1790, 985],
        [1520, 145],
      ]) {
        g.fillStyle(0xe89378, 0.75).fillCircle(sx, sy, 5);
        g.fillStyle(0xfffdf5, 0.7).fillCircle(sx - 1.5, sy - 1.5, 2);
      }
    }
    return;
  }

  if (c.id === "horizon") {
    // Full-bleed deep-space cosmic void
    g.fillStyle(0x1f1b36).fillRect(BG.x, BG.y, BG.w, BG.h);

    // Layered pastel nebula clouds
    for (const [nx, ny, nr, col, alpha] of NEBULAE) {
      g.fillStyle(col, alpha).fillCircle(nx, ny, nr);
      g.fillStyle(col, alpha * 0.65).fillCircle(nx + nr * 0.45, ny - nr * 0.22, nr * 0.68);
    }

    // Crisp multi-size twinkling starfield
    for (const st of STARS) {
      const a = 0.42 + 0.55 * (0.5 + 0.5 * Math.sin(time * st.speed + st.phase));
      if (st.sparkle) drawSparkle(g, st.x, st.y, st.r * 3.1, st.color, a);
      else g.fillStyle(st.color, a).fillCircle(st.x, st.y, st.r);
    }

    // Decorative planets & moons in the boundary void (sized to frame cleanly in portrait & landscape)
    drawRingedPlanet(g, 1510, 1074, 18, 0xf2a766, 0xdd7b4a, 0xf9db9c, -0.28);
    drawRingedPlanet(g, 480, 74, 17, 0x7ecce0, 0x529cb8, 0xcff5ff, 0.25);
    drawRingedPlanet(g, -95, 520, 42, 0xc592e3, 0x9965bd, 0xebd4ff, -0.35);
    drawRingedPlanet(g, 2020, 620, 38, 0xf0937a, 0xcf6a56, 0xffd7b8, 0.3);

    // Cratered crescent moon & distant violet moon along upper/lower space margins
    for (const [mx, my, mr, col, crater] of [
      [1010, 1074, 15, 0xd8d6eb, 0xb2aec9],
      [1360, 72, 14, 0xefb2c8, 0xc984a0],
      [210, 1072, 13, 0x9bd7d4, 0x6eaeb0],
    ] as const) {
      g.fillStyle(col).fillCircle(mx, my, mr);
      g.fillStyle(crater, 0.7).fillCircle(mx - mr * 0.28, my - mr * 0.16, mr * 0.25);
      g.fillStyle(crater, 0.6).fillCircle(mx + mr * 0.28, my + mr * 0.24, mr * 0.18);
      g.lineStyle(2.5, theme.ink, 0.85).strokeCircle(mx, my, mr);
    }

    // Seamless merged space-station walkways (multi-pass union — zero ugly interior seams!)
    if (c.ground) {
      // Pass 1: luminous neon-violet station trim aura
      g.fillStyle(0x7d8be8, 0.45);
      for (const r of c.ground)
        g.fillRoundedRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 12);
      // Pass 2: crisp dark hull outline
      g.fillStyle(theme.ink);
      for (const r of c.ground)
        g.fillRoundedRect(r.x - 3.5, r.y - 3.5, r.w + 7, r.h + 7, 6);
      // Pass 3: unified moonlit space-station metal deck
      g.fillStyle(0xdcd6f0);
      for (const r of c.ground) g.fillRect(r.x, r.y, r.w, r.h);

      // Subtle engineered deck panel seams & tech dots inside each walkway
      g.lineStyle(1.5, 0xbcb3db, 0.6);
      for (const r of c.ground) {
        if (r.w >= r.h) {
          for (let px = r.x + 110; px < r.x + r.w - 40; px += 120)
            g.lineBetween(px, r.y + 8, px, r.y + r.h - 8);
        } else {
          for (let py = r.y + 110; py < r.y + r.h - 40; py += 120)
            g.lineBetween(r.x + 8, py, r.x + r.w - 8, py);
        }
      }
    }
    return;
  }

  // Lost Temple: lush jungle canopy framing ancient mossy courtyard ruins
  g.fillStyle(0x31583e).fillRect(BG.x, BG.y, BG.w, BG.h);
  // Subtle deeper forest dappled foliage circles across the outer canopy
  for (let gx = -400; gx <= 2320; gx += 180) {
    for (const gy of [-140, -35, 1185, 1290]) {
      g.fillStyle(0x3e6f48, 0.7).fillCircle(gx, gy, 72);
      g.fillStyle(0x528854, 0.45).fillCircle(gx + 55, gy + 18, 52);
    }
  }

  // Ancient stone ruin blocks peeking out of the jungle margins
  for (const [rx, ry, rw, rh] of [
    [540, 12, 84, 46],
    [1380, 14, 76, 44],
    [420, 1094, 88, 44],
    [1260, 1094, 82, 44],
    [-82, 310, 62, 92],
    [1940, 690, 62, 92],
  ]) {
    g.fillStyle(0x7c8e70).fillRoundedRect(rx, ry, rw, rh, 6);
    g.lineStyle(3, theme.ink, 0.85).strokeRoundedRect(rx, ry, rw, rh, 6);
    g.lineStyle(2, 0x5c6d52, 0.7).lineBetween(rx + rw * 0.5, ry + 4, rx + rw * 0.5, ry + rh - 4);
  }

  // Lush leafy bushes & tropical fern clusters hugging all four outer edges of the temple walls
  const flowers = [0xf5c45e, undefined, 0xeb7e63, undefined, undefined];
  for (let i = 0; i < 16; i++) {
    const bx = 45 + i * 122;
    drawJungleBush(g, bx, 34 + (i % 2) * 8, 30 + (i % 3) * 5, flowers[i % 5]);
    drawJungleBush(
      g,
      bx + 26,
      1114 + ((i + 1) % 2) * 8,
      30 + ((i + 1) % 3) * 5,
      flowers[(i + 2) % 5],
    );
    if (i % 3 === 1) {
      drawPalmCluster(g, bx + 54, 48, 0.72, time);
      drawPalmCluster(g, bx - 18, 1100, 0.72, time + 1.5);
    }
  }
  for (let i = 0; i < 9; i++) {
    const by = 110 + i * 112;
    drawJungleBush(g, -36 - (i % 2) * 10, by, 34 + (i % 3) * 5, flowers[(i + 1) % 5]);
    drawJungleBush(g, 1956 + (i % 2) * 10, by + 20, 34 + ((i + 2) % 3) * 5, flowers[i % 5]);
  }

  // Sunlit mossy temple courtyard floor inside outer walls
  g.fillStyle(0xd2e4b3).fillRect(0, 70, 1920, 1010);
  // Subtle ancient flagstone courtyard tiles
  const flag = 110;
  for (let fx = 28; fx < 1892; fx += flag) {
    for (let fy = 98; fy < 1052; fy += flag) {
      if ((Math.floor(fx / flag) + Math.floor(fy / flag)) % 2 === 0) {
        g.fillStyle(0xc6dba3, 0.65).fillRect(
          fx + 2,
          fy + 2,
          Math.min(flag - 4, 1892 - fx - 2),
          Math.min(flag - 4, 1052 - fy - 2),
        );
      }
    }
  }
  g.lineStyle(1.5, 0xb0c78d, 0.55);
  for (let fx = 28 + flag; fx < 1892; fx += flag) g.lineBetween(fx, 98, fx, 1052);
  for (let fy = 98 + flag; fy < 1052; fy += flag) g.lineBetween(28, fy, 1892, fy);
}

export function drawTempleCircuit(
  g: Phaser.GameObjects.Graphics,
  c: Course,
  d: GolfDynamics,
) {
  if (c.id !== "temple" || !c.plates || !c.doors) return;
  const drawTrace = (pts: ReadonlyArray<[number, number]>, active: boolean) => {
    g.lineStyle(7, active ? 0x58addb : 0x9db582, active ? 0.55 : 0.7);
    for (let i = 0; i < pts.length - 1; i++)
      g.lineBetween(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    g.lineStyle(2.5, active ? 0xfffdf5 : 0x7b9365, active ? 0.85 : 0.75);
    for (let i = 0; i < pts.length - 1; i++)
      g.lineBetween(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  };
  // Plate 0 -> Door 0
  drawTrace(
    [
      [1000, 570],
      [1152, 570],
    ],
    d.gate > 0,
  );
  // Plate 1 (top-right) -> Door 1
  drawTrace(
    [
      [1810, 200],
      [1765, 200],
      [1765, 550],
      [1728, 550],
    ],
    d.plates[1],
  );
  // Plate 2 (bottom-right) -> Door 1
  drawTrace(
    [
      [1810, 950],
      [1765, 950],
      [1765, 590],
      [1728, 590],
    ],
    d.plates[2],
  );
}

export function drawRiver(
  g: Phaser.GameObjects.Graphics,
  river: Rect,
  time: number,
) {
  // Stone riverbank edges
  g.fillStyle(0x6d8161).fillRect(river.x - 6, river.y, river.w + 12, river.h);
  // Rich flowing turquoise jungle river
  g.fillStyle(0x4ba3cc).fillRect(river.x, river.y, river.w, river.h);
  // Brighter central current band
  g.fillStyle(0x66bce0, 0.55).fillRect(river.x + 22, river.y, river.w - 44, river.h);
  // Animated flowing whitewater ripples
  const speed = 75;
  g.lineStyle(3, 0xdaf6ff, 0.62);
  for (let lane = 0; lane < 3; lane++) {
    const rx = river.x + 28 + lane * 42;
    const offset = ((time * speed + lane * 68) % 140) - 40;
    for (let ry = river.y + offset; ry < river.y + river.h - 20; ry += 140) {
      if (ry >= river.y + 8) g.lineBetween(rx, ry, rx, Math.min(river.y + river.h - 8, ry + 34));
    }
  }
  g.lineStyle(3, theme.ink).lineBetween(river.x, river.y, river.x, river.y + river.h);
  g.lineStyle(3, theme.ink).lineBetween(
    river.x + river.w,
    river.y,
    river.x + river.w,
    river.y + river.h,
  );
}

export function drawTidalBridge(
  g: Phaser.GameObjects.Graphics,
  r: Rect,
  d: GolfDynamics,
) {
  const safe = d.bridgeSafe();
  const t8 = d.time % 8;
  const warning = safe && t8 >= 2.5 && t8 < 3.5;

  // Timber boardwalk planks
  const slat = 24;
  const horiz = r.w > r.h;
  g.fillStyle(safe ? 0xdfba82 : 0x5ea8c2).fillRect(r.x, r.y, r.w, r.h);

  if (horiz) {
    for (let px = r.x; px < r.x + r.w; px += slat) {
      const pw = Math.min(slat - 3, r.x + r.w - px);
      g.fillStyle(safe ? 0xe7c68f : 0x73b7cf, safe ? 1 : 0.45).fillRect(px + 1, r.y + 4, pw, r.h - 8);
      g.lineStyle(2, theme.ink, safe ? 0.55 : 0.25).lineBetween(px, r.y + 2, px, r.y + r.h - 2);
    }
  } else {
    for (let py = r.y; py < r.y + r.h; py += slat) {
      const ph = Math.min(slat - 3, r.y + r.h - py);
      g.fillStyle(safe ? 0xe7c68f : 0x73b7cf, safe ? 1 : 0.45).fillRect(r.x + 4, py + 1, r.w - 8, ph);
      g.lineStyle(2, theme.ink, safe ? 0.55 : 0.25).lineBetween(r.x + 2, py, r.x + r.w - 2, py);
    }
  }

  // Dock corner pilings
  for (const [px, py] of [
    [r.x + 7, r.y + 7],
    [r.x + r.w - 7, r.y + 7],
    [r.x + 7, r.y + r.h - 7],
    [r.x + r.w - 7, r.y + r.h - 7],
  ]) {
    g.fillStyle(0x9b7148, safe ? 1 : 0.5).fillCircle(px, py, 6);
    g.lineStyle(2, theme.ink, safe ? 0.85 : 0.4).strokeCircle(px, py, 6);
  }

  // Pre-flood rising tide wash warning OR submerged waves
  if (warning) {
    const frac = (t8 - 2.5) / 1.0;
    const band = (r.w * 0.48) * frac;
    g.fillStyle(0x5bb6d0, 0.55).fillRect(r.x, r.y, band, r.h);
    g.fillStyle(0x5bb6d0, 0.55).fillRect(r.x + r.w - band, r.y, band, r.h);
    g.lineStyle(3, 0xfffdf5, 0.85);
    g.lineBetween(r.x + band, r.y + 6, r.x + band, r.y + r.h - 6);
    g.lineBetween(r.x + r.w - band, r.y + 6, r.x + r.w - band, r.y + r.h - 6);
  } else if (!safe) {
    g.fillStyle(0x4298b5, 0.62).fillRect(r.x, r.y, r.w, r.h);
    g.lineStyle(3, 0xdff8ff, 0.7);
    const waveOff = (d.time * 42) % 48;
    for (let wy = r.y + 18 + waveOff; wy < r.y + r.h - 10; wy += 48) {
      g.lineBetween(r.x + 14, wy, r.x + r.w - 14, wy);
    }
  }
  g.lineStyle(3, theme.ink, safe ? 0.9 : 0.4).strokeRect(r.x, r.y, r.w, r.h);
}

export function drawPlank(
  g: Phaser.GameObjects.Graphics,
  r: Rect,
  timer: number,
  limit: number,
) {
  if (timer >= limit) return;
  const cracking = timer > 0;
  g.fillStyle(cracking ? 0xf29f60 : 0xe3be84).fillRect(r.x, r.y, r.w, r.h);
  // Wood grain lines
  g.lineStyle(1.5, cracking ? 0xaa5a2c : 0xb88f56, 0.65);
  g.lineBetween(r.x + r.w * 0.35, r.y + 6, r.x + r.w * 0.35, r.y + r.h - 6);
  g.lineBetween(r.x + r.w * 0.68, r.y + 10, r.x + r.w * 0.68, r.y + r.h - 10);
  // Rope side cords
  g.lineStyle(4, 0x9b7245);
  g.lineBetween(r.x, r.y + 6, r.x + r.w, r.y + 6);
  g.lineBetween(r.x, r.y + r.h - 6, r.x + r.w, r.y + r.h - 6);
  // Dramatic fracture cracks once stepped on
  if (cracking) {
    g.lineStyle(3, theme.ink);
    g.lineBetween(r.x + 3, r.y + 16, r.x + r.w * 0.55, r.y + r.h * 0.48);
    g.lineBetween(r.x + r.w * 0.55, r.y + r.h * 0.48, r.x + r.w - 3, r.y + r.h - 14);
    g.lineBetween(r.x + r.w * 0.55, r.y + r.h * 0.48, r.x + 4, r.y + r.h * 0.72);
  }
  g.lineStyle(2.5, theme.ink).strokeRect(r.x, r.y, r.w, r.h);
}

export function drawSurface(
  g: Phaser.GameObjects.Graphics,
  s: Surface,
  courseId: string,
  time: number,
) {
  if (s.kind === "belt") {
    // Dark industrial conveyor belt with animated directional chevrons
    g.fillStyle(0x454d56).fillRect(s.x, s.y, s.w, s.h);
    // Brass/steel conveyor side rails along the long direction
    const pushX = s.push?.x ?? 0,
      pushY = s.push?.y ?? 0;
    const mag = Math.hypot(pushX, pushY) || 1;
    const dx = pushX / mag,
      dy = pushY / mag;
    if (Math.abs(dy) >= Math.abs(dx)) {
      g.fillStyle(0xd69f4c).fillRect(s.x, s.y, 10, s.h);
      g.fillStyle(0xd69f4c).fillRect(s.x + s.w - 10, s.y, 10, s.h);
      g.lineStyle(2, 0x2f353c, 0.75);
      const step = 16;
      const off = ((time * 85 * Math.sign(dy)) % step + step) % step;
      for (let py = s.y + off; py < s.y + s.h; py += step)
        g.lineBetween(s.x + 11, py, s.x + s.w - 11, py);
      // Animated bright amber chevrons across the belt width
      const cols = Math.max(2, Math.floor(s.w / 72));
      const travel = ((time * 72) % s.h);
      for (let i = 0; i < cols; i++) {
        const cx = s.x + (s.w * (i + 0.5)) / cols;
        const baseY = dy > 0 ? s.y + travel : s.y + s.h - travel;
        for (const shift of [0, s.h * 0.5]) {
          let cy = baseY + (dy > 0 ? shift : -shift);
          if (cy > s.y + s.h - 6) cy -= s.h;
          if (cy < s.y + 6) cy += s.h;
          if (cy > s.y + 10 && cy < s.y + s.h - 10)
            drawChevron(g, cx, cy, dx, dy, 12, 0xf7c35c, 0.92, 4.5);
        }
      }
    } else {
      g.fillStyle(0xd69f4c).fillRect(s.x, s.y, s.w, 10);
      g.fillStyle(0xd69f4c).fillRect(s.x, s.y + s.h - 10, s.w, 10);
    }
    g.lineStyle(3, theme.ink).strokeRect(s.x, s.y, s.w, s.h);
    return;
  }

  if (s.kind === "wind") {
    // Glowing ion wind tunnel with fast streaming directional streaks & chevrons
    g.fillStyle(0x7c97f2, 0.42).fillRect(s.x, s.y, s.w, s.h);
    g.fillStyle(0x526fd4, 0.9).fillRect(s.x, s.y, s.w, 8);
    g.fillStyle(0x526fd4, 0.9).fillRect(s.x, s.y + s.h - 8, s.w, 8);
    const pushX = s.push?.x ?? -1,
      pushY = s.push?.y ?? 0;
    const mag = Math.hypot(pushX, pushY) || 1;
    const dx = pushX / mag,
      dy = pushY / mag;
    const rows = 4;
    for (let i = 0; i < rows; i++) {
      const cy = s.y + (s.h * (i + 0.5)) / rows;
      const frac = ((time * 1.45 + i * 0.27) % 1);
      const cx = dx < 0 ? s.x + s.w - frac * s.w : s.x + frac * s.w;
      const alpha = Math.sin(frac * Math.PI) * 0.95;
      if (cx > s.x + 14 && cx < s.x + s.w - 14) {
        drawChevron(g, cx, cy, dx, dy, 11, 0xe8fbff, alpha, 4);
        g.lineStyle(2.5, 0xb8e6ff, alpha * 0.7).lineBetween(
          cx - dx * 20,
          cy,
          cx - dx * 5,
          cy,
        );
      }
    }
    g.lineStyle(2.5, 0x455db5, 0.85).strokeRect(s.x, s.y, s.w, s.h);
    return;
  }

  if (s.kind === "ford") {
    // Shallow shimmering water crossing with submerged stepping pebbles & animated current chevrons
    g.fillStyle(0x6ac7d6).fillRect(s.x, s.y, s.w, s.h);
    g.fillStyle(0x88dce8, 0.55).fillRect(s.x + 6, s.y + 6, s.w - 12, s.h - 12);
    // Submerged smooth pebbles
    for (let i = 0; i < 6; i++) {
      const px = s.x + 20 + ((i * 37) % Math.max(20, s.w - 40));
      const py = s.y + 22 + ((i * 53) % Math.max(20, s.h - 44));
      g.fillStyle(0xc9d1be, 0.55).fillEllipse(px, py, 16, 11);
    }
    // Animated flow chevrons in push direction (+x)
    const rows = 4;
    for (let i = 0; i < rows; i++) {
      const cy = s.y + (s.h * (i + 0.5)) / rows;
      const frac = (time * 0.95 + i * 0.25) % 1;
      const cx = s.x + 12 + frac * (s.w - 24);
      const alpha = Math.sin(frac * Math.PI) * 0.92;
      drawChevron(g, cx, cy, 1, 0, 10, 0xfffdf5, alpha, 3.8);
    }
    g.lineStyle(2.5, 0x3b8ea3, 0.8).strokeRect(s.x, s.y, s.w, s.h);
    return;
  }

  if (s.kind === "sand") {
    // Recessed golden sand bunker with curved raked lines
    g.fillStyle(0xc68e3d).fillRoundedRect(s.x, s.y, s.w, s.h, 16);
    g.fillStyle(0xe3b15e).fillRoundedRect(s.x + 4, s.y + 4, s.w - 8, s.h - 8, 13);
    g.lineStyle(2.5, 0xf4d38d, 0.72);
    const step = 22;
    for (let sy = s.y + 18; sy < s.y + s.h - 14; sy += step) {
      g.lineBetween(s.x + 14, sy, s.x + s.w - 14, sy + ((sy / step) % 2 ? 4 : -4));
    }
    // Fine sand grains
    g.fillStyle(0xaa732b, 0.35);
    for (let i = 0; i < 9; i++) {
      const gx = s.x + 16 + ((i * 43) % Math.max(16, s.w - 32));
      const gy = s.y + 16 + ((i * 29) % Math.max(16, s.h - 32));
      g.fillCircle(gx, gy, 2.6);
    }
    return;
  }

  if (s.kind === "slick") {
    // Theme-matched unmistakably glossy low-friction surface!
    const palette =
      courseId === "horizon"
        ? { base: 0x9ce8fa, rim: 0xe6fcff, line: 0x5ab7d4 }
        : courseId === "shoreline"
          ? { base: 0x97dbe0, rim: 0xe2fafc, line: 0x5faeb8 }
          : { base: 0x95ddd4, rim: 0xe3fbf8, line: 0x56aba3 };
    g.fillStyle(palette.base).fillRoundedRect(s.x, s.y, s.w, s.h, 12);
    g.lineStyle(3, palette.rim, 0.9).strokeRoundedRect(
      s.x + 3,
      s.y + 3,
      s.w - 6,
      s.h - 6,
      10,
    );
    // Crisp diagonal glass/ice specular streaks
    g.lineStyle(5, 0xfffdf5, 0.52);
    const count = Math.max(3, Math.floor((s.w + s.h) / 90));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const x1 = s.x + 14 + t * (s.w - 48);
      const y1 = s.y + 14 + ((i * 19) % Math.max(12, s.h - 46));
      g.lineBetween(x1, y1 + 22, x1 + 26, y1);
    }
    // Shimmering crystal glints
    drawSparkle(g, s.x + s.w * 0.28, s.y + s.h * 0.32, 9, 0xfffdf5, 0.82);
    drawSparkle(g, s.x + s.w * 0.72, s.y + s.h * 0.68, 7, 0xfffdf5, 0.75);
    g.lineStyle(2.5, palette.line, 0.8).strokeRoundedRect(s.x, s.y, s.w, s.h, 12);
    return;
  }

  if (s.kind === "mud") {
    // Organic dark-earth mud puddle with damp highlights
    g.fillStyle(0x7c563b).fillRoundedRect(s.x, s.y, s.w, s.h, 24);
    g.fillStyle(0x63422c, 0.85).fillRoundedRect(
      s.x + 10,
      s.y + 10,
      s.w - 20,
      s.h - 20,
      18,
    );
    // Mud blobs & damp specular droplets
    g.fillStyle(0x8e6445).fillEllipse(s.x + s.w * 0.34, s.y + s.h * 0.36, s.w * 0.42, s.h * 0.32);
    g.fillStyle(0x8e6445).fillEllipse(s.x + s.w * 0.68, s.y + s.h * 0.66, s.w * 0.38, s.h * 0.32);
    g.fillStyle(0xc49c7b, 0.55).fillEllipse(s.x + s.w * 0.3, s.y + s.h * 0.3, 22, 9);
    g.fillStyle(0xc49c7b, 0.5).fillEllipse(s.x + s.w * 0.65, s.y + s.h * 0.62, 18, 8);
    g.lineStyle(3, 0x4d3220, 0.85).strokeRoundedRect(s.x, s.y, s.w, s.h, 24);
    return;
  }

  if (s.kind === "quicksand") {
    // Unmistakable slowly-spiraling golden-amber quicksand trap!
    const cx = s.x + s.w / 2,
      cy = s.y + s.h / 2;
    const maxR = Math.min(s.w, s.h) * 0.44;
    g.fillStyle(0xc2842f).fillRoundedRect(s.x, s.y, s.w, s.h, 18);
    g.fillStyle(0xe5af52).fillRoundedRect(s.x + 5, s.y + 5, s.w - 10, s.h - 10, 14);
    // Swirling vortex rings pulling toward dark sinkhole center
    for (let ring = 3; ring >= 1; ring--) {
      const rr = (maxR * ring) / 3.2;
      const rot = time * (0.9 + (4 - ring) * 0.35) + ring * 1.1;
      g.lineStyle(4, ring === 1 ? 0x8f5818 : 0xb37422, 0.8);
      g.beginPath();
      g.arc(cx, cy, rr, rot, rot + Math.PI * 1.35, false);
      g.strokePath();
      g.lineStyle(2.5, 0xfce19c, 0.72);
      g.beginPath();
      g.arc(cx, cy, rr - 4, rot + Math.PI, rot + Math.PI * 1.75, false);
      g.strokePath();
    }
    g.fillStyle(0x7c4a12, 0.9).fillCircle(cx, cy, 11);
    g.lineStyle(3, 0x8f5818, 0.85).strokeRoundedRect(s.x, s.y, s.w, s.h, 18);
  }
}

export function drawFoundryOil(g: Phaser.GameObjects.Graphics) {
  // Glossy dark iridescent oil spill inside `oil.r` (70px)
  g.fillStyle(0x21272f).fillCircle(oil.x, oil.y, oil.r);
  g.fillStyle(0x21272f).fillEllipse(oil.x - 16, oil.y + 12, oil.r * 1.48, oil.r * 1.25);
  g.fillStyle(0x21272f).fillEllipse(oil.x + 18, oil.y - 10, oil.r * 1.38, oil.r * 1.28);
  // Subtle iridescent petrol sheen bands
  g.lineStyle(6, 0x3b8d9c, 0.42);
  g.beginPath();
  g.arc(oil.x, oil.y, oil.r * 0.72, -0.6, 1.35, false);
  g.strokePath();
  g.lineStyle(5, 0x7d5ca8, 0.4);
  g.beginPath();
  g.arc(oil.x, oil.y, oil.r * 0.5, 1.9, 3.8, false);
  g.strokePath();
  // Crisp liquid specular highlights
  g.lineStyle(5, 0xfffdf5, 0.75);
  g.beginPath();
  g.arc(oil.x - 6, oil.y - 6, oil.r * 0.56, Math.PI * 1.08, Math.PI * 1.48, false);
  g.strokePath();
  g.fillStyle(0xfffdf5, 0.72).fillCircle(oil.x + 24, oil.y - 24, 6);
  g.lineStyle(3, theme.ink).strokeCircle(oil.x, oil.y, oil.r);
}

export function drawField(
  g: Phaser.GameObjects.Graphics,
  f: Field,
  courseId: string,
  time: number,
) {
  if (courseId === "foundry") {
    // Strong industrial electromagnet with inward pulsing magnetic waves & red/blue pole core!
    g.fillStyle(0x58addb, 0.1).fillCircle(f.x, f.y, f.r);
    drawDashedCircle(g, f.x, f.y, f.r, 24, 0x458fb8, 0.65, 3, -time * 0.3);
    for (let k = 0; k < 3; k++) {
      const frac = 1 - ((time * 0.65 + k / 3) % 1); // shrinks inward from 1 -> 0
      const rr = (f.core ?? 22) + frac * (f.r - (f.core ?? 22));
      const alpha = Math.sin(frac * Math.PI) * 0.78;
      g.lineStyle(3.5, 0x4a9bd4, alpha).strokeCircle(f.x, f.y, rr);
    }
    const core = f.core ?? 22;
    // Half red / half blue electromagnet cylinder
    g.fillStyle(0xe5594c);
    g.slice(f.x, f.y, core, Math.PI * 0.5, Math.PI * 1.5, false);
    g.fillPath();
    g.fillStyle(0x4c9be5);
    g.slice(f.x, f.y, core, -Math.PI * 0.5, Math.PI * 0.5, false);
    g.fillPath();
    // Silver center separator & coil ring
    g.fillStyle(0xeaf2f7).fillRect(f.x - 3, f.y - core + 2, 6, core * 2 - 4);
    g.lineStyle(4, theme.ink).strokeCircle(f.x, f.y, core);
    g.fillStyle(0xf2c057).fillCircle(f.x, f.y, 7);
    g.lineStyle(2.5, theme.ink).strokeCircle(f.x, f.y, 7);
    return;
  }

  if (courseId === "shoreline") {
    // Deep swirling ocean whirlpool!
    g.fillStyle(0x236f8a, 0.22).fillCircle(f.x, f.y, f.r);
    g.fillStyle(0x1b5a73, 0.34).fillCircle(f.x, f.y, f.r * 0.62);
    g.fillStyle(0x113d52, 0.55).fillCircle(f.x, f.y, f.r * 0.32);
    drawDashedCircle(g, f.x, f.y, f.r, 22, 0xfffdf5, 0.55, 3, time * 0.55);
    // 4 animated spiraling foam vortex arms curling inward
    for (let arm = 0; arm < 4; arm++) {
      const baseA = time * 2.1 + (arm * Math.PI) / 2;
      g.lineStyle(4, 0xe4fbff, 0.78);
      g.beginPath();
      for (let step = 0; step <= 14; step++) {
        const u = step / 14;
        const rr = 14 + (f.r * 0.86 - 14) * u;
        const a = baseA - u * 2.4;
        const px = f.x + Math.cos(a) * rr;
        const py = f.y + Math.sin(a) * rr;
        if (step === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
    }
    g.fillStyle(0x0c2c3d).fillCircle(f.x, f.y, 17);
    g.lineStyle(3, 0x99e7f5, 0.85).strokeCircle(f.x, f.y, 17);
    return;
  }

  // Event Horizon: dramatic cosmic gravity well / black hole!
  g.fillStyle(0x8862db, 0.16).fillCircle(f.x, f.y, f.r);
  drawDashedCircle(g, f.x, f.y, f.r, 26, 0xb896ff, 0.62, 3, -time * 0.35);
  // 3 inward-collapsing gravity wave rings
  const innerR = f.core ?? 22;
  for (let k = 0; k < 3; k++) {
    const frac = 1 - ((time * 0.72 + k / 3) % 1);
    const rr = innerR + frac * (f.r - innerR);
    const alpha = Math.sin(frac * Math.PI) * 0.78;
    g.lineStyle(3.5, 0xc39eff, alpha).strokeCircle(f.x, f.y, rr);
  }
  if (f.core) {
    // Glowing golden-violet accretion ring around solid cosmic singularity core
    g.fillStyle(0xd99ff5, 0.35).fillCircle(f.x, f.y, f.core + 14);
    g.lineStyle(5, 0xf6c975, 0.88).strokeCircle(f.x, f.y, f.core + 5);
    g.fillStyle(0x22153d).fillCircle(f.x, f.y, f.core);
    g.lineStyle(3.5, theme.ink).strokeCircle(f.x, f.y, f.core);
    g.fillStyle(0xc89ef5, 0.45).fillCircle(f.x - 6, f.y - 6, f.core * 0.36);
  } else {
    // Coreless central black hole vortex with rotating accretion arms
    for (let arm = 0; arm < 3; arm++) {
      const baseA = time * 1.9 + (arm * Math.PI * 2) / 3;
      g.lineStyle(4.5, 0xd8a8ff, 0.72);
      g.beginPath();
      for (let step = 0; step <= 12; step++) {
        const u = step / 12;
        const rr = 16 + (f.r * 0.42 - 16) * u;
        const a = baseA - u * 2.2;
        const px = f.x + Math.cos(a) * rr;
        const py = f.y + Math.sin(a) * rr;
        if (step === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.strokePath();
    }
    g.fillStyle(0x120b24).fillCircle(f.x, f.y, 22);
    g.lineStyle(4, 0xf2bc74, 0.85).strokeCircle(f.x, f.y, 22);
  }
}

export function drawLava(
  g: Phaser.GameObjects.Graphics,
  v: { x: number; y: number; r: number },
  time: number,
) {
  const pulse = 1 + Math.sin(time * 3.4 + v.x * 0.02) * 0.07;
  // Dark volcanic crust rim
  g.fillStyle(0x3f3632).fillCircle(v.x, v.y, v.r + 3);
  g.fillStyle(0xe8542c).fillCircle(v.x, v.y, v.r - 2);
  g.fillStyle(0xff9b38).fillCircle(v.x, v.y, v.r * 0.68 * pulse);
  g.fillStyle(0xffe67a).fillCircle(v.x - 4, v.y - 4, v.r * 0.36 * pulse);
  // Slowly rising magma bubbles
  for (let b = 0; b < 2; b++) {
    const u = (time * 0.7 + b * 0.5 + v.x * 0.003) % 1;
    const bx = v.x + (b === 0 ? 11 : -12);
    const by = v.y + (b === 0 ? 9 : -8);
    g.lineStyle(2.5, 0xfff1a8, (1 - u) * 0.9).strokeCircle(bx, by, 3 + u * 8);
  }
  g.lineStyle(3.5, theme.ink).strokeCircle(v.x, v.y, v.r);
}

export function drawWall(
  g: Phaser.GameObjects.Graphics,
  r: Rect,
  courseId: string,
) {
  if (courseId === "temple") {
    // Mossy ancient carved temple stone wall
    g.fillStyle(0x7c906e).fillRect(r.x, r.y, r.w, r.h);
    // Sunlit stone bevel
    g.fillStyle(0x98ad88, 0.65).fillRect(r.x + 2, r.y + 2, r.w - 4, Math.min(6, r.h - 4));
    // Carved ashlar stone block joints
    g.lineStyle(2, 0x57684c, 0.75);
    if (r.w >= r.h) {
      for (let sx = r.x + 56; sx < r.x + r.w - 16; sx += 56)
        g.lineBetween(sx, r.y + 2, sx, r.y + r.h - 2);
    } else {
      for (let sy = r.y + 56; sy < r.y + r.h - 16; sy += 56)
        g.lineBetween(r.x + 2, sy, r.x + r.w - 2, sy);
    }
    g.lineStyle(3.5, theme.ink).strokeRect(r.x, r.y, r.w, r.h);
    return;
  }

  // Foundry riveted steel beam walls
  g.fillStyle(0x6d7b85).fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle(0x8e9ca6, 0.7).fillRect(r.x + 2, r.y + 2, r.w - 4, Math.min(5, r.h - 4));
  g.fillStyle(0x4e5962, 0.6).fillRect(
    r.x + 2,
    r.y + r.h - Math.min(5, r.h - 2),
    r.w - 4,
    Math.min(5, r.h - 2),
  );
  // Steel rivets along girder
  g.fillStyle(0x3a434a, 0.8);
  if (r.w >= r.h && r.w > 48) {
    for (let rx = r.x + 24; rx < r.x + r.w - 16; rx += 64)
      g.fillCircle(rx, r.y + r.h / 2, 3);
  } else if (r.h > 48) {
    for (let ry = r.y + 24; ry < r.y + r.h - 16; ry += 64)
      g.fillCircle(r.x + r.w / 2, ry, 3);
  }
  g.lineStyle(3.5, theme.ink).strokeRect(r.x, r.y, r.w, r.h);
}

export function drawBumper(
  g: Phaser.GameObjects.Graphics,
  v: { x: number; y: number; r: number; bounce?: number },
  courseId: string,
) {
  if (courseId === "shoreline" && v.bounce) {
    // Charming nautical lifebuoy ring bumper!
    g.fillStyle(0xfffdf5).fillCircle(v.x, v.y, v.r);
    g.fillStyle(0xee6c4d);
    for (let k = 0; k < 4; k++) {
      const a0 = k * (Math.PI / 2) - 0.28;
      const a1 = a0 + 0.56;
      g.slice(v.x, v.y, v.r, a0, a1, false);
      g.fillPath();
    }
    g.lineStyle(3.5, theme.ink).strokeCircle(v.x, v.y, v.r);
    g.fillStyle(0xf6e2a5).fillCircle(v.x, v.y, v.r * 0.42);
    g.lineStyle(2.5, theme.ink).strokeCircle(v.x, v.y, v.r * 0.42);
    return;
  }

  if (v.bounce) {
    // High-bounce spring bumper with glowing outer cushion
    g.fillStyle(0xf49b54).fillCircle(v.x, v.y, v.r);
    g.lineStyle(3.5, theme.ink).strokeCircle(v.x, v.y, v.r);
    g.fillStyle(0xffe19c).fillCircle(v.x, v.y, v.r * 0.62);
    g.fillStyle(0xfffdf5).fillCircle(v.x, v.y, v.r * 0.34);
    g.lineStyle(2, theme.ink).strokeCircle(v.x, v.y, v.r * 0.34);
    return;
  }

  // Solid metallic / dock bollard bumper
  g.fillStyle(0x58addb).fillCircle(v.x, v.y, v.r);
  g.fillStyle(0x88ccf0, 0.7).fillCircle(v.x - v.r * 0.22, v.y - v.r * 0.22, v.r * 0.35);
  g.lineStyle(3.5, theme.ink).strokeCircle(v.x, v.y, v.r);
  g.fillStyle(0xfffdf5).fillCircle(v.x, v.y, v.r * 0.38);
  g.lineStyle(2, theme.ink).strokeCircle(v.x, v.y, v.r * 0.38);
}

export function drawMoverTrackAndBody(
  g: Phaser.GameObjects.Graphics,
  c: Course,
  d: GolfDynamics,
) {
  for (let i = 0; i < c.movers.length; i++) {
    const spec = c.movers[i];
    const m = d.mover(i);
    // Faint patrol rail showing full travel range
    if (m.r) {
      g.lineStyle(
        4,
        c.id === "horizon" ? 0x9b8ec9 : 0x627358,
        c.id === "horizon" ? 0.3 : 0.28,
      ).lineBetween(spec.from.x, spec.from.y, spec.to.x, spec.to.y);
      // Cratered asteroid or carved rolling stone boulder
      const bodyCol = c.id === "horizon" ? 0x988fb0 : 0x8f9986;
      const craterCol = c.id === "horizon" ? 0x6c6382 : 0x67725f;
      g.fillStyle(bodyCol).fillCircle(m.x, m.y, m.r);
      const spin = d.time * 1.6 + i;
      g.fillStyle(craterCol, 0.8).fillCircle(
        m.x + Math.cos(spin) * m.r * 0.36,
        m.y + Math.sin(spin) * m.r * 0.36,
        m.r * 0.26,
      );
      g.fillStyle(craterCol, 0.65).fillCircle(
        m.x + Math.cos(spin + 2.3) * m.r * 0.42,
        m.y + Math.sin(spin + 2.3) * m.r * 0.42,
        m.r * 0.17,
      );
      g.fillStyle(0xfffdf5, 0.25).fillCircle(m.x - m.r * 0.28, m.y - m.r * 0.28, m.r * 0.28);
      g.lineStyle(4, theme.ink).strokeCircle(m.x, m.y, m.r);
    } else {
      const w = m.w!,
        h = m.h!;
      g.lineStyle(4, theme.ink, 0.16).lineBetween(
        spec.from.x + w / 2,
        spec.from.y + h / 2,
        spec.to.x + w / 2,
        spec.to.y + h / 2,
      );
      const fill = c.id === "shoreline" ? 0xf29352 : 0x58addb;
      g.fillStyle(fill).fillRoundedRect(m.x, m.y, w, h, 5);
      g.fillStyle(0xfffdf5, 0.3).fillRect(m.x + 4, m.y + 3, w - 8, 4);
      g.lineStyle(3.5, theme.ink).strokeRoundedRect(m.x, m.y, w, h, 5);
    }
  }
}

export function drawLaser(
  g: Phaser.GameObjects.Graphics,
  r: Rect & { phase: number },
  i: number,
  courseId: string,
  d: GolfDynamics,
) {
  const active = d.laser(i);
  const cycle = (d.time + r.phase) % 3;
  const warning = !active && cycle >= 1.2 && cycle < 1.6;
  const cx1 = r.x,
    cy1 = r.y,
    cx2 = r.x + r.w,
    cy2 = r.y + r.h;

  if (active) {
    // Vivid glowing danger beam + white-hot core
    g.fillStyle(0xff5a4f, 0.35).fillRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
    g.fillStyle(0xef4f45).fillRect(r.x, r.y, r.w, r.h);
    g.lineStyle(2.5, 0xfff5e8, 0.92).lineBetween(
      r.x + (r.w > r.h ? 4 : r.w / 2),
      r.y + (r.w > r.h ? r.h / 2 : 4),
      r.x + (r.w > r.h ? r.w - 4 : r.w / 2),
      r.y + (r.w > r.h ? r.h / 2 : r.h - 4),
    );
  } else if (warning) {
    const blink = 0.45 + 0.5 * Math.sin(d.time * 36);
    g.lineStyle(4, 0xf29f4b, blink).lineBetween(
      r.x + r.w * 0.5 * (r.w <= r.h ? 1 : 0),
      r.y + r.h * 0.5 * (r.w > r.h ? 1 : 0),
      r.x + r.w - r.w * 0.5 * (r.w <= r.h ? 1 : 0),
      r.y + r.h - r.h * 0.5 * (r.w > r.h ? 1 : 0),
    );
  } else {
    // Faint dashed standby beam line (never confused with a solid obstacle!)
    const segs = 8;
    const x0 = r.x + (r.w <= r.h ? r.w / 2 : 0);
    const y0 = r.y + (r.w > r.h ? r.h / 2 : 0);
    const x1 = r.x + (r.w <= r.h ? r.w / 2 : r.w);
    const y1 = r.y + (r.w > r.h ? r.h / 2 : r.h);
    g.lineStyle(2, 0xc76b63, 0.32);
    for (let k = 0; k < segs; k += 2) {
      const t0 = k / segs,
        t1 = (k + 1) / segs;
      g.lineBetween(
        x0 + (x1 - x0) * t0,
        y0 + (y1 - y0) * t0,
        x0 + (x1 - x0) * t1,
        y0 + (y1 - y0) * t1,
      );
    }
  }

  // Armored emitter nozzles at both ends
  const endA = {
    x: r.w > r.h ? cx1 : cx1 + r.w / 2,
    y: r.w > r.h ? cy1 + r.h / 2 : cy1,
  };
  const endB = {
    x: r.w > r.h ? cx2 : cx1 + r.w / 2,
    y: r.w > r.h ? cy1 + r.h / 2 : cy2,
  };
  const housing = courseId === "temple" ? 0x627356 : 0x454e58;
  for (const pt of [endA, endB]) {
    g.fillStyle(housing).fillCircle(pt.x, pt.y, 10);
    g.lineStyle(2.5, theme.ink).strokeCircle(pt.x, pt.y, 10);
    g.fillStyle(active ? 0xff5a4f : warning ? 0xf7bd4f : 0xcbd5db).fillCircle(
      pt.x,
      pt.y,
      4.5,
    );
  }
}

export function drawPortal(
  g: Phaser.GameObjects.Graphics,
  p: { from: Point; to: Point; angle: number },
  index: number,
  time: number,
) {
  const color = [theme.orange, theme.blue, 0xc98cf0][index] ?? theme.orange;
  // Entry vortex (swirling intake!)
  g.fillStyle(color, 0.25).fillCircle(p.from.x, p.from.y, 34);
  g.fillStyle(color).fillCircle(p.from.x, p.from.y, 26);
  g.lineStyle(3.5, theme.ink).strokeCircle(p.from.x, p.from.y, 26);
  g.fillStyle(0x1b152f).fillCircle(p.from.x, p.from.y, 16);
  // Rotating spiral arcs inside entry
  g.lineStyle(3, 0xfffdf5, 0.85);
  for (let arm = 0; arm < 3; arm++) {
    const a0 = time * 3.2 + (arm * Math.PI * 2) / 3;
    g.beginPath();
    g.arc(p.from.x, p.from.y, 11, a0, a0 + 1.15, false);
    g.strokePath();
  }

  // Exit emitter ring + bold pulsing directional launch chevrons!
  g.fillStyle(color, 0.18).fillCircle(p.to.x, p.to.y, 32);
  g.lineStyle(5.5, color).strokeCircle(p.to.x, p.to.y, 25);
  g.lineStyle(2, 0xfffdf5, 0.75).strokeCircle(p.to.x, p.to.y, 19);
  const rad = (p.angle * Math.PI) / 180;
  const dx = Math.cos(rad),
    dy = Math.sin(rad);
  const pulse = (time * 2.2) % 1;
  drawChevron(
    g,
    p.to.x + dx * (26 + pulse * 14),
    p.to.y + dy * (26 + pulse * 14),
    dx,
    dy,
    11,
    color,
    1 - pulse * 0.35,
    4.5,
  );
  drawChevron(
    g,
    p.to.x + dx * 18,
    p.to.y + dy * 18,
    dx,
    dy,
    9,
    0xfffdf5,
    0.9,
    3.5,
  );
}

export function drawFlagAndCup(
  g: Phaser.GameObjects.Graphics,
  hole: Point,
  portrait: boolean,
  time: number,
) {
  // Crisp white cup lip + dark cup interior
  g.fillStyle(0xfffdf5).fillCircle(hole.x, hole.y, 15);
  g.lineStyle(2.5, theme.ink).strokeCircle(hole.x, hole.y, 15);
  g.fillStyle(theme.ink).fillCircle(hole.x, hole.y, 11);

  // Upright flagpole in BOTH portrait (+90deg CW: screen UP = -x, RIGHT = -y) and landscape (UP = -y, RIGHT = +x)
  const ux = portrait ? -1 : 0;
  const uy = portrait ? 0 : -1;
  const rx = portrait ? 0 : 1;
  const ry = portrait ? -1 : 0;
  const flutter = Math.sin(time * 5.2) * 3.5;

  const poleH = 54;
  const topX = hole.x + ux * poleH;
  const topY = hole.y + uy * poleH;
  const midX = hole.x + ux * (poleH - 24);
  const midY = hole.y + uy * (poleH - 24);
  const tipX = hole.x + ux * (poleH - 12 + flutter * 0.4) + rx * 34;
  const tipY = hole.y + uy * (poleH - 12 + flutter * 0.4) + ry * 34;

  g.lineStyle(4.5, theme.ink).lineBetween(hole.x, hole.y, topX, topY);
  g.fillStyle(0xf28b49).fillTriangle(topX, topY, midX, midY, tipX, tipY);
  g.lineStyle(2.5, theme.ink).strokeTriangle(topX, topY, midX, midY, tipX, tipY);
  g.fillStyle(0xfffdf5).fillCircle(topX, topY, 4);
  g.lineStyle(2, theme.ink).strokeCircle(topX, topY, 4);
}
