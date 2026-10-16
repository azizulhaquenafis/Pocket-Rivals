import type Phaser from "phaser";
import { theme } from "../../core/ThemeManager";
import type { Obstacle } from "./RunnerPhysics";
import type { RunnerMap } from "./Maps";
import { obstacleBounds, obstacleOutline } from "./ObstacleGeometry";
/** Trap silhouettes are the same polygons used by collision, including jet motion. */
export function drawTrap(
  g: Phaser.GameObjects.Graphics,
  o: Obstacle,
  map: RunnerMap,
  distance: number,
  age: number,
) {
  const sy = (x: number) => 548 - (x - distance) * 1.05,
    sx = (y: number) => 84 + (y * 252) / 170;
  const bounds = obstacleBounds(o, age),
    top = sy(o.x + o.width),
    bottom = sy(o.x);
  const x = sx(bounds.low),
    w = ((bounds.high - bounds.low) * 252) / 170,
    mid = (top + bottom) / 2;
  const polygon = obstacleOutline(o, age).map((p) => ({
    x: sx(p.y),
    y: sy(p.x),
  }));
  const color =
    map.id === "ice"
      ? 0xb6e3ef
      : map.id === "green"
        ? 0x7d9e66
        : map.id === "blue"
          ? 0x56b5d5
          : 0xb29ace;
  if (bounds.active)
    g.fillStyle(o.kind === "root" ? 0x9c7960 : color).fillPoints(polygon, true);
  g.lineStyle(
    3,
    bounds.warning ? 0xd4934f : theme.ink,
    bounds.active || bounds.warning ? 1 : 0.25,
  ).strokePoints(polygon, true);
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
    g.fillStyle(map.rail).fillCircle(x + w / 2, mid, 5);
  } else if (o.kind === "phase") {
    g.lineStyle(
      2,
      bounds.active ? 0xf4d8ff : 0x927ca9,
      bounds.active ? 0.85 : 0.35,
    );
    for (let y = top + 8; y < bottom - 4; y += 11)
      g.lineBetween(x + 5, y, x + w - 5, y + 4);
    if (bounds.active) g.fillStyle(0xf4d8ff, 0.9).fillCircle(x + w / 2, mid, 4);
  }
}
