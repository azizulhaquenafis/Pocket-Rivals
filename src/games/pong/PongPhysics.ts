import { FIELD } from "../../core/ThemeManager";
import { clamp } from "../../shared/physics/FixedStep";
import type { Player } from "../../shared/contracts/GameModule";
export class PongWorld {
  ball = { x: 210, y: 381, vx: 110, vy: 340, r: 9 };
  paddles = [
    { x: 210, y: 608, vx: 0 },
    { x: 210, y: 154, vx: 0 },
  ];
  scores: [number, number] = [0, 0];
  cooldown = 1.35;
  done = false;
  hits = 0;
  constructor(
    private impact: (x: number, y: number) => void = () => {},
    private scored: (p: Player) => void = () => {},
  ) {}
  step(dt: number, targets: [number, number]) {
    this.paddles.forEach((p, i) => {
      const old = p.x;
      p.x += clamp(targets[i] - p.x, -1800 * dt, 1800 * dt);
      p.x = clamp(p.x, FIELD.left + 44, FIELD.right - 44);
      p.vx = (p.x - old) / dt;
    });
    if (this.done) return;
    if (this.cooldown > 0) {
      this.cooldown -= dt;
      return;
    }
    const b = this.ball,
      oldY = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x - b.r < FIELD.left) {
      b.x = FIELD.left + b.r;
      b.vx = Math.abs(b.vx);
      this.impact(b.x, b.y);
    }
    if (b.x + b.r > FIELD.right) {
      b.x = FIELD.right - b.r;
      b.vx = -Math.abs(b.vx);
      this.impact(b.x, b.y);
    }
    this.paddles.forEach((p, i) => {
      const direction = i === 0 ? 1 : -1,
        contact = p.y - direction * (7 + b.r);
      if (
        b.vy * direction > 0 &&
        (oldY - contact) * direction <= 0 &&
        (b.y - contact) * direction >= 0 &&
        Math.abs(b.x - p.x) <= 44 + b.r
      ) {
        b.y = contact - direction * 0.1;
        const hit = clamp((b.x - p.x) / 44, -1, 1),
          speed = Math.min(820, Math.hypot(b.vx, b.vy) * 1.055 + 8);
        b.vx = clamp(
          Math.sin(hit * 1.03) * speed + p.vx * 0.13,
          -speed * 0.88,
          speed * 0.88,
        );
        b.vy = -direction * Math.sqrt(speed * speed - b.vx * b.vx);
        this.hits++;
        this.impact(b.x, b.y);
      }
    });
    if (b.y < FIELD.top - b.r * 2) this.goal(1);
    else if (b.y > FIELD.bottom + b.r * 2) this.goal(2);
  }
  private goal(player: Player) {
    this.scores[player - 1]++;
    this.done = this.scores[player - 1] >= 5;
    this.scored(player);
    this.cooldown = 1.1;
    this.hits = 0;
    this.ball.x = 210;
    this.ball.y = 381;
    this.ball.vx = (this.scores[0] + this.scores[1]) % 2 ? 110 : -110;
    this.ball.vy = player === 1 ? -340 : 340;
  }
}
