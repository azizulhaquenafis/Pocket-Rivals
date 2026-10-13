import type { Course, Point, Rect } from "./courses";
import type { GolfDifficulty } from "./GolfRules";
import { difficulties } from "./GolfRules";
import { inside, overlaps, distance, clamp, type Ball } from "./GolfCollision";
export class GolfDynamics {
  time = 0;
  gate = 0;
  plates = [false, false, false];
  doors = [0, 0];
  doorVelocity = [0, 0];
  planks = Array(10).fill(0) as number[];
  sink = 0;
  portalCooldown = 0;
  ufo = {
    active: false,
    done: false,
    warning: false,
    event: -1,
    next: 11.5,
    started: 0,
    cooldown: 0,
    x: -120,
    y: 990,
    direction: 1,
    hover: 0,
    carry: 0,
    section: 0,
    used: false,
  };
  constructor(
    readonly course: Course,
    readonly difficulty: GolfDifficulty,
    private random: () => number = Math.random,
    readonly seed?: number,
  ) {}
  private eventRandom(salt: number) {
    if (this.seed === undefined) return this.random();
    let n =
      (this.seed ^
        Math.imul(this.ufo.event + 1, 0x9e3779b9) ^
        Math.imul(salt, 0x85ebca6b)) >>>
      0;
    n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
    return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
  }
  mover(i: number) {
    const m = this.course.movers[i];
    let offset = 0;
    if (this.course.id === "shoreline")
      offset = [20 / 110, 90 / 130, 350 / 130, 50 / 150][i];
    const phase = ((this.time + offset) / m.seconds) % 2,
      t = phase <= 1 ? phase : 2 - phase,
      dir = phase < 1 ? 1 : -1,
      speed = difficulties[this.difficulty].speed;
    return {
      ...m,
      x: m.from.x + (m.to.x - m.from.x) * t,
      y: m.from.y + (m.to.y - m.from.y) * t,
      vx: (((m.to.x - m.from.x) * dir) / m.seconds) * speed,
      vy: (((m.to.y - m.from.y) * dir) / m.seconds) * speed,
    };
  }
  laser(i: number) {
    return (this.time + this.course.lasers[i].phase) % 3 >= 1.6;
  }
  bridgeSafe() {
    return this.time % 8 < 3.5 || this.time % 8 >= 7.5;
  }
  piston() {
    const p = this.course.piston;
    if (!p) return null;
    const extend = p.extension / 900,
      retract = p.extension / 250,
      phase = this.time % (1.5 + extend + retract);
    let width = 0,
      vx = 0;
    if (phase >= 1.2 && phase < 1.2 + extend) {
      width = (phase - 1.2) * 900;
      vx = 900;
    } else if (phase >= 1.2 + extend && phase < 1.5 + extend)
      width = p.extension;
    else if (phase >= 1.5 + extend) {
      width = p.extension - (phase - 1.5 - extend) * 250;
      vx = -250;
    }
    return {
      ...p,
      w: p.w + width,
      vx: vx * difficulties[this.difficulty].speed,
    };
  }
  door(i: number): Rect {
    return {
      ...this.course.doors![i],
      y: this.course.doors![i].y + this.doors[i] * 100,
    };
  }
  safe(p: Point) {
    const c = this.course;
    if (c.river && inside(p, c.river))
      return !!c.planks?.some((row, b) =>
        row.some(
          (r, i) => inside(p, r) && this.planks[b * 5 + i] < [0.5, 0.2][b],
        ),
      );
    if (!c.ground) return p.x >= 0 && p.x <= 1920 && p.y >= 70 && p.y <= 1080;
    return (
      c.ground.some((r) => inside(p, r)) ||
      !!c.bridges?.some((r) => this.bridgeSafe() && inside(p, r)) ||
      c.surfaces.some((r) => r.kind === "ford" && inside(p, r))
    );
  }
  update(dt: number, b: Ball, lastShot: Point = this.course.start) {
    const t = dt * difficulties[this.difficulty].speed;
    this.time += t;
    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    this.gate = Math.max(0, this.gate - t);
    this.planks.forEach((v, i) => {
      if (v > 0)
        this.planks[i] = v + t >= [0.5, 0.2][Math.floor(i / 5)] + 5 ? 0 : v + t;
    });
    this.course.doors?.forEach((r, i) => {
      const open = i === 0 ? this.gate > 0 : this.plates[1] && this.plates[2],
        old = this.doors[i];
      if (open) this.doors[i] = Math.min(1, old + 2 * t);
      else if (!overlaps(b, r, 9)) this.doors[i] = Math.max(0, old - 2 * t);
      this.doorVelocity[i] = ((this.doors[i] - old) * 100) / dt;
    });
    if (this.course.id === "horizon") this.updateUfo(t, b, lastShot);
  }
  private updateUfo(dt: number, b: Ball, lastShot: Point) {
    const u = this.ufo;
    const config = this.course.ufo!;
    const next = u.event < 0 ? config.first : u.next;
    u.warning =
      !u.active && this.time >= next - config.warning && this.time < next;
    u.cooldown = Math.max(0, u.cooldown - dt);
    if ((!u.done || u.event >= 0) && !u.active && this.time >= next) {
      u.event++;
      u.next = next + config.interval;
      u.started = this.time;
      u.warning = false;
      u.used = false;
      u.hover = 0;
      u.done = true;
      u.active = true;
      u.direction = this.eventRandom(1) < 0.5 ? 1 : -1;
      u.x = u.direction === 1 ? -120 : 2040;
      const lane =
        this.course.ground![[0, 2, 4, 6][Math.floor(this.eventRandom(2) * 4)]];
      u.y = lane.y + lane.h / 2;
    }
    if (!u.active) return;
    u.x += u.direction * config.speed * dt;
    if (u.carry > 0) {
      u.carry -= dt;
      b.x = u.x;
      b.y = u.y;
      b.vx = b.vy = 0;
      if (u.carry <= 0) {
        let section = u.section + (this.eventRandom(3) < 0.5 ? -1 : 1);
        if (section < 0) section = 1;
        if (section > 10) section = 9;
        if (section === 9) section = this.eventRandom(4) < 0.5 ? 8 : 10;
        const r = this.course.ground![section];
        let target: Point | null = null;
        for (let n = 0; n < 30; n++) {
          const p = {
            x: r.x + 20 + this.eventRandom(10 + n * 2) * (r.w - 40),
            y: r.y + 20 + this.eventRandom(11 + n * 2) * (r.h - 40),
          };
          if (this.dropSafe(p)) {
            target = p;
            break;
          }
        }
        if (!target) target = { ...lastShot };
        b.x = target.x;
        b.y = target.y;
      }
      return;
    }
    if (
      !u.used &&
      u.cooldown === 0 &&
      b.vx === 0 &&
      b.vy === 0 &&
      distance(b, u) < 80
    ) {
      u.hover += dt;
      if (u.hover >= config.hover) {
        u.used = true;
        u.carry = config.carry;
        u.cooldown = config.cooldown;
        this.course.ground!.forEach((r, i) => {
          if (inside(b, r)) u.section = i;
        });
      }
    } else u.hover = 0;
    if (
      u.carry <= 0 &&
      (u.x > 2040 || u.x < -120 || this.time - u.started >= config.duration)
    )
      u.active = false;
  }
  private dropSafe(p: Point) {
    const c = this.course;
    return (
      this.safe(p) &&
      distance(p, c.hole) > 40 &&
      !c.fields.some((f) => f.core && distance(p, f) < f.core + 30) &&
      !c.lasers.some((r) => overlaps(p, r, 30)) &&
      !c.circles.some((v) => distance(p, v) < v.r + 30) &&
      !c.movers.some(
        (_, i) => distance(p, this.mover(i)) < (this.mover(i).r ?? 0) + 30,
      ) &&
      !c.fans.some((f) => distance(p, f) < f.length / 2 + 30) &&
      !c.portals?.some((v) => distance(p, v.from) < 56) &&
      !c.surfaces.some((r) => r.kind === "wind" && inside(p, r))
    );
  }
  recovery(last: Point): Point {
    const c = this.course,
      p = { ...last };
    c.movers.forEach((m) => {
      const dx = m.to.x - m.from.x,
        dy = m.to.y - m.from.y,
        len = Math.hypot(dx, dy),
        a = clamp(
          ((p.x - m.from.x) * dx + (p.y - m.from.y) * dy) / (len * len),
          0,
          1,
        ),
        q = { x: m.from.x + a * dx, y: m.from.y + a * dy };
      if (m.r && distance(p, q) < m.r + 9) {
        let nx = -dy / len,
          ny = dx / len;
        if ((p.x - q.x) * nx + (p.y - q.y) * ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        p.x = q.x + nx * (m.r + 9);
        p.y = q.y + ny * (m.r + 9);
      } else if (
        m.w &&
        inside(p, {
          x: Math.min(m.from.x, m.to.x) - 9,
          y: m.from.y - 9,
          w: Math.abs(dx) + m.w + 18,
          h: (m.h ?? 0) + 18,
        })
      ) {
        p.y =
          p.y < m.from.y + (m.h ?? 0) / 2
            ? m.from.y - 9
            : m.from.y + (m.h ?? 0) + 9;
      }
    });
    c.fans.forEach((f) => {
      const sweep = f.length / 2 + 9;
      if (distance(p, f) < sweep) {
        if (c.id === "horizon") p.x = f.x + (p.x < f.x ? -sweep : sweep);
        else p.y = f.y + (p.y < f.y ? -sweep : sweep);
      }
    });
    if (
      c.piston &&
      inside(p, {
        ...c.piston,
        w: c.piston.w + c.piston.extension + 9,
        x: c.piston.x - 9,
        y: c.piston.y - 9,
        h: c.piston.h + 18,
      })
    )
      p.y =
        p.y < c.piston.y + c.piston.h / 2
          ? c.piston.y - 9
          : c.piston.y + c.piston.h + 9;
    if (c.lasers.some((r) => overlaps(p, r))) return { ...c.start };
    if (!this.safe(p)) {
      if (c.river && inside(p, c.river)) {
        if (p.y >= 165 && p.y <= 255) return { x: 590, y: 210 };
        if (p.y >= 915 && p.y <= 1005) return { x: 590, y: 960 };
      }
      return { ...c.start };
    }
    return p;
  }
}
