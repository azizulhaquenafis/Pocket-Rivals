export const WIDTH = 320,
  HEIGHT = 460,
  RADIUS = 15,
  GRAVITY = 650,
  FLAP = -195;
export interface Bird {
  x: number;
  y: number;
  vy: number;
  direction: -1 | 1;
  alive: boolean;
  cooldown: number;
  bounces: number;
  flapSerial: number;
  recovery: number;
  hitX: number;
  hitY: number;
}
export interface Wall {
  rows: number[];
  window: number;
  version: number;
  pending?: { rows: number[]; window: number; remaining: number };
}
export const rowY = (index: number) => 44 + index * 44;
function segmentDistance(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax,
    dy = by - ay,
    t = Math.max(
      0,
      Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)),
    );
  return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
}
export function spikeCollision(x: number, y: number, side: 0 | 1, row: number) {
  const cx = side === 0 ? x : WIDTH - x,
    cy = y - rowY(row);
  if (cx > 18 + RADIUS || Math.abs(cy) > 16 + RADIUS) return false;
  if (cx >= 0 && cx <= 18 && Math.abs(cy) <= 16 * (1 - cx / 18)) return true;
  return (
    Math.min(
      segmentDistance(cx, cy, 0, -16, 18, 0),
      segmentDistance(cx, cy, 18, 0, 0, 16),
      segmentDistance(cx, cy, 0, 16, 0, -16),
    ) <=
    RADIUS * RADIUS
  );
}
/** Shared arena physics: no rule exemptions for AI, no bird-to-bird collision. */
export function advanceBird(
  p: Bird,
  dt: number,
  speed: number,
  walls: readonly Wall[],
): 0 | 1 | null {
  if (!p.alive) return null;
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.x += p.direction * speed * dt;
  p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.y - RADIUS < 16 || p.y + RADIUS > HEIGHT - 16) {
    p.alive = false;
    return null;
  }
  for (const side of [0, 1] as const)
    if (walls[side].rows.some((row) => spikeCollision(p.x, p.y, side, row))) {
      p.alive = false;
      return null;
    }
  if (p.x <= RADIUS) {
    p.x = RADIUS;
    p.direction = 1;
    p.bounces++;
    return 0;
  }
  if (p.x >= WIDTH - RADIUS) {
    p.x = WIDTH - RADIUS;
    p.direction = -1;
    p.bounces++;
    return 1;
  }
  return null;
}
