export const EXTENTS = {
  ring: 88,
  triangle: 114,
  shutters: 50,
  square: 93,
  wave: 33,
};
export type Shape = keyof typeof EXTENTS;

interface Point {
  x: number;
  y: number;
}

interface Vertex extends Point {
  distance: number;
}

export interface Contour {
  vertices: readonly Vertex[];
  length: number;
  closed: boolean;
}

function contour(points: Point[], closed = false): Contour {
  if (closed) points.push(points[0]);
  let distance = 0;
  const vertices = points.map((point, i) => {
    if (i)
      distance += Math.hypot(
        point.x - points[i - 1].x,
        point.y - points[i - 1].y,
      );
    return { ...point, distance };
  });
  return {
    vertices,
    length: distance,
    closed,
  };
}

function polygon(sides: number, radius: number) {
  return contour(
    Array.from({ length: sides }, (_, i) => {
      const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }),
    true,
  );
}

export const CONTOURS: Record<Shape, readonly Contour[]> = {
  ring: [polygon(48, EXTENTS.ring)],
  triangle: [polygon(3, EXTENTS.triangle)],
  square: [polygon(4, EXTENTS.square)],
  shutters: [
    contour([
      { x: -132, y: -EXTENTS.shutters },
      { x: 132, y: -EXTENTS.shutters },
    ]),
    contour([
      { x: -132, y: EXTENTS.shutters },
      { x: 132, y: EXTENTS.shutters },
    ]),
  ],
  wave: [
    contour(
      Array.from({ length: 25 }, (_, i) => {
        const x = -132 + i * 11;
        return { x, y: Math.sin(x / 43) * EXTENTS.wave };
      }),
    ),
  ],
};

export const wrap = (value: number, period: number) =>
  value - Math.floor(value / period) * period;

/** The edge ending at or immediately after a distance along the contour. */
export function edgeAt(path: Contour, distance: number) {
  let low = 1;
  let high = path.vertices.length - 1;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (path.vertices[mid].distance < distance) low = mid + 1;
    else high = mid;
  }
  return low;
}

export function pointAt(path: Contour, distance: number): Point {
  const index = edgeAt(path, distance);
  const a = path.vertices[index - 1];
  const b = path.vertices[index];
  const t = (distance - a.distance) / (b.distance - a.distance);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
