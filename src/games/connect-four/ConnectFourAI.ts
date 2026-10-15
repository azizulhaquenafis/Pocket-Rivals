import { MatchRandom } from "../../shared/ai/MatchRandom";
import { ConnectFourBoard, FOUR_LINES } from "./ConnectFourRules";
import type { Difficulty } from "../../shared/contracts/AIController";
import type { Player } from "../../shared/contracts/GameResult";
export interface SearchResult {
  column: number;
  depth: number;
  nodes: number;
  milliseconds: number;
}
function evaluate(b: ConnectFourBoard, root: Player, style: MatchRandom) {
  let score = 0;
  const weights = [0, 2, 18, 120, 100000];
  for (const line of FOUR_LINES) {
    let us = 0,
      them = 0;
    for (const i of line) {
      if (b.cells[i] === root) us++;
      else if (b.cells[i] !== null) them++;
    }
    if (!them) score += weights[us] * [1.08, 1, 1.03, 1][style.role];
    if (!us) score -= weights[them] * [1.05, 1.2, 1.12, 1.1][style.role];
  }
  for (let r = 0; r < 6; r++) {
    const p = b.cells[r * 7 + 3];
    if (p) score += (p === root ? 1 : -1) * (5 + style.tempo * 2);
  }
  // A small preferred-flank positional term breaks symmetric plans without masking threats.
  for (let r = 0; r < 6; r++) {
    const p = b.cells[r * 7 + (style.side < 0 ? 2 : 4)];
    if (p) score += (p === root ? 1 : -1) * (style.role === 3 ? 3 : 1);
  }
  return score;
}
export function searchConnectFour(
  b: ConnectFourBoard,
  difficulty: Difficulty,
  random = Math.random,
  options: { seed?: number; replay?: boolean } = {},
): SearchResult {
  const style = new MatchRandom(options.seed ?? random),
    start = performance.now(),
    cfg = {
      medium: { ms: 25, depth: 3, nodes: 10000 },
      hard: { ms: 100, depth: 7, nodes: 60000 },
      impossible: { ms: 300, depth: 14, nodes: 220000 },
    }[difficulty],
    end = options.replay ? Infinity : start + cfg.ms,
    root = b.turn;
  let nodes = 0,
    best = b.legal()[0] ?? -1,
    completed = 0;
  const table = new Map<
    string,
    { depth: number; score: number; flag: number; move: number }
  >();
  const abort = {};
  function search(depth: number, alpha: number, beta: number): number {
    if ((++nodes & 63) === 0 && (performance.now() > end || nodes > cfg.nodes))
      throw abort;
    if (b.winner)
      return b.winner === "draw"
        ? 0
        : b.winner === root
          ? 100000 + depth
          : -100000 - depth;
    if (depth === 0) return evaluate(b, root, style);
    const key = b.cells.map((c) => c ?? 0).join("") + b.turn,
      entry = table.get(key),
      originalAlpha = alpha,
      originalBeta = beta;
    if (entry && entry.depth >= depth) {
      if (entry.flag === 0) return entry.score;
      if (entry.flag === 1) alpha = Math.max(alpha, entry.score);
      else beta = Math.min(beta, entry.score);
      if (alpha >= beta) return entry.score;
    }
    const maximizing = b.turn === root,
      moves = b.legal();
    if (entry) {
      const at = moves.indexOf(entry.move);
      if (at > 0) moves.unshift(...moves.splice(at, 1));
    }
    let value = maximizing ? -Infinity : Infinity,
      move = moves[0];
    for (const c of moves) {
      b.drop(c);
      let score: number;
      try {
        score = search(depth - 1, alpha, beta);
      } finally {
        b.undo();
      }
      if (maximizing ? score > value : score < value) {
        value = score;
        move = c;
      }
      if (maximizing) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    if (table.size < 40000)
      table.set(key, {
        depth,
        score: value,
        move,
        flag: value <= originalAlpha ? 2 : value >= originalBeta ? 1 : 0,
      });
    return value;
  }
  const legal = b.legal().sort((a, z) => style.rank(a) - style.rank(z));
  if (!legal.length) return { column: -1, depth: 0, nodes: 0, milliseconds: 0 };
  // Never overlook a win in one, even at the casual setting.
  for (const c of legal) {
    b.drop(c);
    const won = b.winner === root;
    b.undo();
    if (won)
      return {
        column: c,
        depth: 1,
        nodes,
        milliseconds: performance.now() - start,
      };
  }
  for (let depth = 1; depth <= cfg.depth; depth++) {
    let candidate = best,
      value = -Infinity;
    try {
      const ordered = [best, ...legal.filter((c) => c !== best)];
      for (const c of ordered) {
        b.drop(c);
        let s: number;
        try {
          s = search(depth - 1, -Infinity, Infinity);
        } finally {
          b.undo();
        }
        if (
          s > value ||
          (s === value && style.rank(c) < style.rank(candidate))
        ) {
          value = s;
          candidate = c;
        }
      }
      best = candidate;
      completed = depth;
    } catch (e) {
      if (e !== abort) throw e;
      break;
    }
    if (Math.abs(value) >= 100000 || performance.now() >= end) break;
  }
  if (difficulty === "medium" && style.next() < 0.16)
    best = legal[Math.floor(style.next() * legal.length)];
  return {
    column: best,
    depth: completed,
    nodes,
    milliseconds: performance.now() - start,
  };
}
