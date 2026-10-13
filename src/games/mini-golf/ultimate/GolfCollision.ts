import type { Point, Rect } from "./courses";
export interface Ball extends Point {
  vx: number;
  vy: number;
}
export const RADIUS = 7,
  MAX_SPEED = 650;
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export const inside = (p: Point, r: Rect) =>
  p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function cap(b: Ball) {
  const s = Math.hypot(b.vx, b.vy);
  if (s > MAX_SPEED) {
    b.vx *= MAX_SPEED / s;
    b.vy *= MAX_SPEED / s;
  }
}
export function overlaps(b: Point, r: Rect, radius = RADIUS) {
  return (
    Math.hypot(
      b.x - clamp(b.x, r.x, r.x + r.w),
      b.y - clamp(b.y, r.y, r.y + r.h),
    ) < radius
  );
}
function reflect(b: Ball, nx: number, ny: number, vx = 0, vy = 0, e = 1) {
  const rx = b.vx - vx,
    ry = b.vy - vy,
    dot = rx * nx + ry * ny;
  if (dot >= 0) return false;
  b.vx = (rx - 2 * dot * nx) * e + vx;
  b.vy = (ry - 2 * dot * ny) * e + vy;
  cap(b);
  return true;
}
export function hitRect(b: Ball, r: Rect, vx = 0, vy = 0) {
  let cx = clamp(b.x, r.x, r.x + r.w),
    cy = clamp(b.y, r.y, r.y + r.h),
    nx = b.x - cx,
    ny = b.y - cy,
    d = Math.hypot(nx, ny);
  if (d >= RADIUS) return false;
  if (d < 1e-9) {
    const sides = [b.x - r.x, r.x + r.w - b.x, b.y - r.y, r.y + r.h - b.y],
      side = sides.indexOf(Math.min(...sides));
    nx = side === 0 ? -1 : side === 1 ? 1 : 0;
    ny = side === 2 ? -1 : side === 3 ? 1 : 0;
    cx = side === 0 ? r.x : side === 1 ? r.x + r.w : b.x;
    cy = side === 2 ? r.y : side === 3 ? r.y + r.h : b.y;
  } else {
    nx /= d;
    ny /= d;
  }
  b.x = cx + nx * (RADIUS + 0.001);
  b.y = cy + ny * (RADIUS + 0.001);
  const hit = reflect(b, nx, ny, vx, vy);
  if (hit && vx && Math.abs(ny) < 1e-6) {
    b.vy += ((b.y < r.y + r.h / 2 ? -1 : 1) * Math.abs(vx)) / 2;
    cap(b);
  }
  return hit;
}
export function hitCircle(b: Ball, c: Point, r: number, e = 1, vx = 0, vy = 0) {
  const d = distance(b, c);
  if (d >= r + RADIUS) return false;
  const nx = d > 1e-8 ? (b.x - c.x) / d : 0,
    ny = d > 1e-8 ? (b.y - c.y) / d : -1;
  b.x = c.x + nx * (r + RADIUS + 0.001);
  b.y = c.y + ny * (r + RADIUS + 0.001);
  return reflect(b, nx, ny, vx, vy, e);
}
export function hitRotated(
  b: Ball,
  c: Point,
  w: number,
  h: number,
  angle: number,
  spin = 0,
) {
  const co = Math.cos(angle),
    si = Math.sin(angle),
    dx = b.x - c.x,
    dy = b.y - c.y;
  const local: Ball = {
    x: dx * co + dy * si,
    y: -dx * si + dy * co,
    vx: 0,
    vy: 0,
  };
  const before = { x: local.x, y: local.y };
  hitRect(local, { x: -w / 2, y: -h / 2, w, h });
  if (local.x === before.x && local.y === before.y) return false;
  const nx = local.x - before.x,
    ny = local.y - before.y,
    d = Math.hypot(nx, ny),
    wx = (nx * co - ny * si) / d,
    wy = (nx * si + ny * co) / d;
  b.x = c.x + local.x * co - local.y * si;
  b.y = c.y + local.x * si + local.y * co;
  const ax = b.x - c.x - wx * RADIUS,
    ay = b.y - c.y - wy * RADIUS;
  return reflect(b, wx, wy, -ay * spin, ax * spin);
}
