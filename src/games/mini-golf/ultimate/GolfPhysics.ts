import type { Course, Point } from "./courses";
import { oil } from "./courses/foundry";
import { GolfDynamics } from "./GolfDynamics";
import {
  cap,
  inside,
  distance,
  overlaps,
  hitCircle,
  hitRect,
  hitRotated,
  MAX_SPEED,
  type Ball,
} from "./GolfCollision";
import {
  difficulties,
  strokeLimit,
  scoreFor,
  type GolfDifficulty,
} from "./GolfRules";
export class GolfPhysics {
  readonly ball: Ball;
  readonly dynamics: GolfDynamics;
  lastShot: Point;
  strokes = 0;
  status: "playing" | "won" | "lost" = "playing";
  message = "";
  messageTime = 0;
  impacts = 0;
  recoveries = 0;
  private accumulator = 0;
  constructor(
    readonly course: Course,
    readonly difficulty: GolfDifficulty = 1,
    random: () => number = Math.random,
  ) {
    this.ball = { ...course.start, vx: 0, vy: 0 };
    this.lastShot = { ...course.start };
    this.dynamics = new GolfDynamics(course, difficulty, random);
  }
  get limit() {
    return strokeLimit(this.course, this.difficulty);
  }
  get score() {
    return this.status === "won"
      ? scoreFor(this.course, this.strokes, this.difficulty)
      : 0;
  }
  get stopped() {
    return (
      this.ball.vx === 0 && this.ball.vy === 0 && this.dynamics.ufo.carry <= 0
    );
  }
  get shootable() {
    return (
      this.status === "playing" && this.stopped && this.strokes < this.limit
    );
  }
  shoot(vx: number, vy: number) {
    if (
      !this.shootable ||
      !Number.isFinite(vx) ||
      !Number.isFinite(vy) ||
      Math.hypot(vx, vy) < 43.75
    )
      return false;
    this.lastShot = { x: this.ball.x, y: this.ball.y };
    this.ball.vx = vx;
    this.ball.vy = vy;
    cap(this.ball);
    this.strokes++;
    return true;
  }
  advance(seconds: number) {
    this.accumulator += Math.min(0.1, Math.max(0, seconds));
    while (this.accumulator + 1e-10 >= 1 / 240) {
      this.tick(1 / 240);
      this.accumulator -= 1 / 240;
    }
  }
  resetAccumulator() {
    this.accumulator = 0;
  }
  private recover(message: string) {
    const p = this.dynamics.recovery(this.lastShot);
    Object.assign(this.ball, p, { vx: 0, vy: 0 });
    this.dynamics.sink = 0;
    this.dynamics.plates[1] = this.dynamics.plates[2] = false;
    this.message = message;
    this.messageTime = 1.5;
    this.recoveries++;
  }
  tick(dt: number) {
    if (this.status !== "playing") return;
    const b = this.ball,
      c = this.course,
      d = this.dynamics;
    d.update(dt, b, this.lastShot);
    this.messageTime = Math.max(0, this.messageTime - dt);
    if (d.ufo.carry > 0) {
      this.message = "A lift from the locals";
      this.messageTime = 1;
      return;
    }
    let friction = 110,
      pushed = false,
      quicksand = false;
    for (const s of c.surfaces) {
      if (inside(b, s)) {
        if (s.friction !== undefined) friction = s.friction;
        if (s.kind === "quicksand") quicksand = true;
        if (s.push) {
          b.vx += s.push.x * dt;
          b.vy += s.push.y * dt;
          pushed = true;
        }
      }
    }
    if (c.id === "foundry" && distance(b, oil) < oil.r) friction = 20;
    for (const f of c.fields) {
      const dist = distance(b, f);
      if (
        dist < f.r &&
        dist > (f.core ?? 0) + 8 &&
        (!f.movingOnly || !this.stopped)
      ) {
        const force = f.strength * (f.quadratic ? (1 - dist / f.r) ** 2 : 1);
        b.vx += ((f.x - b.x) / dist) * force * dt;
        b.vy += ((f.y - b.y) / dist) * force * dt;
        if (!f.movingOnly) pushed = true;
      }
    }
    if (
      c.bridges &&
      d.time % 8 >= 3 &&
      d.time % 8 < 4 &&
      !c.ground?.some((r) => inside(b, r)) &&
      Math.hypot(b.vx, b.vy) < 150
    )
      c.bridges.forEach((r, i) => {
        if (inside(b, r)) {
          b.vy += (i === 0 ? -400 : 400) * dt;
          pushed = true;
        }
      });
    cap(b);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const speed = Math.hypot(b.vx, b.vy),
      next = Math.max(0, speed - friction * dt);
    if (speed) {
      b.vx *= next / speed;
      b.vy *= next / speed;
    }
    if (!pushed && next < 6) b.vx = b.vy = 0;
    c.planks?.forEach((row, bank) =>
      row.forEach((r, i) => {
        if (inside(b, r) && d.planks[bank * 5 + i] === 0)
          d.planks[bank * 5 + i] = 0.001;
      }),
    );
    c.plates?.forEach((p, i) => {
      if (distance(b, p) < 26) {
        if (i === 0) d.gate = 6;
        else d.plates[i] = true;
      }
    });
    if (c.portals && d.portalCooldown === 0) {
      for (const portal of c.portals)
        if (distance(b, portal.from) < 26) {
          const a = (portal.angle * Math.PI) / 180,
            s = Math.max(80, Math.hypot(b.vx, b.vy));
          b.x = portal.to.x + Math.cos(a) * 35;
          b.y = portal.to.y + Math.sin(a) * 35;
          b.vx = Math.cos(a) * s;
          b.vy = Math.sin(a) * s;
          d.portalCooldown = 0.5;
          break;
        }
    }
    if (!d.safe(b)) {
      this.recover(
        c.id === "horizon"
          ? "Lost in space — try again"
          : "Splash! Back to your last shot",
      );
      return;
    }
    if (c.lava?.some((v) => distance(b, v) < v.r - 5)) {
      this.recover("Too hot! Try another line");
      return;
    }
    if (c.lasers.some((r, i) => d.laser(i) && overlaps(b, r))) {
      this.recover(
        c.id === "temple" ? "Caught by the darts" : "Watch the red gate",
      );
      return;
    }
    if (quicksand && this.stopped) {
      d.sink += dt;
      if (d.sink >= 3) {
        this.recover("Quicksand! Keep moving");
        return;
      }
    } else d.sink = 0;
    let impact = false;
    for (const v of c.circles)
      impact = hitCircle(b, v, v.r, v.bounce ?? 1) || impact;
    for (let i = 0; i < c.movers.length; i++) {
      const m = d.mover(i);
      impact =
        (m.r
          ? hitCircle(b, m, m.r, 1, m.vx, m.vy)
          : hitRect(b, { ...m, w: m.w!, h: m.h! }, m.vx, m.vy)) || impact;
    }
    for (const f of c.fans) {
      const angle = (d.time * f.spin * Math.PI) / 180,
        spin = ((f.spin * Math.PI) / 180) * difficulties[this.difficulty].speed;
      impact = hitCircle(b, f, f.hub) || impact;
      impact = hitRotated(b, f, f.length, 12, angle, spin) || impact;
      impact =
        hitRotated(b, f, f.length, 12, angle + Math.PI / 2, spin) || impact;
    }
    if (c.diamond)
      impact =
        hitRotated(
          b,
          c.diamond,
          c.diamond.r * Math.SQRT2,
          c.diamond.r * Math.SQRT2,
          Math.PI / 4,
        ) || impact;
    const piston = d.piston();
    if (piston) impact = hitRect(b, piston, piston.vx) || impact;
    c.doors?.forEach((_, i) => {
      impact = hitRect(b, d.door(i), 0, d.doorVelocity[i]) || impact;
    });
    for (const f of c.fields)
      if (f.core) {
        const contact = distance(b, f) < f.core + 7;
        impact = hitCircle(b, f, f.core) || impact;
        if (contact && c.id === "foundry") b.vx = b.vy = 0;
      }
    // Two projection passes resolve adjacent faces; reflect only approaching contacts.
    for (let pass = 0; pass < 2; pass++)
      for (const r of c.walls) impact = hitRect(b, r) || impact;
    if (impact) this.impacts++;
    if (
      !Number.isFinite(b.x + b.y + b.vx + b.vy) ||
      b.x < -100 ||
      b.x > 2020 ||
      b.y < -100 ||
      b.y > 1180
    ) {
      this.recover("Ball recovered");
      return;
    }
    if (Math.abs(b.x - c.hole.x) < 8.25 && Math.abs(b.y - c.hole.y) < 8.25) {
      Object.assign(b, c.hole, { vx: 0, vy: 0 });
      this.status = "won";
    } else if (this.strokes >= this.limit && this.stopped) this.status = "lost";
  }
  preview(velocity: Point): Point[] {
    const seconds = difficulties[this.difficulty].preview;
    if (!seconds || !this.shootable) return [];
    const ghost = new GolfPhysics(this.course, this.difficulty, () => 0.5);
    Object.assign(ghost.ball, this.ball);
    ghost.lastShot = { ...this.lastShot };
    ghost.dynamics.time = this.dynamics.time;
    ghost.dynamics.portalCooldown = this.dynamics.portalCooldown;
    ghost.dynamics.ufo.done = true;
    if (!ghost.shoot(velocity.x, velocity.y)) return [];
    const points: Point[] = [];
    for (let i = 0; i < seconds * 240; i++) {
      ghost.tick(1 / 240);
      if (
        ghost.impacts ||
        ghost.recoveries ||
        ghost.dynamics.portalCooldown > this.dynamics.portalCooldown ||
        ghost.status !== "playing"
      )
        break;
      if (i % 4 === 0) points.push({ x: ghost.ball.x, y: ghost.ball.y });
    }
    return points;
  }
  snapshot() {
    return {
      course: this.course.id,
      difficulty: this.difficulty,
      ball: { ...this.ball },
      strokes: this.strokes,
      limit: this.limit,
      status: this.status,
      time: this.dynamics.time,
      plates: [...this.dynamics.plates],
      gate: this.dynamics.gate,
      doors: [...this.dynamics.doors],
      recoveries: this.recoveries,
      shootable: this.shootable,
    };
  }
}
