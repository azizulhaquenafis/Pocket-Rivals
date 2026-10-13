import type { Point, Rect } from "./courses";
import { MAX_SPEED } from "./GolfCollision";
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
/** One uniform transform, independent of the responsive UI and physical simulation. */
export class GolfView {
  bounds: Rect = { x: 16, y: 64, w: 388, h: 624 };
  zoom = 1;
  targetZoom = 1;
  center: Point = { x: 960, y: 575 };
  get portrait() {
    return this.bounds.h >= this.bounds.w;
  }
  get baseScale() {
    return this.portrait
      ? Math.min(this.bounds.w / 1010, this.bounds.h / 1920)
      : Math.min(this.bounds.w / 1920, this.bounds.h / 1010);
  }
  get scale() {
    return this.baseScale * this.zoom;
  }
  get origin() {
    return {
      x: this.bounds.x + this.bounds.w / 2,
      y: this.bounds.y + this.bounds.h / 2,
    };
  }
  get angle() {
    return this.portrait ? Math.PI / 2 : 0;
  }
  project(p: Point) {
    const s = this.scale,
      o = this.origin;
    return this.portrait
      ? {
          x: o.x - (p.y - this.center.y) * s,
          y: o.y + (p.x - this.center.x) * s,
        }
      : {
          x: o.x + (p.x - this.center.x) * s,
          y: o.y + (p.y - this.center.y) * s,
        };
  }
  unproject(p: Point) {
    const s = this.scale,
      o = this.origin;
    return this.portrait
      ? {
          x: this.center.x + (p.y - o.y) / s,
          y: this.center.y - (p.x - o.x) / s,
        }
      : {
          x: this.center.x + (p.x - o.x) / s,
          y: this.center.y + (p.y - o.y) / s,
        };
  }
  contains(p: Point) {
    const r = this.bounds;
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }
  configure(bounds: Rect) {
    this.bounds = { ...bounds };
  }
  focus(_p: Point) {
    this.targetZoom = this.targetZoom === 1 ? this.focusZoom() : 1;
  }
  private focusZoom() {
    return Math.max(2.2, Math.min(4, 0.78 / this.baseScale));
  }
  get focused() {
    return this.targetZoom > 1;
  }
  get transitioning() {
    return Math.abs(this.zoom - this.targetZoom) > 0.015;
  }
  follow(p: Point, blend: number) {
    this.zoom += (this.targetZoom - this.zoom) * blend;
    if (Math.abs(this.zoom - this.targetZoom) < 0.001)
      this.zoom = this.targetZoom;
    const s = this.scale;
    const hx = (this.portrait ? this.bounds.h : this.bounds.w) / (2 * s),
      hy = (this.portrait ? this.bounds.w : this.bounds.h) / (2 * s);
    const target = this.focused ? p : { x: 960, y: 575 };
    const x = hx >= 960 ? 960 : Math.max(hx, Math.min(1920 - hx, target.x));
    const y =
      hy >= 505 ? 575 : Math.max(70 + hy, Math.min(1080 - hy, target.y));
    this.center.x += (x - this.center.x) * blend;
    this.center.y += (y - this.center.y) * blend;
  }
}
