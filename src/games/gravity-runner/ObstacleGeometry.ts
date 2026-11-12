import type { Obstacle } from "./RunnerPhysics";
export interface Point {
  x: number;
  y: number;
}
/** Canonical world geometry for both rendering and human/AI collision. */
export function obstacleBounds(o: Obstacle, age: number) {
  let depth = o.depth;
  const angle = (age * Math.PI * 2) / (o.period ?? 3.6) + (o.phase ?? 0),
    sine = Math.sin(angle),
    wave = (1 + sine) / 2;
  if (o.kind === "jet") depth *= 0.2 + wave * 0.8;
  if (o.motion === "piston")
    depth = o.depth * (0.12 + 0.88 * wave * wave * (3 - 2 * wave));
  const active = o.kind !== "phase" || wave > 0.25;
  let low = o.side === -1 ? 0 : o.side === 1 ? 170 - depth : 85 - depth / 2;
  if (o.motion === "across") low += sine * (o.range ?? 30);
  const start = o.motion === "along" ? o.x + (o.range ?? 20) * (1 + sine) : o.x;
  const end =
    start + o.width - (o.motion === "along" ? 2 * (o.range ?? 20) : 0);
  const warning =
    (o.kind === "phase" && !active && wave > 0.06 && Math.cos(angle) > 0) ||
    (o.motion === "piston" && wave < 0.35 && Math.cos(angle) > 0);
  return { low, high: low + depth, active, warning, start, end };
}
export function obstacleOutline(o: Obstacle, age: number): Point[] {
  const { low, high, start: x, end } = obstacleBounds(o, age),
    width = end - x,
    mid = (x + end) / 2;
  if (o.kind === "crystal") {
    const base = o.side === 1 ? high : low,
      tip = o.side === 1 ? low : high;
    return [
      { x, y: (low + high) / 2 },
      { x: mid, y: tip },
      { x: end, y: (low + high) / 2 },
      { x: mid, y: base },
    ];
  }
  if (o.kind === "icicle") {
    const base = o.side === 1 ? high : low,
      tip = o.side === 1 ? low : high;
    return [
      { x, y: base },
      { x: mid, y: tip },
      { x: end, y: base },
    ];
  }
  if (o.kind === "root") {
    const base = o.side === 1 ? high : low,
      tip = o.side === 1 ? low : high;
    return [
      { x, y: base },
      { x: x + width * 0.18, y: tip },
      { x: x + width * 0.82, y: tip },
      { x: end, y: base },
    ];
  }
  if (o.kind === "bramble" && o.side !== 0) {
    const base = o.side === 1 ? high : low,
      sign = o.side === 1 ? -1 : 1,
      depth = high - low;
    return [
      { x, y: base },
      { x: x + width * 0.12, y: base + sign * depth * 0.65 },
      { x: mid, y: base + sign * depth },
      { x: end - width * 0.12, y: base + sign * depth * 0.65 },
      { x: end, y: base },
    ];
  }
  if (o.kind === "buoy" || o.kind === "bramble") {
    return Array.from({ length: 8 }, (_, i) => ({
      x: mid + (Math.cos((i * Math.PI) / 4) * width) / 2,
      y: (low + high) / 2 + (Math.sin((i * Math.PI) / 4) * (high - low)) / 2,
    }));
  }
  return [
    { x, y: low },
    { x: end, y: low },
    { x: end, y: high },
    { x, y: high },
  ];
}
/** SAT between the runner's 26×18 footprint and convex trap geometry. */
export function touchesTrap(
  o: Obstacle,
  distance: number,
  y: number,
  age: number,
) {
  const b = obstacleBounds(o, age);
  if (distance + 13 < b.start || distance - 13 > b.end) return false;
  if (!b.active || y + 9 <= b.low + 0.001 || y - 9 >= b.high - 0.001)
    return false;
  if (!["icicle", "crystal", "root", "buoy", "bramble"].includes(o.kind))
    return true;
  const polygon = obstacleOutline(o, age);
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i],
      b = polygon[(i + 1) % polygon.length],
      nx = -(b.y - a.y),
      ny = b.x - a.x;
    let lo = Infinity,
      hi = -Infinity;
    for (const p of polygon) {
      const dot = p.x * nx + p.y * ny;
      lo = Math.min(lo, dot);
      hi = Math.max(hi, dot);
    }
    const center = distance * nx + y * ny,
      radius = 13 * Math.abs(nx) + 9 * Math.abs(ny);
    if (center + radius <= lo + 0.001 || center - radius >= hi - 0.001)
      return false;
  }
  return true;
}
