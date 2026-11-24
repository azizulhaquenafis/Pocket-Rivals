import { mixSeed } from "../../shared/ai/MatchRandom";
import {
  advanceRunner,
  type Gap,
  type Obstacle,
  type Runner,
} from "./RunnerPhysics";
import { MAPS, type RunnerMap } from "./Maps";
import { CourseStream } from "./CourseStream";
export type { Gap, Obstacle, Runner } from "./RunnerPhysics";
export const WIN_SCORE = 3;
export const ROUND_SECONDS = 120;
export const BASE_SPEED = 145;
export const MAX_SPEED = 315;
export class GravityMatch {
  players: [Runner, Runner] = [this.runner(), this.runner()];
  scores: [number, number] = [0, 0];
  gaps: Gap[] = [];
  obstacles: Obstacle[] = [];
  distance = 0;
  round = 1;
  age = 0;
  total = 0;
  between = 0;
  remaining = ROUND_SECONDS;
  timedOut = false;
  winner: 1 | 2 | "draw" | null = null;
  map: RunnerMap;
  private stream!: CourseStream;
  private trimmed = -200;
  constructor(
    readonly seed: number,
    mapId?: string,
  ) {
    this.map =
      MAPS.find((m) => m.id === mapId) ?? MAPS[mixSeed(seed, 42) % MAPS.length];
    this.course();
  }
  private runner(): Runner {
    return { y: 160, vy: 0, gravity: 1, alive: true, cooldown: 0 };
  }
  private course() {
    this.stream = new CourseStream(mixSeed(this.seed, this.round), this.map.id);
    this.trimmed = -200;
    this.gaps = [];
    this.obstacles = [];
    this.extend();
  }
  private extend() {
    // Stream and retire geometry: endless runs keep a bounded working set.
    if (this.distance - this.trimmed >= 180) {
      this.trimmed = this.distance;
      this.gaps = this.gaps.filter((o) => o.x + o.width > this.distance - 400);
      this.obstacles = this.obstacles.filter(
        (o) => o.x + o.width > this.distance - 400,
      );
    }
    while (
      this.stream.next < this.distance + 2100 ||
      this.stream.history.length < 3
    )
      this.stream.append(this.gaps, this.obstacles);
  }
  get patterns() {
    return this.stream.history;
  }
  speed(age = this.age) {
    // Brief 3s warm-up, then smooth continuous acceleration from 145 toward 315.
    if (age <= 3) return BASE_SPEED;
    const t = Math.min(1, (age - 3) / 102);
    const s = t * t * (3 - 2 * t);
    const curve = 0.55 * s + 0.45 * (1 - Math.pow(1 - t, 2.2));
    return BASE_SPEED + (MAX_SPEED - BASE_SPEED) * curve;
  }
  flip(i: 0 | 1) {
    const p = this.players[i];
    if (this.winner || this.between || !p.alive || p.cooldown > 0) return false;
    p.gravity = p.gravity === 1 ? -1 : 1;
    p.cooldown = 0.16;
    return true;
  }
  advanceClock(dt: number) {
    if (this.winner || this.between || !Number.isFinite(dt) || dt <= 0) return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining <= 1e-8) {
      this.remaining = 0;
      this.timedOut = true;
      this.between = 1.1; // Both survived: replay without awarding a point.
    }
  }
  step(dt: number, tickClock = true) {
    if (this.winner) return;
    this.total += dt;
    if (this.between) {
      this.between = Math.max(0, this.between - dt);
      if (!this.between) {
        this.players = [this.runner(), this.runner()];
        this.age = 0;
        this.remaining = ROUND_SECONDS;
        this.timedOut = false;
        this.distance = 0;
        this.round++;
        const choices = MAPS.filter((map) => map.id !== this.map.id);
        this.map =
          choices[mixSeed(this.seed, this.round * 43) % choices.length];
        this.course();
      }
      return;
    }
    if (tickClock) this.advanceClock(dt);
    if (this.between) return;
    this.age += dt;
    this.distance += this.speed() * dt;
    this.extend();
    for (const p of this.players)
      advanceRunner(p, this.distance, dt, this.gaps, this.obstacles, this.age);
    if (this.players.some((p) => !p.alive)) {
      if (this.players[0].alive !== this.players[1].alive)
        this.scores[this.players[0].alive ? 0 : 1]++;
      this.between = 1.1;
      if (this.scores.some((s) => s >= WIN_SCORE))
        this.winner = this.scores[0] >= WIN_SCORE ? 1 : 2;
    }
  }
}
