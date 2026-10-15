import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type {
  AIController,
  Difficulty,
} from "../../shared/contracts/AIController";
import type { PongWorld } from "./PongPhysics";
import { FIELD } from "../../core/ThemeManager";
import { MotionController } from "../../shared/physics/MotionController";
import { clamp } from "../../shared/physics/FixedStep";
export function reflectedX(x: number, left: number, right: number) {
  const width = right - left,
    phase = (((x - left) % (2 * width)) + 2 * width) % (2 * width);
  return left + (phase <= width ? phase : 2 * width - phase);
}
export class PongAI implements AIController<PongWorld, number> {
  readonly personality: MatchRandom;
  private shotOffset = 0;
  snapshot() {
    return {
      ...this.personality.snapshot(),
      target: this.target,
      shotOffset: this.shotOffset,
    };
  }
  private reaction = 0;
  private target = 210;
  private control = 210;
  private motion = new MotionController(210, 0);
  private aimError = 0;
  private lastHits = -1;
  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
  }
  reset() {
    this.reaction = 0;
    this.target = this.control = 210;
    this.motion.reset(210, 0);
    this.lastHits = -1;
  }
  update(dt: number, w: PongWorld) {
    if (w.done) return w.paddles[1].x;
    const settings = {
      medium: {
        delay: 0.24,
        error: 56,
        speed: 420,
        shotScale: 0.35,
        visionThreshold: FIELD.middle,
      },
      hard: {
        delay: 0.075,
        error: 14,
        speed: 820,
        shotScale: 0.85,
        visionThreshold: FIELD.bottom,
      },
      impossible: {
        delay: 0.018,
        error: 0,
        speed: 1750,
        shotScale: 1.0,
        visionThreshold: FIELD.bottom,
      },
    }[this.difficulty];
    if (w.cooldown > 0) {
      this.target = 210;
      this.lastHits = -1;
    }
    this.reaction -= dt;
    if (this.reaction <= 0 && w.cooldown <= 0) {
      this.reaction = this.personality.sample(
        settings.delay * (0.9 + this.personality.tempo * 0.1),
        settings.delay * 0.15,
        0.012,
      );
      const b = w.ball,
        p = w.paddles[1];
      const t = b.vy < 0 ? Math.max(0, (p.y + 16 - b.y) / b.vy) : 0;
      if (b.vy < 0) {
        const bounceX = reflectedX(
          b.x + b.vx * t,
          FIELD.left + b.r,
          FIELD.right - b.r,
        );
        // While ball is across the net in opponent half, Medium tracks the direct trajectory
        // without anticipating multi-wall bank rebounds until the ball crosses midfield.
        const directX = clamp(
          b.x + b.vx * Math.min(t, 0.4),
          FIELD.left + b.r,
          FIELD.right - b.r,
        );
        this.target = b.y > settings.visionThreshold ? directX : bounceX;
      } else {
        this.target =
          210 +
          (b.x - 210) * [0.38, 0.12, 0.25, 0.3][this.personality.role] +
          this.personality.side * 8;
      }
      if (w.hits !== this.lastHits) {
        this.lastHits = w.hits;
        this.aimError = this.personality.sample(
          0,
          settings.error,
          -settings.error,
        );
        // Lock a shot plan for this incoming flight. Offset impacts send the ball
        // away from the observed opponent; never move the paddle outside its rules.
        const opponent = w.paddles[0],
          direction =
            Math.abs(opponent.x - 210) < 25
              ? this.personality.side
              : opponent.x > 210
                ? -1
                : 1;
        const rawOffset = [21, 5, 14, 25][this.personality.role];
        this.shotOffset = direction * rawOffset * settings.shotScale;
      }
      if (b.vy < 0) {
        this.target += this.aimError;
        // Sacrifice the offensive angle when interception already requires a long chase.
        const intendedTarget = clamp(
          this.target - this.shotOffset,
          FIELD.left + 44,
          FIELD.right - 44,
        );
        const reachable =
          Math.abs(intendedTarget - p.x) < settings.speed * t * 0.65 + 12;
        if (reachable) {
          this.target = intendedTarget;
        } else {
          this.shotOffset = 0;
        }
      }

      this.target = clamp(this.target, FIELD.left + 44, FIELD.right - 44);
    }
    this.control = clamp(
      this.motion.move(
        dt,
        w.paddles[1].x,
        0,
        this.target,
        0,
        settings.speed * (0.94 + this.personality.tempo * 0.03),
      ).x,
      68,
      352,
    );
    return this.control;
  }
}
