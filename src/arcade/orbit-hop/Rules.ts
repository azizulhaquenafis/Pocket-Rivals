import type { Difficulty } from "../../shared/contracts/AIController";
import {
  DEFAULT_PLANET,
  PLANET_TYPES,
  type PlanetClass,
  type PlanetSpec,
} from "./Planets";

export interface Planet {
  id: number;
  x: number;
  y: number;
  r: number;
  type: string;
  kind: PlanetClass;
  volume: number;
  density: number;
  pull: number;
  field: number;
}

export interface OrbitMiss {
  x: number;
  y: number;
  vx: number;
  vy: number;
  reason: "edge" | "timeout";
  final: boolean;
}

export const ORBIT_TIERS = {
  medium: {
    radius: 27,
    gap: 188,
    spread: 132,
    field: 62,
    pull: 560,
    speed: 290,
    orbit: 1.05,
  },
  hard: {
    radius: 23,
    gap: 204,
    spread: 164,
    field: 48,
    pull: 520,
    speed: 305,
    orbit: 1.4,
  },
  impossible: {
    radius: 19,
    gap: 218,
    spread: 188,
    field: 36,
    pull: 480,
    speed: 320,
    orbit: 1.75,
  },
} as const;

export class OrbitWorld {
  planets: Planet[] = [];
  current = 0;
  highest = 0;
  angle = 0;
  orbit = true;
  score = 0;
  lives = 3;
  done = false;
  flight = 0;
  camera = 0;
  grace = 0;
  lastMiss: OrbitMiss | null = null;
  ball = { x: 253, y: 540, vx: 0, vy: 0 };

  constructor(
    private random = Math.random,
    readonly difficulty: Difficulty = "medium",
  ) {
    const start = DEFAULT_PLANET;
    const r = this.tuning.radius + 3;
    this.planets = [
      {
        id: 0,
        x: 210,
        y: 540,
        r,
        type: start.id,
        kind: start.kind,
        volume: start.volume,
        density: start.density,
        pull: start.pull,
        field: start.field,
      },
    ];
    this.ball.x = 210 + r + 8;
    this.extend();
  }

  get tuning() {
    return ORBIT_TIERS[this.difficulty];
  }

  fieldRadius(p: Planet) {
    return p.r + this.tuning.field * (p.field ?? 1);
  }

  planetPull(p: Planet) {
    return this.tuning.pull * (p.pull ?? 0.75);
  }

  /** Finite, smoothly tapered per-planet gravity derived from volume & density. */
  gravityAt(x: number, y: number, flight = this.flight) {
    let ax = 0,
      ay = 0;
    for (const p of this.planets) {
      if (p.id === this.current && flight < 0.3) continue;
      const dx = p.x - x,
        dy = p.y - y,
        d = Math.hypot(dx, dy);
      const radius = this.fieldRadius(p);
      if (d <= 1 || d >= radius) continue;
      const t = Math.min(1, (radius - d) / (radius - p.r - 8));
      const a = this.planetPull(p) * t * t * (3 - 2 * t);
      ax += (a * dx) / d;
      ay += (a * dy) / d;
    }
    return { x: ax, y: ay };
  }

  get planet() {
    return this.planets.find((p) => p.id === this.current)!;
  }

  get nextPlanet() {
    return this.planets.find((p) => p.id === this.highest + 1);
  }

  private pickPlanetSpec(prevA?: string, prevB?: string): PlanetSpec {
    // Fixed single random draw per planet so tier comparisons stay seed-aligned.
    const pool = PLANET_TYPES.filter((s) => s.id !== prevA && s.id !== prevB);
    return pool[Math.floor(this.random() * pool.length) % pool.length];
  }

  private extend() {
    while (this.planets.at(-1)!.id < this.highest + 5) {
      const p = this.planets.at(-1)!;
      const prev = this.planets.at(-2);
      const spec = this.pickPlanetSpec(p.type, prev?.type);
      const dx = (this.random() - 0.5) * this.tuning.spread;
      const dy = this.random() * 28;
      const jitter = this.random() * 2.5;
      const r = this.tuning.radius * spec.volume + jitter;
      this.planets.push({
        id: p.id + 1,
        x: Math.max(96, Math.min(324, p.x + dx)),
        y: p.y - this.tuning.gap - dy,
        r,
        type: spec.id,
        kind: spec.kind,
        volume: spec.volume,
        density: spec.density,
        pull: spec.pull,
        field: spec.field,
      });
    }
    this.planets = this.planets.filter(
      (p) => p.id >= this.highest - 2 || p.id === this.current,
    );
  }

  launch() {
    if (this.done || !this.orbit || this.grace > 0) return false;
    this.orbit = false;
    this.flight = 0;
    this.lastMiss = null;
    this.ball.vx = Math.sin(this.angle) * this.tuning.speed;
    this.ball.vy = -Math.cos(this.angle) * this.tuning.speed;
    return true;
  }

  private rescue(reason: "edge" | "timeout") {
    this.lastMiss = {
      x: this.ball.x,
      y: this.ball.y,
      vx: this.ball.vx,
      vy: this.ball.vy,
      reason,
      final: this.lives <= 1,
    };
    this.lives--;
    if (!this.lives) {
      this.done = true;
      return;
    }
    this.orbit = true;
    this.angle = 0;
    this.grace = 0.45;
    const p = this.planet;
    this.ball = { x: p.x + p.r + 8, y: p.y, vx: 0, vy: 0 };
  }

  /**
   * Zero-allocation arc-length trajectory preview matching real 120Hz flight physics.
   * Safe to invoke every render frame without throttling or mutating live state.
   */
  preview(angle = this.angle) {
    const points: { x: number; y: number }[] = [];
    if (this.done || !this.orbit) return points;
    const home = this.planet;
    let x = home.x + Math.cos(angle) * (home.r + 8),
      y = home.y + Math.sin(angle) * (home.r + 8),
      vx = Math.sin(angle) * this.tuning.speed,
      vy = -Math.cos(angle) * this.tuning.speed,
      flight = 0,
      dist = 0;
    const dt = 1 / 120,
      spacing = 12,
      cam = this.camera;
    for (let i = 0; i < 108 && points.length < 22; i++) {
      flight += dt;
      const { x: ax, y: ay } = this.gravityAt(x, y, flight);
      vx += ax * dt;
      vy += ay * dt;
      const speed = Math.hypot(vx, vy);
      if (speed > 400) {
        vx *= 400 / speed;
        vy *= 400 / speed;
      }
      const nx = x + vx * dt,
        ny = y + vy * dt;
      dist += Math.hypot(nx - x, ny - y);
      x = nx;
      y = ny;
      if (x < 31 || x > 389 || y + cam < 119 || y + cam > 643) break;
      let landed = false;
      for (const p of this.planets) {
        if (p.id === this.current && flight < 0.35) continue;
        if (Math.hypot(x - p.x, y - p.y) <= p.r + 8) {
          landed = true;
          break;
        }
      }
      if (landed) {
        points.push({ x, y });
        break;
      }
      if (dist >= spacing) {
        dist -= spacing;
        points.push({ x, y });
      }
    }
    return points;
  }

  step(dt: number) {
    if (this.done) return;
    this.grace = Math.max(0, this.grace - dt);
    if (this.orbit) {
      this.angle -= this.tuning.orbit * dt;
      const p = this.planet;
      this.ball.x = p.x + Math.cos(this.angle) * (p.r + 8);
      this.ball.y = p.y + Math.sin(this.angle) * (p.r + 8);
    } else {
      const b = this.ball;
      this.flight += dt;
      const { x: ax, y: ay } = this.gravityAt(b.x, b.y);
      b.vx += ax * dt;
      b.vy += ay * dt;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > 400) {
        b.vx *= 400 / speed;
        b.vy *= 400 / speed;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // A miss resolves in the very first fixed step outside the visible arena.
      // Check before landing: an off-screen planet must not swallow a lost shot.
      if (
        b.x < 31 ||
        b.x > 389 ||
        b.y + this.camera < 119 ||
        b.y + this.camera > 643
      ) {
        this.rescue("edge");
        return;
      }
      for (const p of this.planets) {
        if (p.id === this.current && this.flight < 0.35) continue;
        if (Math.hypot(b.x - p.x, b.y - p.y) <= p.r + 8) {
          this.current = p.id;
          this.angle = Math.atan2(b.y - p.y, b.x - p.x);
          this.orbit = true;
          if (p.id > this.highest) {
            this.score += (p.id - this.highest) * 100;
            this.highest = p.id;
            this.extend();
          }
          break;
        }
      }
      if (!this.orbit && this.flight > 5) this.rescue("timeout");
    }
    const target = Math.max(0, 540 - this.planet.y);
    this.camera += (target - this.camera) * (1 - Math.exp(-5.5 * dt));
  }
}
