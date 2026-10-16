import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import {
  BLOCKS,
  clearPoint,
  safeFrom,
  type Point,
  type Block,
} from "./ArenaPhysics";
import type { SpikeMatch } from "./Rules";
function segmentClear(a: Point, b: Point, blocks: readonly Block[]) {
  // Slab intersection with radius-expanded solids; conservative around corners.
  return blocks.every((box) => {
    let lo = 0,
      hi = 1;
    for (const axis of ["x", "y"] as const) {
      const v = b[axis] - a[axis],
        min = box[axis] - 9,
        max = box[axis] + (axis === "x" ? box.w : box.h) + 9;
      if (Math.abs(v) < 1e-9) {
        if (a[axis] <= min || a[axis] >= max) return true;
      } else {
        const t1 = (min - a[axis]) / v,
          t2 = (max - a[axis]) / v;
        lo = Math.max(lo, Math.min(t1, t2));
        hi = Math.min(hi, Math.max(t1, t2));
      }
    }
    return lo > hi || hi <= 1e-7;
  });
}
export function coverRoute(
  start: Point,
  goal: Point,
  blocks: readonly Block[] = BLOCKS,
): Point[] {
  if (!clearPoint(goal, 9.5, blocks)) return [];
  const nodes = [
    start,
    goal,
    ...blocks
      .flatMap((b) => [
        { x: b.x - 11, y: b.y - 11 },
        { x: b.x + b.w + 11, y: b.y - 11 },
        { x: b.x - 11, y: b.y + b.h + 11 },
        { x: b.x + b.w + 11, y: b.y + b.h + 11 },
      ])
      .filter((p) => clearPoint(p, 9.5, blocks)),
  ];
  const dist = nodes.map(() => Infinity),
    prev = nodes.map(() => -1),
    seen = new Set<number>();
  dist[0] = 0;
  for (let k = 0; k < nodes.length; k++) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!seen.has(i) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || !Number.isFinite(dist[u])) break;
    if (u === 1) break;
    seen.add(u);
    for (let v = 0; v < nodes.length; v++)
      if (!seen.has(v) && v !== u && segmentClear(nodes[u], nodes[v], blocks)) {
        const cost =
          dist[u] +
          Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y);
        if (cost < dist[v]) {
          dist[v] = cost;
          prev[v] = u;
        }
      }
  }
  if (!Number.isFinite(dist[1])) return [];
  const route: Point[] = [];
  for (let i = 1; i > 0; i = prev[i]) route.unshift(nodes[i]);
  return route;
}
const candidates = Array.from({ length: 15 * 15 }, (_, i) => ({
  x: 20 + (i % 15) * 20,
  y: 20 + Math.floor(i / 15) * 20,
}));
export class SpikeAI {
  readonly personality: MatchRandom;
  private wave = -1;
  private delay = 0;
  private route: Point[] = [];
  private lastPlanMs = 0;
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(dt: number, m: SpikeMatch, player: 0 | 1 = 1) {
    if (m.winner || m.between || !m.players[player].alive) return;
    const p = m.players[player],
      r = this.personality;
    if (this.wave !== m.wave) {
      const started = performance.now();
      this.wave = m.wave;
      // Medium aims for the middle of a shelter rather than solving every
      // safe pixel. The longer, conservative routes can be beaten by a player
      // who reads the warning sooner; collisions still decide every outcome.
      const basic = m.map.blocks.map((b) =>
        m.direction === 0
          ? { x: b.x + b.w + 21, y: b.y + b.h / 2 }
          : m.direction === 1
            ? { x: b.x - 21, y: b.y + b.h / 2 }
            : m.direction === 2
              ? { x: b.x + b.w / 2, y: b.y + b.h + 21 }
              : { x: b.x + b.w / 2, y: b.y - 21 },
      );
      const choices = (this.difficulty === "medium" ? basic : candidates)
        .filter((c) => safeFrom(c, m.direction, 0.5, m.map.blocks))
        .map((goal) => ({ goal, d: Math.hypot(goal.x - p.x, goal.y - p.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 20);
      let best = Infinity;
      this.route = [];
      for (const { goal } of choices) {
        const route = coverRoute(p, goal, m.map.blocks);
        if (!route.length) continue;
        let cost = 0,
          last: Point = p;
        for (const q of route) {
          cost += Math.hypot(q.x - last.x, q.y - last.y);
          last = q;
        }
        // Personality only breaks close choices; never randomizes a movement target every frame.
        cost +=
          r.rank(Math.round(goal.x + goal.y * 320)) *
          (this.difficulty === "medium" ? 30 : 6) *
          (1 + r.role * 0.15);
        if (cost < best) {
          best = cost;
          this.route = route;
        }
      }
      this.delay = r.sample(
        { medium: 0.68, hard: 0.23, impossible: 0.12 }[this.difficulty],
        0.08,
        0.08,
      );
      this.lastPlanMs = performance.now() - started;
    }
    this.delay -= dt;
    if (this.delay > 0) return;
    while (
      this.route.length > 1 &&
      Math.hypot(p.x - this.route[0].x, p.y - this.route[0].y) < 1
    )
      this.route.shift();
    const t = this.route[0];
    if (t) m.target(player, t.x, t.y);
  }
  get computationMs() {
    return this.lastPlanMs;
  }
}
