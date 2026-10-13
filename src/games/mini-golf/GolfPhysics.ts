import { COURSE_WIDTH as W, COURSE_HEIGHT as H, type Course } from "./courses";
export interface GolfBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  holed: boolean;
}
export const BALL_RADIUS = 7,
  FRICTION = 65,
  MAX_POWER = 600;
export function newBall(course: Course): GolfBall {
  return { ...course.start, vx: 0, vy: 0, holed: false };
}
export function moving(ball: GolfBall) {
  return Math.hypot(ball.vx, ball.vy) > 0;
}
export function shoot(ball: GolfBall, angle: number, power: number) {
  if (
    ball.holed ||
    moving(ball) ||
    !Number.isFinite(angle + power) ||
    power < 20
  )
    return false;
  const v = Math.min(MAX_POWER, power);
  ball.vx = Math.cos(angle) * v;
  ball.vy = Math.sin(angle) * v;
  return true;
}
export function golfStep(
  b: GolfBall,
  c: Course,
  dt: number,
  impact: () => void = () => {},
) {
  if (b.holed || !moving(b)) return;
  // Limit the travelled distance to half a ball radius, even in trajectory simulations.
  const count = Math.max(
      1,
      Math.ceil((Math.hypot(b.vx, b.vy) * dt) / (BALL_RADIUS * 0.5)),
    ),
    sub = dt / count;
  for (let k = 0; k < count; k++) {
    b.x += b.vx * sub;
    b.y += b.vy * sub;
    const bounce = (nx: number, ny: number) => {
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) {
        b.vx -= 1.82 * dot * nx;
        b.vy -= 1.82 * dot * ny;
        impact();
      }
    };
    for (let iteration = 0; iteration < 2; iteration++) {
      if (b.x < BALL_RADIUS) {
        b.x = BALL_RADIUS;
        bounce(1, 0);
      }
      if (b.x > W - BALL_RADIUS) {
        b.x = W - BALL_RADIUS;
        bounce(-1, 0);
      }
      if (b.y < BALL_RADIUS) {
        b.y = BALL_RADIUS;
        bounce(0, 1);
      }
      if (b.y > H - BALL_RADIUS) {
        b.y = H - BALL_RADIUS;
        bounce(0, -1);
      }
      for (const o of c.obstacles) {
        const px = Math.max(o.x, Math.min(o.x + o.w, b.x)),
          py = Math.max(o.y, Math.min(o.y + o.h, b.y)),
          dx = b.x - px,
          dy = b.y - py,
          d = Math.hypot(dx, dy);
        if (d >= BALL_RADIUS) continue;
        if (d > 0.00001) {
          const nx = dx / d,
            ny = dy / d;
          b.x = px + nx * (BALL_RADIUS + 0.01);
          b.y = py + ny * (BALL_RADIUS + 0.01);
          bounce(nx, ny);
        } else {
          const sides = [
            {
              d: b.x - o.x,
              x: o.x - BALL_RADIUS - 0.01,
              y: b.y,
              nx: -1,
              ny: 0,
            },
            {
              d: o.x + o.w - b.x,
              x: o.x + o.w + BALL_RADIUS + 0.01,
              y: b.y,
              nx: 1,
              ny: 0,
            },
            {
              d: b.y - o.y,
              x: b.x,
              y: o.y - BALL_RADIUS - 0.01,
              nx: 0,
              ny: -1,
            },
            {
              d: o.y + o.h - b.y,
              x: b.x,
              y: o.y + o.h + BALL_RADIUS + 0.01,
              nx: 0,
              ny: 1,
            },
          ].sort((a, b) => a.d - b.d);
          const p = sides[0];
          b.x = p.x;
          b.y = p.y;
          bounce(p.nx, p.ny);
        }
      }
    }
    let speed = Math.hypot(b.vx, b.vy);
    if (Math.hypot(b.x - c.hole.x, b.y - c.hole.y) < 11 && speed < 150) {
      b.x = c.hole.x;
      b.y = c.hole.y;
      b.vx = b.vy = 0;
      b.holed = true;
      return;
    }
    const next = Math.max(0, speed - FRICTION * sub);
    if (next < 8) {
      b.vx = b.vy = 0;
    } else {
      b.vx *= next / speed;
      b.vy *= next / speed;
    }
  }
}
export function simulate(
  course: Course,
  ball: GolfBall,
  angle: number,
  power: number,
) {
  const b = { ...ball, vx: 0, vy: 0 };
  shoot(b, angle, power);
  for (let i = 0; i < 1500 && moving(b); i++) golfStep(b, course, 1 / 120);
  return b;
}
