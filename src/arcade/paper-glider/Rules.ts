import type { Difficulty } from "../../shared/contracts/AIController";

export const GLIDER_TIERS = {
  medium: {
    speed: 84,
    speedStep: 4,
    maxSpeed: 118,
    gap: 148,
    gapStep: 9,
    minGap: 82,
    ring: 38,
    wind: 52,
    windStep: 4,
    maxWind: 80,
    landing: 64,
    landingStep: 3.5,
    minLanding: 42,
    steerAccel: 560,
  },
  hard: {
    speed: 104,
    speedStep: 5,
    maxSpeed: 142,
    gap: 128,
    gapStep: 8,
    minGap: 72,
    ring: 31,
    wind: 70,
    windStep: 5,
    maxWind: 98,
    landing: 54,
    landingStep: 3,
    minLanding: 38,
    steerAccel: 620,
  },
  impossible: {
    speed: 124,
    speedStep: 6,
    maxSpeed: 164,
    gap: 112,
    gapStep: 7,
    minGap: 64,
    ring: 26,
    wind: 86,
    windStep: 6,
    maxWind: 112,
    landing: 46,
    landingStep: 2.5,
    minLanding: 34,
    steerAccel: 700,
  },
} as const;

export interface GliderCrash {
  x: number;
  y: number;
  vx: number;
  reason: "wall" | "miss";
  final: boolean;
}

const LINEAR_DRAG = 2.6;
const QUAD_DRAG = 0.0085;

export class GliderWorld {
  x = 210;
  y = 0;
  vx = 0;
  bank = 0;
  level = 1;
  score = 0;
  lives = 3;
  done = false;
  time = 0;
  flightTime = 0;
  recovery = 0;
  transition = 0;
  rings = 0;
  pending = 0;
  lastCrash: GliderCrash | null = null;
  private windCurrent = 0;
  private windTarget = 0;
  private windHold = 0;
  readonly settings;
  targets: { x: number; y: number; hit: boolean; passed: boolean }[] = [];
  walls: { x: number; y: number }[] = [];

  constructor(
    readonly difficulty: Difficulty = "medium",
    private random = Math.random,
  ) {
    this.settings = GLIDER_TIERS[difficulty];
    this.course();
  }

  /** Obstacle gate width narrows progressively every level while remaining fair. */
  get gap() {
    const s = this.settings;
    return Math.max(s.minGap, s.gap - (this.level - 1) * s.gapStep);
  }

  /** Landing strip half-width tightens gradually with level. */
  get landingWidth() {
    const s = this.settings;
    return Math.max(s.minLanding, s.landing - (this.level - 1) * s.landingStep);
  }

  /** Base descent speed gently ramps across levels. */
  get descentSpeed() {
    const s = this.settings;
    return Math.min(s.maxSpeed, s.speed + (this.level - 1) * s.speedStep);
  }

  /** Peak crosswind strength for the current level. */
  get maxWind() {
    const s = this.settings;
    return Math.min(s.maxWind, s.wind + (this.level - 1) * s.windStep);
  }

  get length() {
    return 1520 + Math.min(8, this.level - 1) * 75;
  }

  get landing() {
    return 210 + Math.sin(this.level * 1.9) * 72;
  }

  /** Normalized wind force in [-1, 1], shifting slowly and randomly over time. */
  get windRatio() {
    return this.windCurrent;
  }

  /** Horizontal crosswind velocity in px/s (negative = blowing left, positive = right). */
  get wind() {
    return this.windCurrent * this.maxWind;
  }

  private pickNextWind(initial = false) {
    if (initial) {
      const sign = this.random() < 0.5 ? -1 : 1;
      const mag = 0.35 + this.random() * 0.5;
      this.windTarget = sign * mag;
      this.windCurrent = this.windTarget * 0.65;
      this.windHold = 2.8 + this.random() * 3.0;
      return;
    }
    let next = 0;
    for (let tries = 0; tries < 6; tries++) {
      const roll = this.random();
      if (roll < 0.16) {
        // Occasional near-calm lull.
        next = (this.random() - 0.5) * 0.22;
      } else if (roll < 0.66) {
        // Flip to the opposite direction with random strength.
        const sign = this.windTarget >= 0 ? -1 : 1;
        next = sign * (0.28 + this.random() * 0.72);
      } else {
        // Shift strength organically on the same side.
        const sign = this.windTarget >= 0 ? 1 : -1;
        next = sign * (0.2 + this.random() * 0.8);
      }
      if (Math.abs(next - this.windTarget) >= 0.24) break;
    }
    this.windTarget = Math.max(-1, Math.min(1, next));
    this.windHold = 2.6 + this.random() * 3.4;
  }

  course() {
    this.x = 210;
    this.y = 0;
    this.vx = 0;
    this.bank = 0;
    this.flightTime = 0;
    this.rings = 0;
    this.pending = 0;
    this.pickNextWind(true);
    this.targets = [];
    this.walls = [];
    const gateCount = 5 + Math.min(3, Math.floor((this.level - 1) / 2));
    const stepY = (this.length - 440) / gateCount;
    const minWallX = 28 + this.gap / 2 + 8;
    const maxWallX = 392 - this.gap / 2 - 8;
    let prevX = 210;
    for (let i = 0; i < gateCount + 1; i++) {
      const targetX =
        210 -
        Math.sin(i * 2.05 + this.level * 1.4) * 86 +
        Math.cos(i * 1.15 - this.level * 0.8) * 18;
      // Keep consecutive gate shifts fair even when fighting into a headwind.
      const clamped = Math.max(
        minWallX,
        Math.min(maxWallX, prevX + Math.max(-96, Math.min(96, targetX - prevX))),
      );
      prevX = clamped;
      const ringY = 220 + i * stepY;
      this.targets.push({ x: clamped, y: ringY, hit: false, passed: false });
      if (i < gateCount) {
        this.walls.push({ x: clamped, y: ringY + Math.min(92, stepY * 0.44) });
      }
    }
  }

  step(dt: number, steer = 0, brake = false) {
    if (this.done) return;
    this.time += dt;
    if (this.transition) {
      this.transition = Math.max(0, this.transition - dt);
      this.vx *= Math.exp(-7 * dt);
      this.bank *= Math.exp(-8 * dt);
      if (!this.transition) {
        this.level++;
        this.course();
      }
      return;
    }
    if (this.recovery) {
      this.recovery = Math.max(0, this.recovery - dt);
      return;
    }

    const input = Math.max(-1, Math.min(1, steer));
    this.flightTime += dt;
    this.windHold -= dt;
    if (this.windHold <= 0) this.pickNextWind(false);
    this.windCurrent +=
      (this.windTarget - this.windCurrent) * (1 - Math.exp(-0.95 * dt));
    const oldY = this.y;
    const wind = this.wind;

    // Aerodynamic steering + air resistance relative to moving wind:
    // steering WITH wind (low relative airspeed) accelerates smoothly & moves faster;
    // steering AGAINST wind (high relative airspeed) fights stronger quadratic drag.
    const vRel = this.vx - wind;
    const dragAccel =
      -vRel * LINEAR_DRAG - vRel * Math.abs(vRel) * QUAD_DRAG;
    const steerForce = input * this.settings.steerAccel;
    this.vx += (steerForce + dragAccel) * dt;
    this.vx = Math.max(-320, Math.min(320, this.vx));

    const targetBank = Math.max(
      -0.42,
      Math.min(0.42, input * 0.28 + this.vx * 0.0012),
    );
    this.bank += (targetBank - this.bank) * (1 - Math.exp(-10 * dt));

    const nextX = this.x + this.vx * dt;
    if (nextX < 39 || nextX > 381) {
      this.x = Math.max(39, Math.min(381, nextX));
      this.vx *= 0.25;
    } else {
      this.x = nextX;
    }

    this.y += this.descentSpeed * (brake ? 0.56 : 1) * dt;

    for (const r of this.targets) {
      if (!r.passed && oldY < r.y && this.y >= r.y) {
        r.passed = true;
        if (Math.abs(this.x - r.x) <= this.settings.ring) {
          r.hit = true;
          this.rings++;
          this.pending += 40;
        }
      }
    }

    const halfGap = this.gap / 2 - 9;
    for (const w of this.walls) {
      if (
        this.y + 7 >= w.y - 9 &&
        this.y - 7 <= w.y + 9 &&
        Math.abs(this.x - w.x) > halfGap
      ) {
        this.crash("wall");
        return;
      }
    }

    if (this.y >= this.length) {
      this.y = this.length;
      const onPad = Math.abs(this.x - this.landing) < this.landingWidth;
      if (!onPad) {
        this.crash("miss");
        return;
      }
      const centerBonus =
        Math.abs(this.x - this.landing) < this.landingWidth * 0.35 ? 60 : 0;
      this.score += 200 + (this.level - 1) * 25 + this.pending + centerBonus;
      this.transition = 1.05;
    }
  }

  crash(reason: "wall" | "miss" = "wall") {
    this.lastCrash = {
      x: this.x,
      y: this.y,
      vx: this.vx,
      reason,
      final: this.lives <= 1,
    };
    this.lives--;
    if (!this.lives) {
      this.done = true;
      return;
    }
    this.course();
    this.recovery = 0.95;
  }
}
