export interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  omega: number;
  facing: 1 | -1;
  alive: boolean;
  grounded: boolean;
}
export const INERTIA = 560;
export function terrain(x: number) {
  const d = (x - 170) / 48;
  return 260 - (Math.abs(d) < 1 ? 25 * (1 - d * d) ** 2 : 0);
}
export function point(c: Car, x: number, y: number) {
  const cs = Math.cos(c.angle),
    sn = Math.sin(c.angle);
  return { x: c.x + x * cs - y * sn, y: c.y + x * sn + y * cs };
}
export function head(c: Car) {
  return point(c, -c.facing * 5, -22);
}
export function colliders(c: Car) {
  return [
    [-14, 0, 12],
    [14, 0, 12],
    [-21, 12, 10],
    [21, 12, 10],
  ].map(([x, y, r]) => ({ ...point(c, x, y), r }));
}
function impulse(
  c: Car,
  x: number,
  y: number,
  nx: number,
  ny: number,
  j: number,
) {
  c.vx += nx * j;
  c.vy += ny * j;
  c.omega += (((x - c.x) * ny - (y - c.y) * nx) * j) / INERTIA;
}
export function integrate(c: Car, input: number, dt: number) {
  if (!c.alive) return;
  input = Math.max(-1, Math.min(1, input));
  c.vx += input * (c.grounded ? 145 : 35) * dt;
  c.vy += 520 * dt;
  c.omega -= input * (c.grounded ? 1.1 : 3.2) * dt;
  c.vx *= Math.exp(-0.65 * dt);
  c.omega *= Math.exp(-0.65 * dt);
  c.vx = Math.max(-180, Math.min(180, c.vx));
  c.vy = Math.max(-260, Math.min(300, c.vy));
  c.omega = Math.max(-5, Math.min(5, c.omega));
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  c.angle += c.omega * dt;
  c.angle = Math.atan2(Math.sin(c.angle), Math.cos(c.angle));
  c.grounded = false;
  for (let pass = 0; pass < 3; pass++)
    for (const q of colliders(c)) {
      const floor = terrain(q.x),
        depth = q.y + q.r - floor;
      if (depth > 0) {
        c.grounded = true;
        const slope = (terrain(q.x + 0.1) - terrain(q.x - 0.1)) / 0.2,
          norm = Math.hypot(slope, 1),
          nx = slope / norm,
          ny = -1 / norm;
        c.x += nx * depth * 0.6;
        c.y += ny * depth * 0.6;
        const rx = q.x - c.x,
          ry = q.y - c.y,
          vn = (c.vx - c.omega * ry) * nx + (c.vy + c.omega * rx) * ny;
        if (vn < 0) {
          const lever = rx * ny - ry * nx;
          impulse(c, q.x, q.y, nx, ny, -vn / (1 + (lever * lever) / INERTIA));
        }
      }
      if (q.x - q.r < 0) {
        c.x += -(q.x - q.r);
        if (c.vx < 0) c.vx = -c.vx * 0.25;
      }
      if (q.x + q.r > 340) {
        c.x -= q.x + q.r - 340;
        if (c.vx > 0) c.vx = -c.vx * 0.25;
      }
    }
  const h = head(c);
  if (h.y + 7 >= terrain(h.x) || h.x - 7 < 0 || h.x + 7 > 340) c.alive = false;
}
export function collide(a: Car, b: Car) {
  const ah = head(a),
    bh = head(b),
    ac = colliders(a),
    bc = colliders(b);
  if (bc.some((q) => Math.hypot(q.x - ah.x, q.y - ah.y) < q.r + 7))
    a.alive = false;
  if (ac.some((q) => Math.hypot(q.x - bh.x, q.y - bh.y) < q.r + 7))
    b.alive = false;
  if (Math.hypot(ah.x - bh.x, ah.y - bh.y) < 14) {
    a.alive = false;
    b.alive = false;
  }
  for (const p of ac)
    for (const q of bc) {
      const dx = q.x - p.x,
        dy = q.y - p.y,
        d = Math.hypot(dx, dy),
        over = p.r + q.r - d;
      if (over <= 0) continue;
      const nx = d ? dx / d : 1,
        ny = d ? dy / d : 0;
      a.x -= nx * over * 0.26;
      a.y -= ny * over * 0.26;
      b.x += nx * over * 0.26;
      b.y += ny * over * 0.26;
      const arx = p.x - a.x,
        ary = p.y - a.y,
        brx = q.x - b.x,
        bry = q.y - b.y,
        relative =
          (b.vx - b.omega * bry - a.vx + a.omega * ary) * nx +
          (b.vy + b.omega * brx - a.vy - a.omega * arx) * ny;
      if (relative < 0) {
        const la = arx * ny - ary * nx,
          lb = brx * ny - bry * nx,
          j = (-1.25 * relative) / (2 + (la * la + lb * lb) / INERTIA);
        impulse(a, p.x, p.y, -nx, -ny, j);
        impulse(b, q.x, q.y, nx, ny, j);
      }
    }
}
