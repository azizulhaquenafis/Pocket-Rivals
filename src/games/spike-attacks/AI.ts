import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Difficulty } from "../../shared/contracts/AIController";
import { contact, DIRECTIONS, STONES, type SpikeMatch } from "./Rules";
type Point = { x: number; y: number };
/** Tiny visibility graph: legal straight segments around expanded circular stones. */
export function coverRoute(start: Point, goal: Point): Point[] {
  const nodes = [
    start,
    goal,
    ...STONES.flatMap((s) =>
      Array.from({ length: 8 }, (_, i) => ({
        x: s.x + 36 * Math.cos((i * Math.PI) / 4),
        y: s.y + 36 * Math.sin((i * Math.PI) / 4),
      })),
    ),
  ].filter(
    (p, i) => i < 2 || (p.x >= 10 && p.x <= 330 && p.y >= 10 && p.y <= 160),
  );
  const dist = nodes.map(() => Infinity),
    prev = nodes.map(() => -1),
    seen = new Set<number>();
  dist[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++)
      if (!seen.has(i) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || !Number.isFinite(dist[u])) break;
    if (u === 1) break;
    seen.add(u);
    for (let v = 0; v < nodes.length; v++) {
      if (seen.has(v) || v === u) continue;
      const a = nodes[u],
        b = nodes[v],
        dx = b.x - a.x,
        dy = b.y - a.y;
      if (
        STONES.some(
          (s) => contact(a.x, a.y, dx, dy, s.x, s.y, s.r + 9.1) !== null,
        )
      )
        continue;
      const cost = dist[u] + Math.hypot(dx, dy);
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
export class SpikeAI {
  readonly personality: MatchRandom;
  private wave = -1;
  private delay = 0;
  private route: Point[] = [];
  constructor(
    private difficulty: Difficulty,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  update(dt: number, m: SpikeMatch) {
    if (m.winner || m.between) return;
    const p = m.players[1],
      r = this.personality;
    if (this.wave !== m.wave) {
      this.wave = m.wave;
      const d = DIRECTIONS[m.direction],
        choices = STONES.map((s) => ({ x: s.x + d.x * 32, y: s.y + d.y * 32 }))
          .filter((c) => c.x > 10 && c.x < 330 && c.y > 10 && c.y < 160)
          .map((goal) => {
            const route = coverRoute(p, goal);
            let cost = 0,
              last: Point = p;
            for (const next of route) {
              cost += Math.hypot(next.x - last.x, next.y - last.y);
              last = next;
            }
            return {
              route,
              cost: route.length
                ? cost + r.rank(Math.round(goal.x + goal.y)) * r.role * 7
                : Infinity,
            };
          });
      choices.sort((a, b) => a.cost - b.cost);
      this.route = choices[0].route;
      this.delay = r.sample(
        this.difficulty === "medium"
          ? 1.15
          : this.difficulty === "hard"
            ? 0.4
            : 0.18,
        0.12,
        0.12,
      );
    }
    this.delay -= dt;
    if (this.delay > 0) return;
    if (
      this.route.length > 1 &&
      Math.hypot(p.x - this.route[0].x, p.y - this.route[0].y) < 1
    )
      this.route.shift();
    const t = this.route[0];
    if (t) m.target(1, t.x, t.y);
  }
}
