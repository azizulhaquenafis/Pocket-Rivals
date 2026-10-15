import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
export interface BasketBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  scored: boolean;
}
export interface Jumper {
  x: number;
  y: number;
  vy: number;
  direction: number;
  score: number;
  jumping: boolean;
  released: boolean;
  hoop: { x: number; y: number };
  ball?: BasketBall;
}
export function walk(x: number, direction: number, seconds: number) {
  let p = x + direction * 70 * seconds;
  while (p < 45 || p > 195) {
    if (p < 45) p = 90 - p;
    else p = 390 - p;
  }
  return p;
}
export function projectedLanding(p: Jumper) {
  const releaseX = walk(p.x, p.direction, 310 / 750),
    releaseY = 155 - (310 * 310) / (2 * 750) - 20;
  const t = (200 + Math.sqrt(40000 + 1500 * (p.hoop.y - releaseY))) / 750;
  return releaseX + 225 * t;
}
export class FlappyMatch {
  players: [Jumper, Jumper];
  winner: 1 | 2 | "draw" | null = null;
  time = 0;
  constructor(readonly seed: number) {
    const make = (): Jumper => ({
      x: 65,
      y: 155,
      vy: 0,
      direction: 1,
      score: 0,
      jumping: false,
      released: false,
      hoop: this.hoop(0),
    });
    this.players = [make(), make()];
  }
  private hoop(n: number) {
    const r = new MatchRandom(mixSeed(this.seed, n));
    return { x: 250 + r.next() * 38, y: 68 + r.next() * 15 };
  }
  jump(i: 0 | 1) {
    const p = this.players[i];
    if (this.winner || p.jumping || p.ball) return false;
    p.jumping = true;
    p.released = false;
    p.vy = -310;
    return true;
  }
  step(dt: number) {
    if (this.winner) return;
    this.time += dt;
    for (const p of this.players) {
      p.x += p.direction * 70 * dt;
      if (p.x > 195) {
        p.x = 390 - p.x;
        p.direction = -1;
      }
      if (p.x < 45) {
        p.x = 90 - p.x;
        p.direction = 1;
      }
      if (p.jumping) {
        const prev = p.vy;
        p.vy += 750 * dt;
        p.y += p.vy * dt;
        if (prev < 0 && p.vy >= 0 && !p.released && !p.ball) {
          p.released = true;
          p.ball = {
            x: p.x,
            y: p.y - 20,
            vx: 225,
            vy: -200,
            age: 0,
            scored: false,
          };
        }
        if (p.y >= 155) {
          p.y = 155;
          p.vy = 0;
          p.jumping = false;
        }
      }
      const b = p.ball;
      if (!b) continue;
      b.age += dt;
      const oldX = b.x,
        oldY = b.y;
      b.vy += 750 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // Circular rim ends; separating impulses avoid repeated reversals.
      for (const rx of [p.hoop.x - 21, p.hoop.x + 21]) {
        const dx = b.x - rx,
          dy = b.y - p.hoop.y,
          d = Math.hypot(dx, dy);
        if (d < 10) {
          const nx = d ? dx / d : 0,
            ny = d ? dy / d : -1;
          b.x = rx + nx * 10;
          b.y = p.hoop.y + ny * 10;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            b.vx -= 1.65 * vn * nx;
            b.vy -= 1.65 * vn * ny;
          }
        }
      }
      const board = p.hoop.x + 27;
      if (
        b.y >= p.hoop.y - 36 &&
        b.y <= p.hoop.y + 7 &&
        b.x + 7 >= board &&
        oldX + 7 < board
      ) {
        b.x = board - 7;
        b.vx = -Math.abs(b.vx) * 0.65;
      }
      if (!b.scored && oldY < p.hoop.y && b.y >= p.hoop.y && b.vy > 0) {
        const t = (p.hoop.y - oldY) / (b.y - oldY),
          crossX = oldX + (b.x - oldX) * t;
        if (crossX > p.hoop.x - 14 && crossX < p.hoop.x + 14) {
          b.scored = true;
          p.score++;
        }
      }
      if (b.y > 190 || b.x > 355 || b.x < -15 || b.age > 3) {
        p.ball = undefined;
        if (b.scored) p.hoop = this.hoop(p.score);
      }
    }
    const a = this.players[0].score >= 10,
      b = this.players[1].score >= 10;
    if (a || b) this.winner = a && b ? "draw" : a ? 1 : 2;
    if (this.time >= 240 && !this.winner)
      this.winner =
        this.players[0].score === this.players[1].score
          ? "draw"
          : this.players[0].score > this.players[1].score
            ? 1
            : 2;
  }
}
