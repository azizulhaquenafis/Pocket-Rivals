import type { Difficulty } from "../../shared/contracts/AIController";
export interface Planet {
  id: number;
  x: number;
  y: number;
  r: number;
}
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
    this.extend();
  }
  get planet() {
    return this.planets.find((p) => p.id === this.current)!;
  }
  private extend() {
    while (this.planets.at(-1)!.id < this.highest + 5) {
      const p = this.planets.at(-1)!;
      this.planets.push({
        id: p.id + 1,
        x: Math.max(85, Math.min(335, p.x + (this.random() - 0.5) * 150)),
        y: p.y - 145 - this.random() * 25,
        r:
          { medium: 30, hard: 26, impossible: 23 }[this.difficulty] +
          this.random() * 8,
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
    this.ball.vx = Math.sin(this.angle) * 270;
    this.ball.vy = -Math.cos(this.angle) * 270;
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
      this.angle -=
        { medium: 1.05, hard: 1.4, impossible: 1.75 }[this.difficulty] * dt;
      const p = this.planet;
      this.ball.x = p.x + Math.cos(this.angle) * (p.r + 8);
      this.ball.y = p.y + Math.sin(this.angle) * (p.r + 8);
    } else {
      const b = this.ball;
      this.flight += dt;
      let ax = 0,
        ay = 0;
      for (const p of this.planets) {
        const dx = p.x - b.x,
          dy = p.y - b.y,
          d = Math.hypot(dx, dy);
        if (d > 1) {
          const a = Math.min(160, 180000 / (d * d));
          ax += (a * dx) / d;
          ay += (a * dy) / d;
        }
      }
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
