import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import type { Obstacle } from "./RunnerPhysics";
import type { RunnerMap } from "./Maps";
import { obstacleBounds, obstacleOutline } from "./ObstacleGeometry";
/** Trap silhouettes are the same polygons used by collision, including jet/orbit motion. */
export function drawTrap(
  g: Phaser.GameObjects.Graphics,
  o: Obstacle,
  map: RunnerMap,
  distance: number,
  age: number,
) {
  const sy = (x: number) => 548 - (x - distance) * 1.05,
    sx = (y: number) => 84 + (y * 252) / 170,
    scaleX = 252 / 170;
  const bounds = obstacleBounds(o, age),
    top = sy(bounds.end),
    bottom = sy(bounds.start);
  const x = sx(bounds.low),
    w = (bounds.high - bounds.low) * scaleX,
    cx = x + w / 2,
    mid = (top + bottom) / 2;
  const polygon = obstacleOutline(o, age).map((p) => ({
    x: sx(p.y),
    y: sy(p.x),
  }));
  const color =
    o.kind === "snowball"
      ? 0xd6f3ff
      : o.kind === "spore"
        ? 0x89b86c
        : o.kind === "jelly"
          ? 0x6dd3eb
          : o.kind === "orb"
            ? 0xa47be0
            : map.id === "ice"
              ? 0xb6e3ef
              : map.id === "green"
                ? 0x7d9e66
                : map.id === "blue"
                  ? 0x56b5d5
                  : 0xb29ace;
  if (o.motion) {
    // Fine guide tracks and fixed sockets distinguish mechanisms from solid cover.
    g.lineStyle(2, map.rail, 0.55);
    if (o.motion === "along")
      g.lineBetween(
        sx((bounds.low + bounds.high) / 2),
        sy(o.x),
        sx((bounds.low + bounds.high) / 2),
        sy(o.x + o.width),
      );
    else if (o.motion === "across")
      g.lineBetween(
        sx(85 - (o.range ?? 34)),
        mid,
        sx(85 + (o.range ?? 34)),
        mid,
      );
    else if (o.motion === "orbit") {
      const baseY = o.side === -1 ? 52 : o.side === 1 ? 118 : 85,
        rx = (o.range ?? 24) * 1.05,
        ry = (o.crossRange ?? 46) * scaleX,
        anchorX = sx(baseY),
        anchorY = sy(o.x + o.width / 2);
      g.lineStyle(2, map.rail, 0.45).strokeEllipse(
        anchorX,
        anchorY,
        ry * 2,
        rx * 2,
      );
      g.fillStyle(map.rail, 0.55).fillCircle(anchorX, anchorY, 4);
      g.lineStyle(1.5, map.rail, 0.4).lineBetween(anchorX, anchorY, cx, mid);
    } else {
      const base = sx(o.side === 1 ? 170 : 0);
      g.lineStyle(7, map.rail).lineBetween(base, top, base, bottom);
    }
  }
  if (bounds.active)
    g.fillStyle(o.kind === "root" ? 0x9c7960 : color).fillPoints(polygon, true);
  g.lineStyle(
    3,
    bounds.warning ? 0xd4934f : theme.ink,
    bounds.active || bounds.warning ? 1 : 0.25,
  ).strokePoints(polygon, true);
  if (o.kind === "snowball") {
    // Spinning cryo-orb with frosty star facets.
    const r = Math.min(w, bottom - top) * 0.34,
      spin = age * 3.4 + (o.phase ?? 0);
    g.lineStyle(2.5, 0x6cb8d8, 0.9);
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI) / 3;
      g.lineBetween(
        cx - Math.cos(a) * r,
        mid - Math.sin(a) * r,
        cx + Math.cos(a) * r,
        mid + Math.sin(a) * r,
      );
    }
    g.fillStyle(0xffffff, 0.9).fillCircle(cx, mid, 4.5);
    g.lineStyle(1.5, theme.ink).strokeCircle(cx, mid, 4.5);
    return;
  }
  if (o.kind === "spore") {
    // Rotating thorny vine-spore with warm golden core.
    const r = Math.min(w, bottom - top) * 0.42,
      spin = age * 2.6 + (o.phase ?? 0);
    g.lineStyle(2.5, 0x45633c);
    for (let i = 0; i < 6; i++) {
      const a = spin + (i * Math.PI) / 3;
      g.lineBetween(
        cx + Math.cos(a) * (r * 0.45),
        mid + Math.sin(a) * (r * 0.45),
        cx + Math.cos(a) * (r * 0.95),
        mid + Math.sin(a) * (r * 0.95),
      );
    }
    g.fillStyle(0xf6cc65).fillCircle(cx, mid, 6);
    g.lineStyle(2, theme.ink).strokeCircle(cx, mid, 6);
    return;
  }
  if (o.kind === "jelly") {
    // Pulsing electric jellyfish with swaying tentacles and glossy dome.
    g.fillStyle(0xe6fcff, 0.85).fillEllipse(cx - 4, mid - 5, w * 0.36, 6);
    g.fillStyle(theme.ink)
      .fillCircle(cx - 4, mid - 1, 2)
      .fillCircle(cx + 4, mid - 1, 2);
    g.lineStyle(2.5, 0x3b8fb2, 0.9);
    for (const dx of [-6, 0, 6]) {
      const sway = Math.sin(age * 10 + dx + (o.phase ?? 0)) * 3.5;
      g.lineBetween(cx + dx, mid + 6, cx + dx + sway, bottom + 6);
    }
    return;
  }
  if (o.kind === "orb") {
    // Orbiting void prism drone with glowing inner diamond.
    const r = Math.min(w, bottom - top) * 0.32,
      spin = -age * 3.2 + (o.phase ?? 0);
    const inner = Array.from({ length: 4 }, (_, i) => {
      const a = spin + (i * Math.PI) / 2;
      return { x: cx + Math.cos(a) * r, y: mid + Math.sin(a) * r };
    });
    g.fillStyle(0xf2dcff, 0.95).fillPoints(inner, true);
    g.lineStyle(1.8, theme.ink).strokePoints(inner, true);
    g.fillStyle(0xf49b58).fillCircle(cx, mid, 3.2);
    return;
  }
  if (o.motion) {
    g.fillStyle(bounds.warning ? 0xef8b58 : map.detail).fillCircle(cx, mid, 4);
    g.lineStyle(1.5, theme.ink).strokeCircle(cx, mid, 4);
  }
  if (o.kind === "crystal") {
    g.lineStyle(2, map.detail, 0.9)
      .lineBetween(polygon[0].x, polygon[0].y, polygon[2].x, polygon[2].y)
      .lineBetween(polygon[1].x, polygon[1].y, polygon[3].x, polygon[3].y);
  } else if (o.kind === "icicle") {
    const base = sx(o.side === 1 ? bounds.high : bounds.low),
      tip = sx(o.side === 1 ? bounds.low : bounds.high);
    g.lineStyle(2, map.detail, 0.85)
      .lineBetween(base, top + 4, tip + (base - tip) * 0.25, mid)
      .lineBetween(base, mid, tip, mid)
      .lineBetween(base, bottom - 4, tip + (base - tip) * 0.25, mid);
  } else if (o.kind === "ice-block") {
    g.lineStyle(2, 0xf1fcff, 0.85)
      .strokeRect(x + 5, top + 5, w - 10, bottom - top - 10)
      .lineBetween(x + 5, top + 5, x + w - 5, bottom - 5);
  } else if (o.kind === "root" || o.kind === "bramble") {
    g.lineStyle(3, 0x4b6a49).lineBetween(
      x + w * 0.25,
      top + 6,
      x + w * 0.65,
      bottom - 6,
    );
    for (let y = top + 12; y < bottom - 5; y += 15) {
      g.lineStyle(2, 0x4b6a49).lineBetween(x + w * 0.45, y, x + w * 0.8, y + 6);
      g.fillStyle(0xc8dc8a).fillEllipse(x + w * 0.72, y + 3, 9, 5);
    }
  } else if (o.kind === "jet") {
    g.lineStyle(2, 0xddf9ff, 0.85);
    for (let y = top + 8; y < bottom - 4; y += 12)
      g.lineBetween(x + 3, y, x + w - 3, y + 3);
    const base = o.side === 1 ? sx(170) : sx(0);
    g.lineStyle(5, map.rail).lineBetween(base, top + 2, base, bottom - 2);
  } else if (o.kind === "buoy") {
    g.lineStyle(4, 0xfaf3d7).lineBetween(x + 5, mid, x + w - 5, mid);
    g.fillStyle(map.rail).fillCircle(cx, mid, 5);
  } else if (o.kind === "phase") {
    g.lineStyle(
      2,
      bounds.active ? 0xf4d8ff : 0x927ca9,
      bounds.active ? 0.85 : 0.35,
    );
    for (let y = top + 8; y < bottom - 4; y += 11)
      g.lineBetween(x + 5, y, x + w - 5, y + 4);
    if (bounds.active) g.fillStyle(0xf4d8ff, 0.9).fillCircle(cx, mid, 4);
  }
}
