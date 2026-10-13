export const boxes = Array.from({ length: 16 }, (_, i) => {
  const r = Math.floor(i / 4),
    c = i % 4;
  return [r * 4 + c, (r + 1) * 4 + c, 20 + r * 5 + c, 21 + r * 5 + c];
});
export const adjacent = Array.from({ length: 40 }, (_, i) =>
  boxes.flatMap((b, j) => (b.includes(i) ? [j] : [])),
);
export class DotsBoard {
  edges = Array<number>(40).fill(0);
  owners = Array<number>(16).fill(0);
  turn: 1 | 2 = 1;
  history: number[] = [];
  scores: [number, number] = [0, 0];
  winner: 1 | 2 | "draw" | null = null;
  legal() {
    return this.edges.flatMap((v, i) => (v === 0 ? [i] : []));
  }
  play(edge: number) {
    if (
      this.winner ||
      !Number.isInteger(edge) ||
      edge < 0 ||
      edge >= 40 ||
      this.edges[edge]
    )
      return -1;
    this.edges[edge] = this.turn;
    this.history.push(edge);
    let gained = 0;
    for (const box of adjacent[edge])
      if (!this.owners[box] && boxes[box].every((e) => this.edges[e])) {
        this.owners[box] = this.turn;
        this.scores[this.turn - 1]++;
        gained++;
      }
    if (this.scores[0] + this.scores[1] === 16)
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
    const b = new DotsBoard();
    b.edges = [...this.edges];
    b.owners = [...this.owners];
    b.turn = this.turn;
    b.history = [...this.history];
    b.scores = [...this.scores];
    b.winner = this.winner;
    return b;
  }
  save() {
    return { history: [...this.history] };
  }
  static restore(value: unknown) {
    const b = new DotsBoard();
    if (
      !value ||
      typeof value !== "object" ||
      !Array.isArray((value as any).history)
    )
      return b;
    const h = (value as any).history;
    if (h.length > 40) return b;
    for (const e of h) if (b.play(e) < 0) return new DotsBoard();
    return b;
  }
}
export function edgeEnds(edge: number) {
  if (edge < 20) {
    const x = 60 + (edge % 4) * 75,
      y = 240 + Math.floor(edge / 4) * 75;
    return { x, y, x2: x + 75, y2: y };
  }
  const i = edge - 20,
    x = 60 + (i % 5) * 75,
    y = 240 + Math.floor(i / 5) * 75;
  return { x, y, x2: x, y2: y + 75 };
}
export function pickEdge(x: number, y: number) {
  let best = -1,
    distance = 21;
  for (let e = 0; e < 40; e++) {
    const p = edgeEnds(e),
      dx = p.x2 - p.x,
      dy = p.y2 - p.y,
      t = Math.max(
        0.14,
        Math.min(0.86, ((x - p.x) * dx + (y - p.y) * dy) / 5625),
      ),
      d = Math.hypot(x - p.x - t * dx, y - p.y - t * dy);
    if (d < distance) {
      best = e;
      distance = d;
    }
  }
  return best;
}
