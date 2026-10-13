import { DotsBoard, boxes, adjacent } from "./Rules";
import type { Difficulty } from "../../shared/contracts/AIController";
function priority(b: DotsBoard, e: number) {
  return adjacent[e].reduce((score, i) => {
    const n = boxes[i].filter((j) => b.edges[j]).length;
    return score + (n === 3 ? 100 : n === 2 ? -25 : n === 1 ? -1 : 1);
  }, 0);
}
export function chooseEdge(board: DotsBoard, difficulty: Difficulty) {
  const start = performance.now(),
    budget = { medium: 12, hard: 70, impossible: 180 }[difficulty],
    legal = board.legal();
  let nodes = 0,
    best =
      legal.sort((a, b) => priority(board, b) - priority(board, a))[0] ?? -1,
    completedDepth = 0;
  const root = board.turn;
  if (difficulty === "medium") {
    return {
      edge: best,
      milliseconds: performance.now() - start,
      depth: 0,
      nodes,
    };
  }
  const cache = new Map<string, { depth: number; value: number }>();
  const evaluate = (b: DotsBoard) => {
    let chains = 0;
    for (let i = 0; i < 16; i++)
      if (!b.owners[i] && boxes[i].filter((e) => b.edges[e]).length === 3)
        chains++;
    return (
      (b.scores[root - 1] - b.scores[2 - root]) * 100 +
      chains * (b.turn === root ? 15 : -15)
    );
  };
  const search = (
    b: DotsBoard,
    depth: number,
    alpha: number,
    beta: number,
  ): number => {
    if (++nodes > 50000 || performance.now() - start > budget) throw 0;
    if (b.winner || depth === 0) return evaluate(b);
    const key =
      b.edges.map((v) => (v ? "1" : "0")).join("") +
      b.turn +
      ":" +
      b.scores[root - 1];
    const memo = cache.get(key);
    if (memo && memo.depth >= depth) return memo.value;
    const maximize = b.turn === root;
    let value = maximize ? -Infinity : Infinity,
      cut = false;
    for (const e of b.legal().sort((a, c) => priority(b, c) - priority(b, a))) {
      const child = b.clone();
      child.play(e);
      const v = search(child, depth - 1, alpha, beta);
      value = maximize ? Math.max(value, v) : Math.min(value, v);
      if (maximize) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (beta <= alpha) {
        cut = true;
        break;
      }
    }
    if (!cut) cache.set(key, { depth, value });
    return value;
  };
  for (
    let depth = 1;
    depth <= Math.min(legal.length, difficulty === "hard" ? 5 : 40);
    depth++
  ) {
    let candidate = best,
      score = -Infinity;
    try {
      for (const e of [best, ...legal.filter((x) => x !== best)]) {
        const b = board.clone();
        b.play(e);
        const v = search(b, depth - 1, score, Infinity);
        if (v > score) {
          score = v;
          candidate = e;
        }
      }
      best = candidate;
      completedDepth = depth;
    } catch {
      break;
    }
  }
  return {
    edge: best,
    milliseconds: performance.now() - start,
    depth: completedDepth,
    nodes,
  };
}
