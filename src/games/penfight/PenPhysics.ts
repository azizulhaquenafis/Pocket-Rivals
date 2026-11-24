export interface Desk {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export const DESK: Desk = { left: 43, right: 377, top: 180, bottom: 594 };
const SLIDE_FRICTION = 220;
export const HALF = 34,
  RADIUS = 8,
  MAX_SPEED = 410,
  INERTIA = 610;
export interface Pen {
  x: number;
  y: number;
  a: number;
  vx: number;
  vy: number;
  w: number;
  out: boolean;
}
export interface Shot {
  angle: number;
  power: number;
  offset: number;
}
const OPENINGS = [
  { x: 210, y: 466, a: 0 },
  { x: 181, y: 459, a: 0.32 },
  { x: 235, y: 455, a: -0.42 },
  { x: 194, y: 449, a: 0.82 },
] as const;

export function pens(round = 1): [Pen, Pen] {
  const { x, y, a } = OPENINGS[(round - 1) % OPENINGS.length];
  const rest = { vx: 0, vy: 0, w: 0, out: false };
  return [
    { x, y, a, ...rest },
    {
      x: DESK.left + DESK.right - x,
      y: DESK.top + DESK.bottom - y,
      a: a + Math.PI,
      ...rest,
    },
  ];
}
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
export function touchDistance(p: Pen, x: number, y: number) {
  const u = clamp(
    (x - p.x) * Math.cos(p.a) + (y - p.y) * Math.sin(p.a),
    -HALF,
    HALF,
  );
  return Math.hypot(x - p.x - Math.cos(p.a) * u, y - p.y - Math.sin(p.a) * u);
}
export function strike(p: Pen, shot: Shot) {
  if (
    ![shot.angle, shot.power, shot.offset].every(Number.isFinite) ||
    p.out ||
    shot.power <= 0
  )
    return false;
  const offset = clamp(shot.offset, -HALF, HALF);
  // One energy budget: tip flicks trade translation for rotation, rather than
  // adding free rotational energy on top of a full-strength centre flick.
  const lever = offset * Math.sin(shot.angle - p.a);
  const speed =
    (clamp(shot.power, 0, 1) * MAX_SPEED) /
    Math.sqrt(1 + (lever * lever) / INERTIA);
  p.vx = Math.cos(shot.angle) * speed;
  p.vy = Math.sin(shot.angle) * speed;
  p.w = clamp(
    (offset * (Math.cos(p.a) * p.vy - Math.sin(p.a) * p.vx)) / INERTIA,
    -14,
    14,
  );
  return true;
}
/** Closest points on two centre segments, including parallel/collinear pens. */
function contacts(a: Pen, b: Pen) {
  // A broad parallel contact is a small manifold. Its midpoint avoids an
  // artificial end hit (and torque) when two straight pens meet face-on.
  const ac = Math.cos(a.a),
    as = Math.sin(a.a),
    bc = Math.cos(b.a),
    bs = Math.sin(b.a);
  const alignment = Math.abs(ac * bc + as * bs);
  if (alignment > 0.985) {
    const along = (b.x - a.x) * ac + (b.y - a.y) * as;
    const lo = Math.max(-HALF, along - HALF * alignment),
      hi = Math.min(HALF, along + HALF * alignment);
    if (lo <= hi) {
      const ax = a.x + (ac * (lo + hi)) / 2,
        ay = a.y + (as * (lo + hi)) / 2;
      const t = clamp((ax - b.x) * bc + (ay - b.y) * bs, -HALF, HALF);
      return { ax, ay, bx: b.x + bc * t, by: b.y + bs * t };
    }
  }
  const ax = a.x - Math.cos(a.a) * HALF,
    ay = a.y - Math.sin(a.a) * HALF;
  const bx = b.x - Math.cos(b.a) * HALF,
    by = b.y - Math.sin(b.a) * HALF;
  const ux = Math.cos(a.a) * HALF * 2,
    uy = Math.sin(a.a) * HALF * 2;
  const vx = Math.cos(b.a) * HALF * 2,
    vy = Math.sin(b.a) * HALF * 2;
  const wx = ax - bx,
    wy = ay - by,
    d = ux * ux + uy * uy;
  const e = vx * vx + vy * vy,
    uv = ux * vx + uy * vy;
  const uw = ux * wx + uy * wy,
    vw = vx * wx + vy * wy;
  const denom = d * e - uv * uv;
  let s = denom > 1e-8 ? clamp((uv * vw - e * uw) / denom, 0, 1) : 0;
  let t = (uv * s + vw) / e;
  if (t < 0) {
    t = 0;
    s = clamp(-uw / d, 0, 1);
  } else if (t > 1) {
    t = 1;
    s = clamp((uv - uw) / d, 0, 1);
  }
  return { ax: ax + ux * s, ay: ay + uy * s, bx: bx + vx * t, by: by + vy * t };
}
/** Small fixed steps keep relative travel below a pen's width, even at full power. */
export function physicsStep(bodies: [Pen, Pen], dt: number, desk = DESK) {
  let impact = 0;
  for (const p of bodies)
    if (!p.out) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.a += p.w * dt;
      const speed = Math.hypot(p.vx, p.vy),
        next = Math.max(0, speed - SLIDE_FRICTION * dt);
      if (speed > 0) {
        p.vx *= next / speed;
        p.vy *= next / speed;
      }
      p.w = Math.sign(p.w) * Math.max(0, Math.abs(p.w) - 7 * dt);
      checkEdge(p, desk);
    }
  const [a, b] = bodies;
  if (a.out || b.out) return impact;
  const c = contacts(a, b),
    dx = c.bx - c.ax,
    dy = c.by - c.ay,
    distance = Math.hypot(dx, dy);
  if (distance >= RADIUS * 2) return impact;
  const fallback = Math.hypot(b.x - a.x, b.y - a.y);
  const nx =
    distance > 1e-7
      ? dx / distance
      : fallback > 1e-7
        ? (b.x - a.x) / fallback
        : -Math.sin(a.a);
  const ny =
    distance > 1e-7
      ? dy / distance
      : fallback > 1e-7
        ? (b.y - a.y) / fallback
        : Math.cos(a.a);
  const rx = (c.ax + c.bx) / 2,
    ry = (c.ay + c.by) / 2;
  const arx = rx - a.x,
    ary = ry - a.y,
    brx = rx - b.x,
    bry = ry - b.y;
  const overlap = Math.max(0, RADIUS * 2 - distance - 0.005) * 0.5;
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;
  const rvx = b.vx - b.w * bry - a.vx + a.w * ary;
  const rvy = b.vy + b.w * brx - a.vy - a.w * arx;
  const normalSpeed = rvx * nx + rvy * ny;
  checkEdge(a, desk);
  checkEdge(b, desk);
  if (normalSpeed >= 0) return impact;
  const ca = arx * ny - ary * nx,
    cb = brx * ny - bry * nx;
  const j = -(1.52 * normalSpeed) / (2 + (ca * ca + cb * cb) / INERTIA);
  const tx = -ny,
    ty = nx,
    ta = arx * ty - ary * tx,
    tb = brx * ty - bry * tx;
  const jt = clamp(
    -(rvx * tx + rvy * ty) / (2 + (ta * ta + tb * tb) / INERTIA),
    -j * 0.18,
    j * 0.18,
  );
  const ix = nx * j + tx * jt,
    iy = ny * j + ty * jt;
  a.vx -= ix;
  a.vy -= iy;
  b.vx += ix;
  b.vy += iy;
  a.w -= (arx * iy - ary * ix) / INERTIA;
  b.w += (brx * iy - bry * ix) / INERTIA;
  impact = j;
  return impact;
}
export function stopped(p: Pen) {
  return p.out || (Math.hypot(p.vx, p.vy) < 1 && Math.abs(p.w) < 0.02);
}
export function checkEdge(p: Pen, desk: Desk) {
  if (edgeDistance(p, desk) < 0) p.out = true;
}

export function edgeDistance(p: Pen, desk = DESK) {
  return Math.min(
    p.x - desk.left,
    desk.right - p.x,
    p.y - desk.top,
    desk.bottom - p.y,
  );
}
