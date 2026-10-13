import type { Player, Winner } from "../../../shared/contracts/GameResult";
import { WIN_LINES } from "../shared/lines";
export interface UltimateSave {
  version: 1;
  moves: number[];
}
/** Index = miniBoard * 9 + localCell. All legality and routing live here. */
export class UltimateBoard {
  cells: (Player | null)[] = Array(81).fill(null);
  boards: (Winner | null)[] = Array(9).fill(null);
  turn: Player = 1;
  forced: number | null = null;
  winner: Winner | null = null;
  line: readonly number[] | null = null;
  history: number[] = [];
  legal(move: number) {
    return (
      Number.isInteger(move) &&
      move >= 0 &&
      move < 81 &&
      !this.winner &&
      !this.cells[move] &&
      !this.boards[Math.floor(move / 9)] &&
      (this.forced === null || Math.floor(move / 9) === this.forced)
    );
  }
  legalMoves() {
    const out: number[] = [];
    if (this.winner) return out;
    for (let i = 0; i < 81; i++) if (this.legal(i)) out.push(i);
    return out;
  }
  play(move: number) {
    if (!this.legal(move)) return false;
    const b = Math.floor(move / 9),
      cell = move % 9,
      p = this.turn;
    this.cells[move] = p;
    this.history.push(move);
    if (
      WIN_LINES.some((line) => line.every((i) => this.cells[b * 9 + i] === p))
    )
      this.boards[b] = p;
    else if (this.cells.slice(b * 9, b * 9 + 9).every(Boolean))
      this.boards[b] = "draw";
    for (const line of WIN_LINES)
      if (line.every((i) => this.boards[i] === p)) {
        this.winner = p;
        this.line = line;
        break;
      }
    if (!this.winner && this.boards.every(Boolean)) this.winner = "draw";
    this.forced = this.boards[cell] ? null : cell;
    this.turn = p === 1 ? 2 : 1;
    return true;
  }
  clone() {
    const b = new UltimateBoard();
    b.cells = [...this.cells];
    b.boards = [...this.boards];
    b.turn = this.turn;
    b.forced = this.forced;
    b.winner = this.winner;
    b.line = this.line;
    b.history = [...this.history];
    return b;
  }
  save(): UltimateSave {
    return { version: 1, moves: [...this.history] };
  }
  static restore(data: unknown) {
    const b = new UltimateBoard(),
      d = data as Partial<UltimateSave>;
    if (d?.version !== 1 || !Array.isArray(d.moves) || d.moves.length > 81)
      return b;
    for (const move of d.moves) if (!b.play(move)) return new UltimateBoard();
    return b;
  }
  key() {
    return (
      this.cells.map((v) => v ?? 0).join("") +
      ":" +
      this.forced +
      ":" +
      this.turn
    );
  }
}
