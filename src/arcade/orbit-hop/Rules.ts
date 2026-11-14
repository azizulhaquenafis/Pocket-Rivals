import type { Difficulty } from "../../shared/contracts/AIController";
export interface Planet {
  id: number;
  x: number;
  y: number;
  r: number;
}
export const ORBIT_TIERS = {
  medium: {
    radius: 27,
    gap: 188,
    spread: 132,
    field: 62,
    pull: 420,
    speed: 290,
    orbit: 1.05,
  },
  hard: {
    radius: 23,
    gap: 204,
    spread: 164,
    field: 48,
    pull: 390,
    speed: 305,
    orbit: 1.4,
  },
  impossible: {
    radius: 19,
    gap: 218,
    spread: 188,
    field: 36,
    pull: 360,
    speed: 320,
    orbit: 1.75,
  },
} as const;
export class OrbitWorld {
  planets: Planet[] = [{ id: 0, x: 210, y: 540, r: 35 }];
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
  ball = { x: 253, y: 540, vx: 0, vy: 0 };
  constructor(
    private random = Math.random,
    readonly difficulty: Difficulty = "medium",
  ) {
    this.planets[0].r = this.tuning.radius + 3;
    this.ball.x = 210 + this.planets[0].r + 8;
    this.extend();
  }
  get tuning() {
    return ORBIT_TIERS[this.difficulty];
  }
  fieldRadius(p: Planet) {
    return p.r + this.tuning.field;
  }
  /** Finite, smoothly tapered gravity. Outside a halo, flight is ballistic. */
  gravityAt(x: number, y: number) {
    let ax = 0,
      ay = 0;
    for (const p of this.planets) {
      if (p.id === this.current && this.flight < 0.3) continue;
      const dx = p.x - x,
        dy = p.y - y,
        d = Math.hypot(dx, dy);
      const radius = this.fieldRadius(p);
      if (d <= 1 || d >= radius) continue;
      const t = Math.min(1, (radius - d) / (radius - p.r - 8));
      const a = this.tuning.pull * t * t * (3 - 2 * t);
      ax += (a * dx) / d;
      ay += (a * dy) / d;
    }
    return { x: ax, y: ay };
  }
  get planet() {
    return this.planets.find((p) => p.id === this.current)!;
  }
  private extend() {
    while (this.planets.at(-1)!.id < this.highest + 5) {
      const p = this.planets.at(-1)!;
      this.planets.push({
        id: p.id + 1,
        x: Math.max(
          96,
          Math.min(324, p.x + (this.random() - 0.5) * this.tuning.spread),
        ),
        y: p.y - this.tuning.gap - this.random() * 28,
        r: this.tuning.radius + this.random() * 4,
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
    this.ball.vx = Math.sin(this.angle) * this.tuning.speed;
    this.ball.vy = -Math.cos(this.angle) * this.tuning.speed;
    return true;
  }
  private rescue() {
    this.lives--;
    if (!this.lives) {
      this.done = true;
      return;
    }
    this.orbit = true;
    this.angle = 0;
    this.grace = 0.45;
    this.camera = Math.max(0, 540 - this.planet.y);
    const p = this.planet;
    this.ball = { x: p.x + p.r + 8, y: p.y, vx: 0, vy: 0 };
  }
  preview() {
    const c = new OrbitWorld(() => 0.5, this.difficulty);
    c.planets = this.planets.map((p) => ({ ...p }));
    c.current = this.current;
    c.highest = this.highest;
    c.angle = this.angle;
    c.ball = { ...this.ball };
    c.camera = this.camera;
    c.launch();
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 96 && !c.orbit && c.lives === 3; i++) {
      c.step(1 / 120);
      if (i % 6 === 0 && !c.orbit && c.lives === 3)
        points.push({ x: c.ball.x, y: c.ball.y });
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
        this.rescue();
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
      if (!this.orbit && this.flight > 5) this.rescue();
    }
    const target = Math.max(0, 540 - this.planet.y);
    this.camera += (target - this.camera) * (1 - Math.exp(-5 * dt));
  }
}
