import { MatchRandom, mixSeed } from "../../shared/ai/MatchRandom";
export interface Bird {
  y: number;
  vy: number;
  alive: boolean;
  cooldown: number;
}
export interface Gate {
  x: number;
  center: number;
  gap: number;
}
export class BirdsMatch {
  players: [Bird, Bird] = [this.bird(), this.bird()];
  gates: Gate[] = [];
  scores: [number, number] = [0, 0];
  winner: 1 | 2 | "draw" | null = null;
  distance = 0;
  age = 0;
  total = 0;
  round = 1;
  between = 1.2;
  private first = true;
  constructor(readonly seed: number) {
    this.course();
  }
  private bird(): Bird {
    return { y: 85, vy: 0, alive: true, cooldown: 0 };
  }
  private course() {
    const r = new MatchRandom(mixSeed(this.seed, this.round));
    let center = 85;
    this.gates = Array.from({ length: 65 }, (_, i) => {
      center = Math.max(65, Math.min(105, center + (r.next() - 0.5) * 30));
      return { x: 300 + i * 260, center, gap: 100 };
    });
  }
  speed() {
    return Math.min(170, 100 + this.age * 1.3);
  }
  flap(i: 0 | 1) {
    const p = this.players[i];
    if (this.winner || this.between || !p.alive || p.cooldown > 0) return false;
    p.vy = -195;
    p.cooldown = 0.14;
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
        if (!this.first) this.round++;
        this.first = false;
        this.age = 0;
        this.distance = 0;
        this.players = [this.bird(), this.bird()];
        this.course();
      }
      return;
    }
    this.age += dt;
    this.distance += this.speed() * dt;
    for (const p of this.players) {
      p.cooldown = Math.max(0, p.cooldown - dt);
      p.vy += 650 * dt;
      p.y += p.vy * dt;
      if (p.y < 10 || p.y > 160) p.alive = false;
      for (const gate of this.gates) {
        if (
          this.distance + 10 >= gate.x &&
          this.distance - 10 <= gate.x + 24 &&
          (p.y - 9 < gate.center - gate.gap / 2 ||
            p.y + 9 > gate.center + gate.gap / 2)
        )
          p.alive = false;
      }
    }
    if (this.players.some((p) => !p.alive) || this.age >= 100) {
      if (this.players[0].alive !== this.players[1].alive)
        this.scores[this.players[0].alive ? 0 : 1]++;
      this.between = 1.2;
      if (this.scores.some((s) => s >= 3))
        this.winner = this.scores[0] >= 3 ? 1 : 2;
    }
  }
}
