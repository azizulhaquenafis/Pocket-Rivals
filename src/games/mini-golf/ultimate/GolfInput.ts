import type { Point } from "./courses";
import { MAX_SPEED } from "./GolfCollision";
/** Original pullback power, independent of pointer type and render resolution. */
export function shotVector(start: Point, end: Point) {
  let x = (start.x - end.x) * 3.125,
    y = (start.y - end.y) * 3.125;
  const speed = Math.hypot(x, y);
  if (speed > MAX_SPEED) {
    x *= MAX_SPEED / speed;
    y *= MAX_SPEED / speed;
  }
  return { x, y, power: Math.min(1, speed / MAX_SPEED) };
}
/** Rotate the original landscape world clockwise into a true 9:16 portrait viewport. */
export class GolfView {
  readonly bounds = { x: 66, y: 123, w: 288, h: 512 };
  zoom = 1;
  center: Point = { x: 960, y: 540 };
  get scale() {
    return (this.bounds.h / 1920) * this.zoom;
  }
  project(p: Point) {
    const s = this.scale;
    return {
      x: 210 - (p.y - this.center.y) * s,
      y: 379 + (p.x - this.center.x) * s,
    };
  }
  unproject(p: Point) {
    const s = this.scale;
    return {
      x: this.center.x + (p.y - 379) / s,
      y: this.center.y - (p.x - 210) / s,
    };
  }
  contains(p: Point) {
    const r = this.bounds;
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }
  focus(p: Point) {
    this.zoom = this.zoom === 1 ? 2.5 : 1;
    this.follow(p, 1);
  }
  follow(p: Point, blend: number) {
    const target = this.zoom === 1 ? { x: 960, y: 540 } : p;
    const halfX = 960 / this.zoom,
      halfY = 540 / this.zoom;
    const x = Math.max(halfX, Math.min(1920 - halfX, target.x)),
      y = Math.max(halfY, Math.min(1080 - halfY, target.y));
    this.center.x += (x - this.center.x) * blend;
    this.center.y += (y - this.center.y) * blend;
  }
}
