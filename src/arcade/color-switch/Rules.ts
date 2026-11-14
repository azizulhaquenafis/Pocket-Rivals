import type { Difficulty } from "../../shared/contracts/AIController";
export const COLORS = [0xf49b58, 0x58addb, 0x9ac480, 0xa88dc4];
const TAU = Math.PI * 2;
export const SHAPES = [
  "ring",
  "triangle",
  "shutters",
  "square",
  "wave",
] as const;
export type Shape = (typeof SHAPES)[number];
export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: number;
}
export const COLOR_TIERS = {
  medium: { rotation: 0.55, lane: 88, thickness: 10, guide: true },
  hard: { rotation: 0.83, lane: 70, thickness: 12, guide: false },
  impossible: { rotation: 1.12, lane: 52, thickness: 14, guide: false },
} as const;
const mod = (n: number, d: number) => ((n % d) + d) % d;
/** All distances are world coordinates; camera motion never changes collisions. */
export class ColorWorld {
  x = 210;
  y = 550;
  vx = 0;
  vy = 0;
  floor = 550;
  center = 350;
  angle = 0;
  color = 0;
  score = 0;
  level = 1;
  lives = 3;
  done = false;
  camera = 0;
  grace = 0;
  transition = 0;
  private cameraFrom = 0;
  private xFrom = 210;
  constructor(readonly difficulty: Difficulty = "medium") {}
  get shape(): Shape {
    return SHAPES[(this.level - 1) % SHAPES.length];
  }
  get chapter() {
    return 1 + Math.floor((this.level - 1) / SHAPES.length);
  }
  get settings() {
    return COLOR_TIERS[this.difficulty];
  }
  get laneX() {
    return this.level === 1
      ? 210
      : 210 + Math.sin((this.level - 1) * 1.73) * 39;
  }
  get laneWidth() {
    return this.settings.lane - ((this.level - 1) % 3) * 5;
  }
  get direction() {
    return this.chapter % 2 ? 1 : -1;
  }
  hop() {
    if (!this.done && !this.grace && !this.transition) this.vy = -235;
  }
  get speed() {
    return this.settings.rotation + Math.min(0.48, (this.level - 1) * 0.024);
  }
  ringColor(y: number, x = this.x) {
    return Math.floor(
      mod(Math.atan2(y - this.center, x - this.laneX) - this.angle, TAU) /
        (Math.PI / 2),
    );
  }
  /** Shared visible line geometry, also consumed by circle/segment collision. */
  segments(): Segment[] {
    const parts: Segment[] = [];
    const put = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: number,
    ) =>
      parts.push({
        x1: this.laneX + x1,
        y1: this.center + y1,
        x2: this.laneX + x2,
        y2: this.center + y2,
        color: mod(color, 4),
      });
    if (this.shape === "shutters") {
      // Both barriers retain a complete matching window, including at turnaround.
      const shift = Math.sin(this.angle) * 52;
      for (const side of [-1, 1]) {
        for (let i = -3; i <= 3; i++) {
          const left = i * 50 + shift * side;
          put(left, side * 48, left + 50, side * 48, i + (side < 0 ? 2 : 0));
        }
      }
    } else if (this.shape === "wave") {
      // A full sweep brings every color through even the narrowest lane.
      // Split at exact stripe boundaries as well as curve samples: color windows
      // move continuously, and rendering/collision share those same endpoints.
      const shift = Math.sin(this.angle * 0.7) * 140;
      const xs = Array.from({ length: 25 }, (_, i) => -144 + i * 12);
      for (let band = -3; band <= 7; band++) {
        const x = band * 64 - 144 - shift;
        if (x > -144 && x < 144) xs.push(x);
      }
      xs.sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) {
        const x1 = xs[i - 1],
          x2 = xs[i];
        if (x2 - x1 < 1e-6) continue;
        put(
          x1,
          Math.sin(x1 / 44 + this.angle) * 34,
          x2,
          Math.sin(x2 / 44 + this.angle) * 34,
          Math.floor(((x1 + x2) / 2 + 144 + shift) / 64),
        );
      }
    } else {
      const sides = this.shape === "triangle" ? 3 : 4;
      const radius = this.shape === "square" ? 72 : 75;
      const pieces = this.shape === "triangle" ? 4 : 1;
      for (let side = 0; side < sides; side++) {
        const a = this.angle - Math.PI / 2 + (side * TAU) / sides;
        const b = a + TAU / sides;
        const ax = Math.cos(a) * radius,
          ay = Math.sin(a) * radius;
        const bx = Math.cos(b) * radius,
          by = Math.sin(b) * radius;
        for (let j = 0; j < pieces; j++) {
          put(
            ax + ((bx - ax) * j) / pieces,
            ay + ((by - ay) * j) / pieces,
            ax + ((bx - ax) * (j + 1)) / pieces,
            ay + ((by - ay) * (j + 1)) / pieces,
            Math.floor(((side * pieces + j) * 4) / (sides * pieces)),
          );
        }
      }
    }
    return parts;
  }
  touchesWrongColor(x = this.x, y = this.y): boolean {
    const hitRadius = 8 + this.settings.thickness / 2 + 2;
    if (this.shape === "ring") {
      const distance = Math.hypot(x - this.laneX, y - this.center);
      if (Math.abs(distance - 75) >= hitRadius) return false;
      // Sample the ball's angular footprint, so touching an adjacent wrong color counts.
      const a = Math.atan2(y - this.center, x - this.laneX);
      const spread = Math.asin(Math.min(1, 8 / Math.max(1, distance)));
      return [-spread, 0, spread].some(
        (offset) =>
          Math.floor(mod(a + offset - this.angle, TAU) / (Math.PI / 2)) !==
          this.color,
      );
    }
    return this.segments().some((s) => {
      if (s.color === this.color) return false;
      const dx = s.x2 - s.x1,
        dy = s.y2 - s.y1;
      const t = Math.max(
        0,
        Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / (dx * dx + dy * dy)),
      );
      return Math.hypot(x - s.x1 - t * dx, y - s.y1 - t * dy) < hitRadius;
    });
  }
  step(dt: number, axis = 0) {
    if (this.done) return;
    // Public steps are bounded too, preventing tunneling on a slow frame/test caller.
    const count = Math.max(1, Math.ceil(Math.min(dt, 0.1) * 120));
    for (let i = 0; i < count; i++) this.tick(Math.min(dt, 0.1) / count, axis);
  }
  private tick(dt: number, axis: number) {
    if (this.done) return;
    if (this.transition > 0) {
      this.transition = Math.max(0, this.transition - dt);
      const t = 1 - this.transition / 0.7,
        smooth = t * t * (3 - 2 * t);
      this.camera =
        this.cameraFrom + (550 - this.floor - this.cameraFrom) * smooth;
      this.x = this.xFrom + (this.laneX - this.xFrom) * smooth;
      return;
    }
    this.grace = Math.max(0, this.grace - dt);
    // Keep a continuous phase: fractional-frequency waves must not snap at 2π.
    this.angle += this.speed * this.direction * dt;
    if (this.grace) return;
    this.vx +=
      (Math.max(-1, Math.min(1, axis)) * 125 - this.vx) * Math.min(1, dt * 14);
    this.x = Math.max(
      this.laneX - this.laneWidth / 2,
      Math.min(this.laneX + this.laneWidth / 2, this.x + this.vx * dt),
    );
    this.vy += 520 * dt;
    this.y += this.vy * dt;
    if (this.y > this.floor) {
      this.y = this.floor;
      this.vy = 0;
    }
    if (this.touchesWrongColor()) {
      this.lives--;
      this.x = this.laneX;
      this.y = this.floor;
      this.vx = this.vy = 0;
      this.grace = 0.8;
      if (!this.lives) this.done = true;
    }
    if (!this.grace && this.y < this.center - 94) {
      this.score += 100;
      this.xFrom = this.x;
      this.level++;
      this.floor = this.center - 100;
      this.y = this.floor;
      this.vx = this.vy = 0;
      this.center = this.floor - 200;
      this.cameraFrom = this.camera;
      this.transition = 0.7;
      this.color = (this.color + 1) % 4;
    }
  }
}
