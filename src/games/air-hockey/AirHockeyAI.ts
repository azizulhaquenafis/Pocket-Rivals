import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
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
  readonly personality: MatchRandom;
  private approachSide = 1;
  private observedOpponent = 210;
  snapshot() {
    return {
      ...this.personality.snapshot(),
      target: { ...this.target },
      attacking: this.attacking,
    };
  }
  private motion = new MotionController(210, 183);
  private attacking = false;
  private error = 0;
  private reaction = 0;
  private target: Vec = { x: 210, y: 180 };
  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.personality = new MatchRandom(seed);
    this.approachSide = this.personality.side;
  }
  reset() {
    this.reaction = 0;
    this.target = { x: 210, y: 183 };
    this.motion.reset(210, 183);
    this.attacking = false;
  }
  update(dt: number, w: HockeyWorld) {
    if (w.done) return { x: w.mallets[1].x, y: w.mallets[1].y };
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
      this.reaction = this.personality.sample(
        cfg.delay * (0.9 + this.personality.tempo * 0.1),
        cfg.delay * 0.12,
        0.015,
      );
      const role = this.personality.role,
        home = [170, 151, 159, 181][role];
      this.observedOpponent += (w.mallets[0].x - this.observedOpponent) * 0.18;
      if (p.vy < -60 && p.y < 480) {
        const t = Math.max(0, (home - p.y) / p.vy);
        this.target = { x: reflect(p.x + p.vx * t), y: home };
      } else if (p.y < FIELD.middle + 10) {
        // Approach behind the puck, then drive downfield; route around it when caught in front.
        if (m.y < p.y - 43) this.attacking = true;
        else if (m.y > p.y + 30) {
          if (this.attacking)
            this.approachSide =
              Math.abs(m.x - p.x) > 20
                ? m.x < p.x
                  ? -1
                  : 1
                : this.personality.side;
          this.attacking = false;
        }
        if (!this.attacking) {
          const side = this.approachSide;
          this.target = {
            x: p.x + side * [62, 75, 68, 72][role],
            y: Math.max(143, p.y - 58),
          };
        } else
          this.target = {
            // Aim through the puck toward open goal space, using the real mallet.
            x:
              p.x +
              (210 - (this.observedOpponent - 210) * 0.35 - p.x) *
                [0.15, 0.08, 0.12, 0.18][role],
            y: Math.min(352, p.y + 34),
          };
      } else
        this.target = {
          x:
            210 +
            (p.x - 210) * [0.4, 0.16, 0.28, 0.32][role] +
            this.personality.side * 6,
          y: home + 12,
        };
      this.error +=
        (this.personality.sample(0, cfg.error, -cfg.error) - this.error) * 0.15;
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
      cfg.speed * (0.94 + this.personality.tempo * 0.03),
    );
    return { x: clamp(next.x, 53, 367), y: clamp(next.y, 141, 352) };
  }
}
