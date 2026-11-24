/** Original casting profiles. Cached area-based fills keep volume and visuals aligned. */
export type MoldPoint = { x: number; y: number };
const shapes: number[][][] = [
  [
    [-0.5, 0],
    [0.5, 0],
    [0.37, 1],
    [-0.37, 1],
  ],
  [
    [-0.5, 0],
    [0.5, 0],
    [0.5, 0.65],
    [0.2, 1],
    [-0.2, 1],
    [-0.5, 0.65],
  ],
  [
    [-0.5, 0],
    [0.5, 0],
    [0.5, 0.25],
    [0.3, 0.4],
    [0.5, 0.6],
    [0.3, 1],
    [-0.3, 1],
    [-0.5, 0.6],
    [-0.3, 0.4],
    [-0.5, 0.25],
  ],
  [
    [-0.5, 0],
    [0.5, 0],
    [0.42, 0.55],
    [0, 1],
    [-0.42, 0.55],
  ],
];
export function area(p: MoldPoint[]) {
  return (
    Math.abs(
      p.reduce((sum, a, i) => {
        const b = p[(i + 1) % p.length];
        return sum + a.x * b.y - b.x * a.y;
      }, 0),
    ) / 2
  );
}
function below(p: MoldPoint[], y: number) {
  const out: MoldPoint[] = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length],
      inside = a.y >= y,
      next = b.y >= y;
    if (inside) out.push(a);
    if (inside !== next) {
      const t = (y - a.y) / (b.y - a.y);
      out.push({ x: a.x + (b.x - a.x) * t, y });
    }
  }
  return out;
}
export const MOLDS = shapes.map((shape) => {
  const outline = shape.map(([x, y]) => ({ x, y })),
    total = area(outline);
  const fills = Array.from({ length: 101 }, (_, v) => {
    if (v === 0) return { y: 1, points: [] as MoldPoint[] };
    if (v === 100) return { y: 0, points: outline };
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      if (area(below(outline, mid)) / total > v / 100) lo = mid;
      else hi = mid;
    }
    const y = (lo + hi) / 2;
    return { y, points: below(outline, y) };
  });
  return { outline, fills };
});
