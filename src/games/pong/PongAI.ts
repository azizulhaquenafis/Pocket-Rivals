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
  private reaction = 0;
  private target = 210;
  private control = 210;
  private motion = new MotionController(210, 0);
  private aimError = 0;
  private lastHits = -1;
  constructor(
    private difficulty: Difficulty,
    private random = Math.random,
  ) {}
  reset() {
    this.reaction = 0;
    this.target = this.control = 210;
    this.motion.reset(210, 0);
    this.lastHits = -1;
  }
  update(dt: number, w: PongWorld) {
    const settings = {
      medium: { delay: 0.2, error: 48, speed: 580 },
      hard: { delay: 0.075, error: 12, speed: 1050 },
      impossible: { delay: 0.018, error: 0, speed: 1750 },
    }[this.difficulty];
    if (w.cooldown > 0) {
      this.target = 210;
      this.lastHits = -1;
    }
    this.reaction -= dt;
    if (this.reaction <= 0 && w.cooldown <= 0) {
      this.reaction = settings.delay;
      const b = w.ball,
        p = w.paddles[1];
      const t = b.vy < 0 ? Math.max(0, (p.y + 16 - b.y) / b.vy) : 0;
      this.target =
        b.vy < 0
          ? reflectedX(b.x + b.vx * t, FIELD.left + b.r, FIELD.right - b.r)
          : 210 + (b.x - 210) * 0.25;
      if (w.hits !== this.lastHits) {
        this.lastHits = w.hits;
        this.aimError = (this.random() - 0.5) * settings.error * 2;
      }
      this.target += this.aimError;

      this.target = clamp(this.target, FIELD.left + 44, FIELD.right - 44);
    }
    this.control = clamp(
      this.motion.move(dt, w.paddles[1].x, 0, this.target, 0, settings.speed).x,
      68,
      352,
    );
    return this.control;
  }
}
