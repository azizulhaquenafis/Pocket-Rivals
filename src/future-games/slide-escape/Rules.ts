export interface Piece {
  x: number;
  y: number;
  n: number;
  vertical: boolean;
}
export interface Move {
  piece: number;
  delta: number;
}
const base: Piece[] = [
  { x: 4, y: 2, n: 2, vertical: false },
  { x: 2, y: 0, n: 2, vertical: true },
  { x: 3, y: 3, n: 3, vertical: true },
  { x: 0, y: 3, n: 2, vertical: true },
  { x: 1, y: 0, n: 2, vertical: true },
  { x: 0, y: 5, n: 2, vertical: false },
  { x: 4, y: 0, n: 2, vertical: true },
  { x: 4, y: 4, n: 2, vertical: false },
  { x: 0, y: 0, n: 2, vertical: true },
];
export function canMove(pieces: Piece[], index: number, delta: number) {
  const p = pieces[index];
  if (!p || !Number.isInteger(delta)) return false;
  const step = Math.sign(delta);
  for (let k = step; k !== delta + step; k += step) {
    const x = p.x + (p.vertical ? 0 : k),
      y = p.y + (p.vertical ? k : 0);
    if (
      x < 0 ||
      y < 0 ||
      x + (p.vertical ? 1 : p.n) > 6 ||
      y + (p.vertical ? p.n : 1) > 6
    )
      return false;
    for (let j = 0; j < pieces.length; j++)
      if (j !== index) {
        const q = pieces[j];
        if (
          x < q.x + (q.vertical ? 1 : q.n) &&
          x + (p.vertical ? 1 : p.n) > q.x &&
          y < q.y + (q.vertical ? q.n : 1) &&
          y + (p.vertical ? p.n : 1) > q.y
        )
          return false;
      }
  }
  return delta !== 0;
}
export function apply(pieces: Piece[], i: number, d: number) {
  const p = pieces[i];
  if (p.vertical) p.y += d;
  else p.x += d;
}
export function puzzle(level: number) {
  let seed = 3571 + level * 191;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  const pieces = base.map((p) => ({ ...p })),
    history: Move[] = [];
  apply(pieces, 0, -4);
  history.push({ piece: 0, delta: -4 });
  let best: Piece[] | undefined = pieces.map((p) => ({ ...p })),
    bestHistory: Move[] = [...history],
    value = 8;
  for (let k = 0; k < 600 + level * 100; k++) {
    const options: Move[] = [];
    for (let i = 0; i < pieces.length; i++)
      for (const d of [-1, 1])
        if (canMove(pieces, i, d)) options.push({ piece: i, delta: d });
    const move = options[Math.floor(random() * options.length)];
    apply(pieces, move.piece, move.delta);
    history.push(move);
    const target = pieces[0],
      blockers = pieces
        .slice(1)
        .filter(
          (p) => p.vertical && p.x >= target.x + 2 && p.y <= 2 && p.y + p.n > 2,
        ).length;
    const quality = (4 - target.x) * 2 + blockers * 3;
    if (
      target.x <= 2 &&
      (quality > value || (quality === value && random() < 0.12))
    ) {
      value = quality;
      best = pieces.map((p) => ({ ...p }));
      bestHistory = history.map((m) => ({ ...m }));
    }
  }
  return {
    pieces: best ?? pieces,
    solution: bestHistory
      .reverse()
      .map((m) => ({ piece: m.piece, delta: -m.delta })),
  };
}
export class SlideWorld {
  level = 0;
  pieces: Piece[];
  selected = 0;
  moves = 0;
  score = 0;
  done = false;
  cleared = false;
  history: Move[] = [];
  constructor() {
    this.pieces = puzzle(0).pieces;
  }
  move(i: number, d: number) {
    if (this.done || this.cleared || !canMove(this.pieces, i, d)) return false;
    apply(this.pieces, i, d);
    this.selected = i;
    this.moves++;
    this.history.push({ piece: i, delta: d });
    if (this.pieces[0].x === 4) {
      this.cleared = true;
      this.score += Math.max(100, 1000 - this.moves * 15);
    }
    return true;
  }
  undo() {
    if (this.done || this.cleared) return;
    const m = this.history.pop();
    if (m) {
      apply(this.pieces, m.piece, -m.delta);
      this.moves--;
    }
  }
  retry() {
    if (this.done || this.cleared) return;
    this.pieces = puzzle(this.level).pieces;
    this.moves = 0;
    this.history = [];
  }
  next() {
    if (!this.cleared || this.done) return;
    if (++this.level === 8) {
      this.done = true;
      return;
    }
    this.pieces = puzzle(this.level).pieces;
    this.selected = 0;
    this.moves = 0;
    this.history = [];
    this.cleared = false;
  }
}
