export function createBoxes(size: number): number[][] {
  const H = (size + 1) * size;
  return Array.from({ length: size * size }, (_, i) => {
    const r = Math.floor(i / size),
      c = i % size;
    return [
      r * size + c,
      (r + 1) * size + c,
      H + r * (size + 1) + c,
      H + r * (size + 1) + c + 1,
    ];
  });
}

export function createAdjacent(totalEdges: number, boxesList: number[][]): number[][] {
  return Array.from({ length: totalEdges }, (_, i) =>
    boxesList.flatMap((b, j) => (b.includes(i) ? [j] : [])),
  );
}

const BOXES_BY_SIZE: Record<number, number[][]> = {
  4: createBoxes(4),
  5: createBoxes(5),
  6: createBoxes(6),
};

const ADJACENT_BY_SIZE: Record<number, number[][]> = {
  4: createAdjacent(40, BOXES_BY_SIZE[4]),
  5: createAdjacent(60, BOXES_BY_SIZE[5]),
  6: createAdjacent(84, BOXES_BY_SIZE[6]),
};

export const boxes = BOXES_BY_SIZE[4];
export const adjacent = ADJACENT_BY_SIZE[4];

export class DotsBoard {
  readonly size: number;
  readonly horizontalCount: number;
  readonly totalEdges: number;
  readonly totalBoxes: number;
  readonly boxes: number[][];
  readonly adjacent: number[][];
  edges: number[];
  owners: number[];
  turn: 1 | 2 = 1;
  history: number[] = [];
  scores: [number, number] = [0, 0];
  winner: 1 | 2 | "draw" | null = null;

  constructor(size: number = 4) {
    this.size = size === 5 || size === 6 ? size : 4;
    this.horizontalCount = (this.size + 1) * this.size;
    this.totalEdges = 2 * this.horizontalCount;
    this.totalBoxes = this.size * this.size;
    this.boxes = BOXES_BY_SIZE[this.size] ?? createBoxes(this.size);
    this.adjacent =
      ADJACENT_BY_SIZE[this.size] ??
      createAdjacent(this.totalEdges, this.boxes);
    this.edges = Array<number>(this.totalEdges).fill(0);
    this.owners = Array<number>(this.totalBoxes).fill(0);
  }

  legal() {
    return this.edges.flatMap((v, i) => (v === 0 ? [i] : []));
  }

  play(edge: number) {
    if (
      this.winner ||
      !Number.isInteger(edge) ||
      edge < 0 ||
      edge >= this.totalEdges ||
      this.edges[edge]
    )
      return -1;
    this.edges[edge] = this.turn;
    this.history.push(edge);
    let gained = 0;
    for (const box of this.adjacent[edge])
      if (!this.owners[box] && this.boxes[box].every((e) => this.edges[e])) {
        this.owners[box] = this.turn;
        this.scores[this.turn - 1]++;
        gained++;
      }
    if (this.scores[0] + this.scores[1] === this.totalBoxes)
      this.winner =
        this.scores[0] === this.scores[1]
          ? "draw"
          : this.scores[0] > this.scores[1]
            ? 1
            : 2;
    else if (!gained) this.turn = this.turn === 1 ? 2 : 1;
    return gained;
  }

  clone() {
    const b = new DotsBoard(this.size);
    b.edges = [...this.edges];
    b.owners = [...this.owners];
    b.turn = this.turn;
    b.history = [...this.history];
    b.scores = [...this.scores];
    b.winner = this.winner;
    return b;
  }

  save() {
    return { history: [...this.history], size: this.size };
  }

  static restore(value: unknown, fallbackSize = 4) {
    const size =
      value &&
      typeof value === "object" &&
      typeof (value as any).size === "number"
        ? (value as any).size
        : fallbackSize;
    const b = new DotsBoard(size);
    if (
      !value ||
      typeof value !== "object" ||
      !Array.isArray((value as any).history)
    )
      return b;
    const h = (value as any).history;
    if (h.length > b.totalEdges) return b;
    for (const e of h) if (b.play(e) < 0) return new DotsBoard(size);
    return b;
  }
}

export function edgeEnds(edge: number, size = 4) {
  const H = (size + 1) * size,
    spacing = 300 / size;
  if (edge < H) {
    const x = 60 + (edge % size) * spacing,
      y = 240 + Math.floor(edge / size) * spacing;
    return { x, y, x2: x + spacing, y2: y };
  }
  const i = edge - H,
    stride = size + 1,
    x = 60 + (i % stride) * spacing,
    y = 240 + Math.floor(i / stride) * spacing;
  return { x, y, x2: x, y2: y + spacing };
}

export function pickEdge(x: number, y: number, size = 4) {
  const H = (size + 1) * size,
    totalEdges = 2 * H,
    spacing = 300 / size,
    spacingSq = spacing * spacing,
    threshold = 21 * (spacing / 75);
  let best = -1,
    distance = threshold;
  for (let e = 0; e < totalEdges; e++) {
    const p = edgeEnds(e, size),
      dx = p.x2 - p.x,
      dy = p.y2 - p.y,
      t = Math.max(
        0.14,
        Math.min(0.86, ((x - p.x) * dx + (y - p.y) * dy) / spacingSq),
      ),
      d = Math.hypot(x - p.x - t * dx, y - p.y - t * dy);
    if (d < distance) {
      best = e;
      distance = d;
    }
  }
  return best;
}
