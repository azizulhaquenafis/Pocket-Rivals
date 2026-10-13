import type {
  AIController,
  Difficulty,
} from "../../shared/contracts/AIController";
import type { HockeyWorld, Vec } from "./AirHockeyPhysics";
import { MotionController } from "../../shared/physics/MotionController";
import { clamp } from "../../shared/physics/FixedStep";
import { FIELD } from "../../core/ThemeManager";
function reflect(x: number) {
  const width = 350,
    phase = (((x - 35) % (2 * width)) + 2 * width) % (2 * width);
  return 35 + (phase <= width ? phase : 2 * width - phase);
}
export class AirHockeyAI implements AIController<HockeyWorld, Vec> {
  private motion = new MotionController(210, 183);
  private attacking = false;
  private error = 0;
  private reaction = 0;
  private target: Vec = { x: 210, y: 180 };
  constructor(
    private difficulty: Difficulty,
    private random = Math.random,
  ) {}
  reset() {
    this.reaction = 0;
    this.target = { x: 210, y: 183 };
    this.motion.reset(210, 183);
    this.attacking = false;
  }
  update(dt: number, w: HockeyWorld) {
    const cfg = {
      medium: { delay: 0.19, error: 24, speed: 530 },
      hard: { delay: 0.065, error: 7, speed: 1050 },
      impossible: { delay: 0.02, error: 0, speed: 1450 },
    }[this.difficulty];
    const p = w.puck,
      m = w.mallets[1];
    this.reaction -= dt;
    if (w.cooldown > 0) {
      this.target = { x: 210, y: 183 };
      this.attacking = false;
    }
    if (this.reaction <= 0 && w.cooldown <= 0) {
      this.reaction = cfg.delay;
      if (p.vy < -60 && p.y < 480) {
        const t = Math.max(0, (155 - p.y) / p.vy);
        this.target = { x: reflect(p.x + p.vx * t), y: 155 };
      } else if (p.y < FIELD.middle + 10) {
        // Approach behind the puck, then drive downfield; route around it when caught in front.
        if (m.y < p.y - 43) this.attacking = true;
        else if (m.y > p.y + 30) this.attacking = false;
        if (!this.attacking) {
          const side = m.x < p.x ? -1 : 1;
          this.target = { x: p.x + side * 65, y: Math.max(143, p.y - 58) };
        } else
          this.target = {
            x: p.x + (p.x - 210) * 0.13,
            y: Math.min(352, p.y + 34),
          };
      } else this.target = { x: 210 + (p.x - 210) * 0.35, y: 180 };
      this.error += ((this.random() - 0.5) * cfg.error * 2 - this.error) * 0.15;
      this.target.x += this.error;
      this.target.x = clamp(this.target.x, 53, 367);
      this.target.y = clamp(this.target.y, 141, 352);
    }
    const next = this.motion.move(
      dt,
      m.x,
      m.y,
      this.target.x,
      this.target.y,
      cfg.speed,
    );
    return { x: clamp(next.x, 53, 367), y: clamp(next.y, 141, 352) };
  }
}
