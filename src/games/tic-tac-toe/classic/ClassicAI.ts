import { MatchRandom, type SeedInput } from "../../../shared/ai/MatchRandom";
import type { Difficulty } from "../../../shared/contracts/AIController";
import type { Player } from "../../../shared/contracts/GameResult";
import { WIN_LINES } from "../shared/lines";
import type { TicTacToeBoard } from "./ClassicRules";
const ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7];
/** Full minimax for Impossible; alpha-beta bounds keep this nine-cell search tiny. */
export function classicMove(
  board: TicTacToeBoard,
  difficulty: Difficulty,
  random = Math.random,
  preference: (move: number) => number = () => 1,
): number {
  const cells = [...board.cells],
    player = board.turn;
  const legal = ORDER.filter((i) => !cells[i]);
  if (board.winner || !legal.length) return -1;
  if (difficulty === "medium" && random() < 0.32)
    return legal[Math.floor(random() * legal.length)];
  const limit =
    difficulty === "impossible"
      ? 9
      : difficulty === "hard"
        ? legal.length >= 8
          ? 9
          : 5
        : 2;
  function search(
    turn: Player,
    depth: number,
    alpha: number,
    beta: number,
  ): number {
    for (const line of WIN_LINES) {
      const p = cells[line[0]];
      if (p && line.every((i) => cells[i] === p))
        return p === player ? 100 + depth : -100 - depth;
    }
    if (cells.every(Boolean)) return 0;
    if (depth === 0) {
      let score = 0;
      for (const line of WIN_LINES) {
        const own = line.filter((i) => cells[i] === player).length,
          other = line.filter((i) => cells[i] && cells[i] !== player).length;
        if (!other) score += own * own;
        if (!own) score -= other * other;
      }
      return score;
    }
    let value = turn === player ? -Infinity : Infinity;
    for (const i of ORDER) {
      if (cells[i]) continue;
      cells[i] = turn;
      const score = search(turn === 1 ? 2 : 1, depth - 1, alpha, beta);
      cells[i] = null;
      if (turn === player) {
        value = Math.max(value, score);
        alpha = Math.max(alpha, value);
      } else {
        value = Math.min(value, score);
        beta = Math.min(beta, value);
      }
      if (beta <= alpha) break;
    }
    return value;
  }
  let best = -Infinity;
  let choices: number[] = [];
  for (const i of legal) {
    cells[i] = player;
    const score = search(player === 1 ? 2 : 1, limit - 1, -Infinity, Infinity);
    cells[i] = null;
    if (score > best) {
      best = score;
      choices = [i];
    } else if (score === best) choices.push(i);
  }
  const weights = choices.map(preference),
    total = weights.reduce((a, b) => a + b, 0);
  let value = random() * total;
  for (let i = 0; i < choices.length; i++) {
    value -= weights[i];
    if (value <= 0) return choices[i];
  }
  return choices.at(-1)!;
}

/** Natural opening variety only among equally evaluated moves; Impossible remains exact. */
export class ClassicAI {
  readonly personality: MatchRandom;
  readonly delay: number;
  constructor(
    readonly difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
    this.delay = this.personality.sample(
      { medium: 0.6, hard: 0.4, impossible: 0.25 }[difficulty],
      0.1,
      0.18,
    );
  }
  choose(board: TicTacToeBoard) {
    const role = this.personality.role;
    return classicMove(
      board,
      this.difficulty,
      new MatchRandom(
        this.personality.turnSeed(board.cells.filter(Boolean).length),
      ).next,
      (move) =>
        1 +
        (role === 0 && move === 4
          ? 3
          : role === 1 && [0, 2, 6, 8].includes(move)
            ? 3
            : role === 2 && [1, 3, 5, 7].includes(move)
              ? 3
              : role === 3 && move % 3 === (this.personality.side < 0 ? 0 : 2)
                ? 3
                : 0),
    );
  }
  snapshot() {
    return {
      ...this.personality.snapshot(),
      strategy: ["center", "corners", "edges", "flank"][this.personality.role],
    };
  }
}
