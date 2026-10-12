import type { Player, Winner } from "../../../shared/contracts/GameModule";
import {WIN_LINES} from "../shared/lines";
export {WIN_LINES};
export class TicTacToeBoard {
  cells: (Player | null)[] = Array(9).fill(null);
  turn: Player = 1;
  winner: Winner | null = null;
  line: readonly number[] | null = null;
  history:number[]=[];
  save(){return {version:1,moves:[...this.history]};}
  static restore(data:unknown){const board=new TicTacToeBoard();const d=data as {version?:number;moves?:unknown};if(d?.version!==1||!Array.isArray(d.moves)||d.moves.length>9)return board;for(const move of d.moves)if(!board.play(move))return new TicTacToeBoard();return board;}
  play(index: number) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > 8 ||
      this.cells[index] ||
      this.winner
    )
      return false;
    this.cells[index] = this.turn;
    this.history.push(index);
    for (const line of WIN_LINES)
      if (line.every((i) => this.cells[i] === this.turn)) {
        this.winner = this.turn;
        this.line = line;
        return true;
      }
    if (this.cells.every(Boolean)) this.winner = "draw";
    else this.turn = this.turn === 1 ? 2 : 1;
    return true;
  }
}
