import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { DotsBoard } from "./Rules";
import type { Difficulty } from "../../shared/contracts/AIController";

function sacrificeDamage(board: DotsBoard, edge: number): number {
  const claimed = board.edges.slice();
  claimed[edge] = 1;
  const queue: number[] = [];
  for (const b of board.adjacent[edge]) {
    if (!board.owners[b]) {
      let drawn = 0;
      for (const e of board.boxes[b]) if (claimed[e]) drawn++;
      if (drawn === 3) queue.push(b);
    }
  }
  let total = 0;
  while (queue.length > 0) {
    const b = queue.shift()!;
    total++;
    const remaining = board.boxes[b].find((e) => !claimed[e]);
    if (remaining !== undefined) {
      claimed[remaining] = 1;
      for (const adj of board.adjacent[remaining]) {
        if (adj !== b && !board.owners[adj]) {
          let drawn = 0;
          for (const e of board.boxes[adj]) if (claimed[e]) drawn++;
          if (drawn === 3 && !queue.includes(adj)) {
            queue.push(adj);
          }
        }
      }
    }
  }
  return total;
}

function priority(b: DotsBoard, e: number): number {
  let hasThree = 0;
  let hasTwo = 0;
  let safeQuality = 0;

  for (const box of b.adjacent[e]) {
    let drawn = 0;
    for (const edge of b.boxes[box]) {
      if (b.edges[edge]) drawn++;
    }
    if (drawn === 3) hasThree++;
    else if (drawn === 2) hasTwo++;
    else if (drawn === 1) safeQuality += 15;
    else safeQuality += 30;
  }

  if (hasThree === 2) {
    return 30000;
  }
  if (hasThree === 1) {
    return hasTwo === 1 ? 25000 : 20000;
  }
  if (hasTwo > 0) {
    const damage = sacrificeDamage(b, e);
    return -20000 - damage * 1000;
  }
  return 1000 + safeQuality;
}

function getBoardKey(b: DotsBoard): string {
  let m0 = 0,
    m1 = 0,
    m2 = 0;
  const len = b.totalEdges;
  for (let i = 0; i < Math.min(32, len); i++) {
    if (b.edges[i]) m0 |= 1 << i;
  }
  for (let i = 32; i < Math.min(64, len); i++) {
    if (b.edges[i]) m1 |= 1 << (i - 32);
  }
  for (let i = 64; i < len; i++) {
    if (b.edges[i]) m2 |= 1 << (i - 64);
  }
  return `${m0}_${m1}_${m2}_${b.turn}_${b.scores[0]}`;
}

export function chooseEdge(
  board: DotsBoard,
  difficulty: Difficulty,
  options: { seed?: number; replay?: boolean } = {},
) {
  const style = new MatchRandom(options.seed);
  const preference = (e: number) => {
    const box = board.adjacent[e]?.[0] ?? 0,
      center = (board.size - 1) / 2,
      row = Math.floor(box / board.size),
      col = box % board.size;
    return (
      (style.role === 0
        ? Math.abs(row - center) + Math.abs(col - center)
        : style.role === 1
          ? -Math.abs(row - center) - Math.abs(col - center)
          : style.role === 2
            ? e < board.horizontalCount
              ? 1
              : -1
            : col * style.side) +
      style.rank(e) * (1 + style.tempo)
    );
  };
  const order = (b: DotsBoard, a: number, c: number) =>
    priority(b, c) - priority(b, a) || preference(c) - preference(a);
  const start = performance.now(),
    budget = { medium: 12, hard: 80, impossible: 350 }[difficulty],
    legal = board.legal();
  let nodes = 0,
    best = legal.sort((a, b) => order(board, a, b))[0] ?? -1,
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
  const cache = new Map<
    string,
    { depth: number; value: number; flag: number }
  >();
  const evaluate = (b: DotsBoard) => {
    if (b.winner) {
      if (b.winner === root)
        return 100000 + (b.scores[root - 1] - b.scores[2 - root]) * 1000;
      if (b.winner === "draw") return 0;
      return -100000 + (b.scores[root - 1] - b.scores[2 - root]) * 1000;
    }
    const scoreDiff = (b.scores[root - 1] - b.scores[2 - root]) * 1000;
    let pendingCaptures = 0;
    for (let i = 0; i < b.totalBoxes; i++) {
      if (!b.owners[i]) {
        let drawn = 0;
        for (const e of b.boxes[i]) if (b.edges[e]) drawn++;
        if (drawn === 3) pendingCaptures++;
      }
    }
    const turnMultiplier = b.turn === root ? 1 : -1;
    return scoreDiff + pendingCaptures * turnMultiplier * 900;
  };
  const timeout = Symbol("search budget");
  const search = (
    b: DotsBoard,
    depth: number,
    alpha: number,
    beta: number,
  ): number => {
    if (
      ++nodes > 50000 ||
      (!options.replay && performance.now() - start > budget)
    )
      throw timeout;
    if (b.winner || depth === 0) return evaluate(b);
    const key = getBoardKey(b);
    const originalAlpha = alpha,
      originalBeta = beta,
      memo = cache.get(key);
    if (memo && memo.depth >= depth) {
      if (memo.flag === 0) return memo.value;
      if (memo.flag === 1) alpha = Math.max(alpha, memo.value);
      else beta = Math.min(beta, memo.value);
      if (alpha >= beta) return memo.value;
    }
    const maximize = b.turn === root;
    let value = maximize ? -Infinity : Infinity;
    for (const e of b.legal().sort((a, c) => order(b, a, c))) {
      const child = b.clone();
      child.play(e);
      const v = search(child, depth - 1, alpha, beta);
      value = maximize ? Math.max(value, v) : Math.min(value, v);
      if (maximize) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (beta <= alpha) {
        break;
      }
    }
    if (cache.size < 20000)
      cache.set(key, {
        depth,
        value,
        flag: value <= originalAlpha ? 2 : value >= originalBeta ? 1 : 0,
      });
    return value;
  };
  const maxSearchDepth =
    difficulty === "hard" ? 6 : Math.min(legal.length, 30);
  for (let depth = 1; depth <= maxSearchDepth; depth++) {
    let candidate = best,
      score = -Infinity;
    try {
      for (const e of [best, ...legal.filter((x) => x !== best)]) {
        const b = board.clone();
        b.play(e);
        const v = search(b, depth - 1, -Infinity, Infinity);
        if (
          v > score ||
          (v === score && preference(e) > preference(candidate))
        ) {
          score = v;
          candidate = e;
        }
      }
      best = candidate;
      completedDepth = depth;
    } catch (error) {
      if (error !== timeout) throw error;
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
