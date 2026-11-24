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
export const GOLF_KEY_CODES = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "ShiftLeft",
  "ShiftRight",
  "Space",
] as const;
const MIN_KB_POWER = 0.09;
/** Conventional keyboard golf aiming: arrows/WASD aim & dial power, Shift fine-tunes, Space charges & releases. */
export class GolfKeyboardAim {
  active = false;
  angle = 0;
  power = 0.45;
  charging = false;
  chargePower = MIN_KB_POWER;
  private chargeDir = 1;
  private chargeTime = 0;
  private initialized = false;
  reset(ball: Point, hole: Point) {
    this.active = false;
    this.charging = false;
    this.power = 0.45;
    this.chargePower = MIN_KB_POWER;
    this.chargeDir = 1;
    this.chargeTime = 0;
    this.angle = Math.atan2(hole.y - ball.y, hole.x - ball.x);
    this.initialized = true;
  }
  cancel() {
    this.active = false;
    this.charging = false;
    this.chargeTime = 0;
  }
  beginCharge(ball: Point, hole: Point) {
    if (!this.initialized) this.reset(ball, hole);
    this.active = true;
    this.charging = true;
    this.chargePower = MIN_KB_POWER;
    this.chargeDir = 1;
    this.chargeTime = 0;
  }
  vector(power = this.charging ? this.chargePower : this.power) {
    const p = Math.max(MIN_KB_POWER, Math.min(1, power));
    const speed = p * MAX_SPEED;
    return {
      x: Math.cos(this.angle) * speed,
      y: Math.sin(this.angle) * speed,
      power: p,
    };
  }
  step(
    dt: number,
    held: ReadonlySet<string>,
    ball: Point,
    hole: Point,
  ): ReturnType<typeof shotVector> | null {
    const left = held.has("ArrowLeft") || held.has("KeyA");
    const right = held.has("ArrowRight") || held.has("KeyD");
    const up = held.has("ArrowUp") || held.has("KeyW");
    const down = held.has("ArrowDown") || held.has("KeyS");
    const fine = held.has("ShiftLeft") || held.has("ShiftRight");
    if (left || right || up || down) {
      if (!this.initialized) this.reset(ball, hole);
      this.active = true;
      const turnSpeed = fine ? 0.44 : 1.9;
      if (left) this.angle -= turnSpeed * dt;
      if (right) this.angle += turnSpeed * dt;
      if (!this.charging) {
        const powerSpeed = fine ? 0.28 : 0.72;
        if (up) this.power = Math.min(1, this.power + powerSpeed * dt);
        if (down)
          this.power = Math.max(MIN_KB_POWER, this.power - powerSpeed * dt);
      }
    }
    if (this.charging) {
      if (held.has("Space")) {
        const rate = fine ? 0.45 : 0.92;
        this.chargeTime += dt;
        this.chargePower += this.chargeDir * rate * dt;
        if (this.chargePower >= 1) {
          this.chargePower = 1;
          this.chargeDir = -1;
        } else if (this.chargePower <= MIN_KB_POWER) {
          this.chargePower = MIN_KB_POWER;
          this.chargeDir = 1;
        }
      } else {
        const releasePower =
          this.chargeTime < 0.055 ? this.power : this.chargePower;
        const shot = this.vector(releasePower);
        this.charging = false;
        this.active = false;
        this.chargeTime = 0;
        return shot;
      }
    }
    return null;
  }
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
