import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
export interface Gap {
  x: number;
  width: number;
  side: -1 | 1;
}
export interface Runner {
  y: number;
  vy: number;
  gravity: -1 | 1;
  alive: boolean;
  cooldown: number;
}
export class GravityMatch {
  players: [Runner, Runner] = [this.runner(), this.runner()];
  scores: [number, number] = [0, 0];
  gaps: Gap[] = [];
  distance = 0;
  round = 1;
  age = 0;
  total = 0;
  between = 0;
  winner: 1 | 2 | "draw" | null = null;
  constructor(readonly seed: number) {
    this.course();
  }
  private runner(): Runner {
    return { y: 160, vy: 0, gravity: 1, alive: true, cooldown: 0 };
  }
  private course() {
    const r = new MatchRandom(mixSeed(this.seed, this.round));
    let x = 350;
    this.gaps = Array.from({ length: 90 }, () => {
      const g: Gap = {
        x,
        width: 90 + r.next() * 35,
        side: r.next() < 0.5 ? 1 : -1,
      };
      x += 370 + r.next() * 110;
      return g;
    });
  }
  speed() {
    return Math.min(225, 120 + this.age * 2);
  }
  flip(i: 0 | 1) {
    const p = this.players[i];
    if (this.winner || this.between || !p.alive || p.cooldown > 0) return false;
    p.gravity = p.gravity === 1 ? -1 : 1;
    p.cooldown = 0.16;
    return true;
  }
  step(dt: number) {
    if (this.winner) return;
    this.total += dt;
    if (this.total >= 300) {
      this.winner =
        this.scores[0] === this.scores[1]
          ? "draw"
          : this.scores[0] > this.scores[1]
            ? 1
            : 2;
      return;
    }
    if (this.between) {
      this.between = Math.max(0, this.between - dt);
      if (!this.between) {
        this.players = [this.runner(), this.runner()];
        this.age = 0;
        this.distance = 0;
        this.round++;
        this.course();
      }
      return;
    }
    this.age += dt;
    this.distance += this.speed() * dt;
    for (const p of this.players) {
      p.cooldown = Math.max(0, p.cooldown - dt);
      p.vy += p.gravity * 900 * dt;
      p.y += p.vy * dt;
      const gap = (side: number) =>
        this.gaps.some(
          (g) =>
            g.side === side &&
            this.distance + 8 >= g.x &&
            this.distance - 8 <= g.x + g.width,
        );
      if (p.y >= 160 && !gap(1)) {
        p.y = 160;
        p.vy = Math.min(0, p.vy);
      }
      if (p.y <= 10 && !gap(-1)) {
        p.y = 10;
        p.vy = Math.max(0, p.vy);
      }
      if (p.y < -22 || p.y > 192) p.alive = false;
    }
    if (this.players.some((p) => !p.alive) || this.age >= 100) {
      if (this.players[0].alive !== this.players[1].alive)
        this.scores[this.players[0].alive ? 0 : 1]++;
      this.between = 1.1;
      if (this.scores.some((s) => s >= 5))
        this.winner = this.scores[0] >= 5 ? 1 : 2;
    }
  }
}
