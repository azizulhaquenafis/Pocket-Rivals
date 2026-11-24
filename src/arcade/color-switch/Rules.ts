import type { Difficulty } from "../../shared/contracts/AIController";
import { clamp } from "../../shared/physics/FixedStep";
import {
  CONTOURS,
  EXTENTS,
  pointAt,
  wrap,
  type Contour,
  type Shape,
} from "./Contours";

export const COLORS = [0xf49b58, 0x58addb, 0x9ac480, 0xa88dc4];
export const SHAPES = [
  "ring",
  "triangle",
  "shutters",
  "square",
  "wave",
] as const;
export const COURSE_X = 210;
export const START_Y = 550;
export const BALL_RADIUS = 8;
export const RECOVERY_TIME = 0.32;
export const SWITCH_FLASH_TIME = 0.24;
const FOLLOW_Y = 410;
const FALL_Y = 632;
const START_CENTER = 350;
const HOP_VELOCITY = -260;

export const COLOR_TIERS = {
  medium: {
    lane: 108,
    window: 164,
    speed: 118,
    spacing: 304,
    thickness: 10,
    guide: true,
  },
  hard: {
    lane: 100,
    window: 120,
    speed: 162,
    spacing: 288,
    thickness: 12,
    guide: false,
  },
  impossible: {
    lane: 92,
    window: 96,
    speed: 214,
    spacing: 272,
    thickness: 14,
    guide: false,
  },
} as const;

export interface ColorObstacle {
  shape: Shape;
  center: number;
  extent: number;
  color: number;
  phase: number;
  windowWidth: number;
  clearY: number;
}

// Paint and collision measure the same distance along the fixed outline.
function bandStart(o: ColorObstacle, path: Contour) {
  // The ring, triangle and square each have a single matching band. On the
  // shutters the two bars are half a cycle apart, so their openings alternate.
  const upperShutter = o.shape === "shutters" && path === CONTOURS.shutters[0];
  return (upperShutter ? 0 : path.length / 2) + o.phase - o.windowWidth / 2;
}

export function visitColorBands(
  o: ColorObstacle,
  visit: (path: Contour, from: number, to: number, colorOffset: number) => void,
) {
  for (const path of CONTOURS[o.shape]) {
    const otherWidth = (path.length - o.windowWidth) / (COLORS.length - 1);
    const start = bandStart(o, path);
    for (
      let cycle = start - Math.ceil(start / path.length) * path.length;
      cycle < path.length;
      cycle += path.length
    ) {
      let edge = cycle;
      for (let color = 0; color < COLORS.length; color++) {
        const next = edge + (color === 0 ? o.windowWidth : otherWidth);
        const from = Math.max(0, edge);
        const to = Math.min(path.length, next);
        if (to - from > 1e-6) visit(path, from, to, color);
        edge = next;
      }
    }
  }
}

export function crossing(o: ColorObstacle, entry: boolean) {
  const paths = CONTOURS[o.shape];
  const path = paths[entry ? paths.length - 1 : 0];
  // Centre-line guidance stays fixed while the colors travel past it.
  const point = pointAt(path, path.closed && !entry ? 0 : path.length / 2);
  return { x: COURSE_X, y: o.center + point.y };
}

function contactRadius(thickness: number) {
  return BALL_RADIUS + thickness / 2 + 2;
}

export function touchesWrongColor(
  o: ColorObstacle,
  x: number,
  y: number,
  thickness: number,
) {
  const radius = contactRadius(thickness);
  const localX = x - COURSE_X;
  const localY = y - o.center;
  if (Math.abs(localY) >= o.extent + radius) return false;
  const radiusSquared = radius * radius;

  for (const path of CONTOURS[o.shape]) {
    const start = bandStart(o, path);
    for (let i = 1; i < path.vertices.length; i++) {
      const a = path.vertices[i - 1];
      const b = path.vertices[i];
      if (
        localX < Math.min(a.x, b.x) - radius ||
        localX > Math.max(a.x, b.x) + radius ||
        localY < Math.min(a.y, b.y) - radius ||
        localY > Math.max(a.y, b.y) + radius
      )
        continue;
      const length = b.distance - a.distance;
      const dx = (b.x - a.x) / length;
      const dy = (b.y - a.y) / length;
      const xFromStart = localX - a.x;
      const yFromStart = localY - a.y;
      const normal = xFromStart * dy - yFromStart * dx;
      const reachSquared = radiusSquared - normal * normal;
      if (reachSquared <= 0) continue;

      // Work out which part of this edge lies under the ball. It has to fit
      // entirely inside one matching band, including at contour or color seams.
      const along = a.distance + xFromStart * dx + yFromStart * dy;
      const reach = Math.sqrt(reachSquared);
      const from = Math.max(a.distance, along - reach);
      const to = Math.min(b.distance, along + reach);
      if (from >= to) continue;
      const offset = wrap(from - start, path.length);
      if (offset + to - from > o.windowWidth + 1e-7) return true;
    }
  }
  return false;
}

/** Obstacle positions and the ball share world coordinates throughout the climb. */
export class ColorWorld {
  x = COURSE_X;
  y = START_Y;
  vx = 0;
  vy = 0;
  cleared = 0;
  lives = 3;
  camera = 0;
  grace = 0;
  time = 0;
  switchFlash = 0;
  private cameraTarget = 0;
  private flying = false;
  private bufferedHop = false;

  constructor(readonly difficulty: Difficulty = "medium") {}

  get settings() {
    return COLOR_TIERS[this.difficulty];
  }
  get score() {
    return this.cleared * 100;
  }
  get color() {
    return colorAt(this.cleared);
  }
  get done() {
    return this.lives === 0;
  }

  obstacle(index = this.cleared): ColorObstacle {
    const shape = SHAPES[index % SHAPES.length];
    const tier = this.settings;
    const center = START_CENTER - index * tier.spacing;
    const speed = tier.speed + Math.min(18, index * 1.4);
    const extent = EXTENTS[shape];
    return {
      shape,
      center,
      extent,
      color: colorAt(index),
      phase: (this.time - 0.66) * speed + index * 57,
      // The triangle's tip touches two edges at once, so it needs a longer band.
      windowWidth:
        tier.window + (shape === "triangle" ? 18 : 0) + (index === 0 ? 12 : 0),
      clearY: center - extent - contactRadius(tier.thickness) - 7,
    };
  }

  hop() {
    if (this.done) return;
    if (this.grace > 0) {
      this.bufferedHop = true;
      return;
    }
    this.flying = true;
    this.vy = HOP_VELOCITY;
  }

  clearInput() {
    this.bufferedHop = false;
  }

  step(dt: number, axis = 0) {
    const duration = clamp(dt, 0, 0.1);
    const count = Math.max(1, Math.ceil(duration * 120));
    for (let i = 0; i < count && !this.done; i++)
      this.tick(duration / count, axis);
  }

  private tick(dt: number, axis: number) {
    this.time += dt;
    this.switchFlash = Math.max(0, this.switchFlash - dt);
    if (this.grace > 0) {
      this.grace = Math.max(0, this.grace - dt);
      this.x = COURSE_X;
      this.easeCamera(dt, this.cameraTarget);
      if (this.grace === 0 && this.bufferedHop) {
        this.bufferedHop = false;
        this.hop();
      }
      return;
    }

    this.vx += (clamp(axis, -1, 1) * 125 - this.vx) * Math.min(1, dt * 14);
    const lane = this.settings.lane / 2;
    this.x = clamp(this.x + this.vx * dt, COURSE_X - lane, COURSE_X + lane);
    if (!this.flying) {
      this.easeCamera(dt, this.cameraTarget);
      return;
    }

    const previousY = this.y;
    this.vy = Math.min(390, this.vy + 720 * dt);
    this.y += this.vy * dt;
    if (!this.cleared && this.y >= START_Y) {
      this.y = START_Y;
      this.vy = 0;
      this.flying = false;
      this.cameraTarget = 0;
      this.easeCamera(dt, 0);
      return;
    }

    const obstacle = this.obstacle();
    if (
      (this.cleared > 0 && this.y + this.camera > FALL_Y) ||
      touchesWrongColor(obstacle, this.x, this.y, this.settings.thickness)
    ) {
      this.recover(obstacle);
      return;
    }

    if (previousY >= obstacle.clearY && this.y < obstacle.clearY) {
      this.cleared++;
      this.switchFlash = SWITCH_FLASH_TIME;
    }

    this.cameraTarget = Math.max(this.cameraTarget, FOLLOW_Y - this.y);
    // The opening pad stays reachable when the player falls back before clearing the ring.
    const target = this.cleared
      ? this.cameraTarget
      : Math.min(this.cameraTarget, Math.max(0, 580 - this.y));
    this.easeCamera(dt, target);
  }

  private easeCamera(dt: number, target: number) {
    this.camera += (target - this.camera) * (1 - Math.exp(-16 * dt));
  }

  private recover(obstacle: ColorObstacle) {
    this.lives--;
    this.switchFlash = 0;
    if (this.done) return;
    this.x = COURSE_X;
    this.y = this.cleared
      ? obstacle.center +
        obstacle.extent +
        contactRadius(this.settings.thickness) +
        64
      : START_Y;
    this.vx = this.vy = 0;
    this.cameraTarget = Math.max(0, 526 - this.y);
    // Bring an offscreen respawn into view, then ease to its usual framing.
    this.camera = clamp(
      this.camera,
      Math.max(0, 165 - this.y),
      Math.max(0, 588 - this.y),
    );
    this.flying = false;
    this.grace = RECOVERY_TIME;
  }
}

export function colorAt(index: number) {
  return index % COLORS.length;
}
