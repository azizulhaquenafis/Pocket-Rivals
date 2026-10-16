import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
import {
  advanceBird,
  FLAP,
  RADIUS,
  rowY,
  type Bird,
  type Wall,
} from "./ArenaPhysics";
import { beginRecovery, advanceRecovery } from "./Recovery";
import {
  STAR_GOAL,
  STAR_RADIUS,
  spawnStar,
  pickupDistance,
  type Star,
  type StarBurst,
} from "./Stars";
export type { Bird, Wall } from "./ArenaPhysics";
export class BirdsMatch {
  players: [Bird, Bird] = [this.bird(0), this.bird(1)];
  walls: [Wall, Wall];
  scores: [number, number] = [0, 0];
  winner: 1 | 2 | "draw" | null = null;
  age = 0;
  total = 0;
  round = 1;
  between = 1.1;
  stars: Star[] = [];
  bursts: StarBurst[] = [];
  private random: MatchRandom;
  private nextStar = 0;
  constructor(readonly seed: number) {
    this.walls = [this.wall(0, 3, 0), this.wall(1, 3, 0)];
    this.random = new MatchRandom(mixSeed(seed, 809));
    this.stars = [
      spawnStar(this.random, this.nextStar++, this.age, this.players),
    ];
  }
  private bird(p: number): Bird {
    return {
      x: p === 0 ? 100 : 220,
      y: 230,
      vy: 0,
      direction: p === 0 ? 1 : -1,
      alive: true,
      cooldown: 0,
      bounces: 0,
      flapSerial: 0,
      recovery: 0,
      hitX: 0,
      hitY: 0,
    };
  }
  private wall(side: number, window: number, version: number): Wall {
    const r = new MatchRandom(
      mixSeed(this.seed, this.round * 97 + side * 31 + version * 13),
    );
    const rows = Array.from({ length: 9 }, (_, i) => i)
      .filter((i) => i < window || i > window + 2)
      .sort((a, b) => r.rank(a) - r.rank(b))
      .slice(0, 4)
      .sort((a, b) => a - b);
    return { rows, window, version };
  }
  speed() {
    return Math.min(165, 115 + this.age * 0.25);
  }
  flap(i: 0 | 1) {
    const p = this.players[i];
    if (this.winner || this.between || !p.alive || p.cooldown > 0) return false;
    p.vy = FLAP;
    p.cooldown = 0.14;
    p.flapSerial++;
    return true;
  }
  safeCenter(side: 0 | 1) {
    return rowY(this.walls[side].window + 1);
  }
  private clear(side: 0 | 1) {
    return this.players.every(
      (p) => !p.alive || (side === 0 ? p.x : 320 - p.x) > 100,
    );
  }
  private schedule(side: 0 | 1) {
    const wall = this.walls[side];
    if (wall.pending) return;
    const r = new MatchRandom(
      mixSeed(this.seed, this.round * 113 + wall.version * 41 + side),
    );
    const window = Math.max(
      1,
      Math.min(5, wall.window + (r.next() < 0.5 ? -1 : 1)),
    );
    const next = this.wall(side, window, wall.version + 1);
    wall.pending = { rows: next.rows, window, remaining: 0.4 };
  }
  step(dt: number) {
    if (this.winner) return;
    this.total += dt;
    if (this.between) {
      this.between = Math.max(0, this.between - dt);
      return;
    }
    this.age += dt;
    for (const side of [0, 1] as const) {
      const w = this.walls[side];
      if (w.pending) {
        w.pending.remaining -= dt;
        if (w.pending.remaining <= 0 && this.clear(side)) {
          w.rows = w.pending.rows;
          w.window = w.pending.window;
          w.version++;
          w.pending = undefined;
        }
      }
    }
    for (const burst of this.bursts) burst.age += dt;
    this.bursts = this.bursts.filter((b) => b.age < 0.5);
    const before = this.players.map((p) => ({
      x: p.x,
      y: p.y,
      active: p.alive && p.recovery === 0,
    }));
    for (const i of [0, 1] as const) {
      const p = this.players[i];
      if (p.recovery > 0) {
        advanceRecovery(p, i, dt);
        continue;
      }
      const bounce = advanceBird(p, dt, this.speed(), this.walls);
      if (!p.alive) {
        beginRecovery(p);
        continue;
      }
      if (bounce !== null) this.schedule(bounce === 0 ? 1 : 0);
    }
    const collected: Star[] = [];
    for (const star of this.stars) {
      if (this.age - star.born < 0.18) continue;
      const distances = this.players.map((p, i) =>
        p.alive && p.recovery === 0 && before[i].active
          ? pickupDistance(star, before[i], p)
          : Infinity,
      );
      const nearest = Math.min(...distances);
      if (nearest > RADIUS + STAR_RADIUS) continue;
      for (const i of [0, 1] as const)
        if (Math.abs(distances[i] - nearest) < 1e-6) {
          this.scores[i] = Math.min(STAR_GOAL, this.scores[i] + 1);
          this.bursts.push({ x: star.x, y: star.y, player: i, age: 0 });
        }
      collected.push(star);
    }
    if (collected.length)
      this.stars = this.stars.filter((s) => !collected.includes(s));
    if (this.scores.some((s) => s >= STAR_GOAL)) {
      this.winner =
        this.scores[0] >= STAR_GOAL && this.scores[1] >= STAR_GOAL
          ? "draw"
          : this.scores[0] >= STAR_GOAL
            ? 1
            : 2;
      return;
    }
    if (collected.length)
      this.stars = [
        spawnStar(
          this.random,
          this.nextStar++,
          this.age,
          this.players,
          collected[0],
        ),
      ];
  }
}
