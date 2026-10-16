import { MAPS } from "./Maps";
export const SIZE = 320,
  RADIUS = 9,
  SPEED = 160,
  SHAFT = 72;
export type Point = { x: number; y: number };
export type Block = Point & { w: number; h: number };
export type Side = 0 | 1 | 2 | 3;
export const BLOCKS: readonly Block[] = MAPS[0].blocks;
export const laneCenter = (lane: number) => 40 + lane * 80;
export function clearPoint(
  p: Point,
  margin = RADIUS + 0.5,
  blocks: readonly Block[] = BLOCKS,
) {
  return (
    p.x >= margin &&
    p.x <= SIZE - margin &&
    p.y >= margin &&
    p.y <= SIZE - margin &&
    blocks.every(
      (b) =>
        p.x < b.x - margin ||
        p.x > b.x + b.w + margin ||
        p.y < b.y - margin ||
        p.y > b.y + b.h + margin,
    )
  );
}
/** Each physical shaft stops at the first block in its lane. */
export function attackDepth(
  side: Side,
  lane: number,
  blocks: readonly Block[] = BLOCKS,
) {
  const c = laneCenter(lane);
  let depth = SIZE;
  for (const b of blocks) {
    const low = side < 2 ? b.y : b.x,
      high = low + (side < 2 ? b.h : b.w);
    if (c + SHAFT / 2 <= low || c - SHAFT / 2 >= high) continue;
    const face =
      side === 0
        ? b.x
        : side === 1
          ? SIZE - b.x - b.w
          : side === 2
            ? b.y
            : SIZE - b.y - b.h;
    depth = Math.min(depth, face);
  }
  return depth;
}
export function localPoint(p: Point, side: Side): Point {
  return side === 0
    ? p
    : side === 1
      ? { x: SIZE - p.x, y: p.y }
      : side === 2
        ? { x: p.y, y: p.x }
        : { x: SIZE - p.y, y: p.x };
}
function segmentDistance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    den = dx * dx + dy * dy;
  const t = den
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den))
    : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
/** Circle against shaft plus triangular tip, in edge-local coordinates. */
export function pistonHits(
  p: Point,
  side: Side,
  lane: number,
  length: number,
  radius = RADIUS,
) {
  if (length <= 0) return false;
  const q = localPoint(p, side),
    c = laneCenter(lane),
    base = length - 14;
  if (
    q.x + radius < 0 ||
    q.x - radius > length ||
    Math.abs(q.y - c) > SHAFT / 2 + radius
  )
    return false;
  const nearX = Math.max(0, Math.min(base, q.x)),
    nearY = Math.max(c - SHAFT / 2, Math.min(c + SHAFT / 2, q.y));
  if (base > 0 && Math.hypot(q.x - nearX, q.y - nearY) <= radius) return true;
  const a = { x: base, y: c - SHAFT / 2 },
    b = { x: length, y: c },
    d = { x: base, y: c + SHAFT / 2 };
  if (
    q.x >= base &&
    q.x <= length &&
    Math.abs(q.y - c) <= ((SHAFT / 2) * (length - q.x)) / 14
  )
    return true;
  return (
    Math.min(
      segmentDistance(q, a, b),
      segmentDistance(q, b, d),
      segmentDistance(q, d, a),
    ) <= radius
  );
}
export function safeFrom(
  p: Point,
  side: Side,
  margin = 0.5,
  blocks: readonly Block[] = BLOCKS,
) {
  return (
    clearPoint(p, RADIUS + 0.5, blocks) &&
    [0, 1, 2, 3].every(
      (l) =>
        !pistonHits(p, side, l, attackDepth(side, l, blocks), RADIUS + margin),
    )
  );
}
/** Bounded substeps prevent tunnelling; separate axes slide against block faces. */
export function movePlayer(
  p: Point,
  dx: number,
  dy: number,
  dt: number,
  blocks: readonly Block[] = BLOCKS,
) {
  const len = Math.hypot(dx, dy);
  if (!len) return;
  const distance = Math.min(SPEED * dt, len),
    parts = Math.max(1, Math.ceil(distance / 3));
  const sx = ((dx / len) * distance) / parts,
    sy = ((dy / len) * distance) / parts;
  for (let i = 0; i < parts; i++) {
    const oldX = p.x,
      oldY = p.y;
    p.x = Math.max(RADIUS, Math.min(SIZE - RADIUS, p.x + sx));
    for (const b of blocks)
      if (
        p.y > b.y - RADIUS &&
        p.y < b.y + b.h + RADIUS &&
        p.x > b.x - RADIUS &&
        p.x < b.x + b.w + RADIUS
      )
        p.x =
          oldX <= b.x - RADIUS
            ? b.x - RADIUS
            : oldX >= b.x + b.w + RADIUS
              ? b.x + b.w + RADIUS
              : oldX;
    p.y = Math.max(RADIUS, Math.min(SIZE - RADIUS, p.y + sy));
    for (const b of blocks)
      if (
        p.x > b.x - RADIUS &&
        p.x < b.x + b.w + RADIUS &&
        p.y > b.y - RADIUS &&
        p.y < b.y + b.h + RADIUS
      )
        p.y =
          oldY <= b.y - RADIUS
            ? b.y - RADIUS
            : oldY >= b.y + b.h + RADIUS
              ? b.y + b.h + RADIUS
              : oldY;
  }
}
