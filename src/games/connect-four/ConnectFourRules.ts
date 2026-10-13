import type { Player, Winner } from "../../shared/contracts/GameResult";
export const FOUR_LINES: number[][] = [];
for (let y = 0; y < 6; y++)
  for (let x = 0; x < 7; x++)
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 1],
    ]) {
      const xx = x + 3 * dx,
        yy = y + 3 * dy;
      if (xx >= 0 && xx < 7 && yy < 6)
        FOUR_LINES.push(
          Array.from({ length: 4 }, (_, i) => (y + i * dy) * 7 + x + i * dx),
        );
    }
export class ConnectFourBoard {
  cells: (Player | null)[] = Array(42).fill(null);
  turn: Player = 1;
  winner: Winner | null = null;
  line: number[] | null = null;
  history: number[] = [];
  legal() {
    return this.winner
      ? []
      : [3, 2, 4, 1, 5, 0, 6].filter((c) => this.cells[c] === null);
  }
  drop(column: number) {
    if (
      this.winner ||
      !Number.isInteger(column) ||
      column < 0 ||
      column > 6 ||
      this.cells[column] !== null
    )
      return -1;
    let row = 5;
    while (this.cells[row * 7 + column] !== null) row--;
    const index = row * 7 + column;
    this.cells[index] = this.turn;
    this.history.push(column);
    this.line =
      FOUR_LINES.find((l) => l.every((i) => this.cells[i] === this.turn)) ??
      null;
    if (this.line) this.winner = this.turn;
    else if (this.history.length === 42) this.winner = "draw";
    this.turn = this.turn === 1 ? 2 : 1;
    return index;
  }
  undo() {
    const c = this.history.pop();
    if (c === undefined) return;
    for (let r = 0; r < 6; r++)
      if (this.cells[r * 7 + c] !== null) {
        this.cells[r * 7 + c] = null;
        break;
      }
    this.turn = this.turn === 1 ? 2 : 1;
    this.winner = null;
    this.line = null;
  }
  save() {
    return { version: 1, moves: [...this.history] };
  }
  static restore(data: unknown) {
    const fresh = new ConnectFourBoard();
    if (!data || typeof data !== "object") return fresh;
    const d = data as { version?: number; moves?: unknown };
    if (d.version !== 1 || !Array.isArray(d.moves) || d.moves.length > 42)
      return fresh;
    const b = new ConnectFourBoard();
    for (const c of d.moves)
      if (typeof c !== "number" || b.drop(c) < 0) return fresh;
    return b;
  }
}
