import { MatchRandom } from "../../shared/ai/MatchRandom";
export const STONES = [
  { x: 85, y: 85, r: 17 },
  { x: 255, y: 85, r: 17 },
  { x: 170, y: 38, r: 17 },
  { x: 170, y: 132, r: 17 },
];
export const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];
export interface Spike {
  x: number;
  y: number;
  vx: number;
  vy: number;
}
export interface Survivor {
  x: number;
  y: number;
  tx: number;
  ty: number;
  alive: boolean;
  shots: Spike[];
}
/** Earliest swept circle contact; null means clear. */
export function contact(
  x: number,
  y: number,
  dx: number,
  dy: number,
  cx: number,
  cy: number,
  r: number,
) {
  const a = dx * dx + dy * dy,
    ox = x - cx,
    oy = y - cy,
    c = ox * ox + oy * oy - r * r;
  if (c <= 0) return 0;
  if (!a) return null;
  const b = 2 * (ox * dx + oy * dy),
    d = b * b - 4 * a * c;
  if (d < 0) return null;
  const t = (-b - Math.sqrt(d)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
export class SpikeMatch {
  players: [Survivor, Survivor] = [this.player(), this.player()];
  scores: [number, number] = [0, 0];
  winner: 1 | 2 | "draw" | null = null;
  wave = 1;
  direction = 0;
  warning = 2.6;
  between = 0;
  total = 0;
  private rng: MatchRandom;
  constructor(seed: number) {
    this.rng = new MatchRandom(seed);
    this.direction = Math.floor(this.rng.next() * 4);
  }
  private player(): Survivor {
    return { x: 170, y: 85, tx: 170, ty: 85, alive: true, shots: [] };
  }
  target(i: 0 | 1, x: number, y: number) {
    if (
      this.winner ||
      this.between ||
      !this.players[i].alive ||
      !Number.isFinite(x + y)
    )
      return;
    this.players[i].tx = Math.max(10, Math.min(330, x));
    this.players[i].ty = Math.max(10, Math.min(160, y));
  }
  private spawn() {
    const d = DIRECTIONS[this.direction],
      speed = Math.min(250, 165 + this.wave * 5),
      length = d.x ? 170 : 340;
    const shots: Spike[] = [];
    for (let n = 8; n < length; n += 20)
      shots.push({
        x: d.x === 1 ? -8 : d.x === -1 ? 348 : n,
        y: d.y === 1 ? -8 : d.y === -1 ? 178 : n,
        vx: d.x * speed,
        vy: d.y * speed,
      });
    this.players.forEach((p) => (p.shots = shots.map((s) => ({ ...s }))));
  }
  step(dt: number) {
    if (this.winner) return;
    this.total += dt;
    if (this.total >= 240) {
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
        this.players = [this.player(), this.player()];
        this.warning = 2.6;
        this.wave++;
        this.direction = Math.floor(this.rng.next() * 4);
      }
      return;
    }
    if (this.warning > 0) {
      this.warning = Math.max(0, this.warning - dt);
      if (!this.warning) this.spawn();
    }
    for (const p of this.players) {
      const dx = p.tx - p.x,
        dy = p.ty - p.y,
        len = Math.hypot(dx, dy),
        fraction = len ? Math.min(1, (150 * dt) / len) : 0;
      p.x += dx * fraction;
      p.y += dy * fraction;
      for (const s of STONES) {
        const x = p.x - s.x,
          y = p.y - s.y,
          d = Math.hypot(x, y);
        if (d < s.r + 9) {
          const nx = d ? x / d : 1,
            ny = d ? y / d : 0;
          p.x = s.x + nx * (s.r + 9);
          p.y = s.y + ny * (s.r + 9);
        }
      }
      p.x = Math.max(9, Math.min(331, p.x));
      p.y = Math.max(9, Math.min(161, p.y));
      for (let i = p.shots.length - 1; i >= 0; i--) {
        const s = p.shots[i],
          sx = s.vx * dt,
          sy = s.vy * dt;
        let stone = Infinity;
        for (const c of STONES) {
          const t = contact(s.x, s.y, sx, sy, c.x, c.y, c.r + 3);
          if (t !== null) stone = Math.min(stone, t);
        }
        const hit = contact(s.x, s.y, sx, sy, p.x, p.y, 12);
        if (hit !== null && hit < stone) p.alive = false;
        if (stone !== Infinity || hit !== null) {
          p.shots.splice(i, 1);
          continue;
        }
        s.x += sx;
        s.y += sy;
        if (s.x < -15 || s.x > 355 || s.y < -15 || s.y > 185)
          p.shots.splice(i, 1);
      }
    }
    if (this.players.some((p) => !p.alive)) {
      if (this.players[0].alive !== this.players[1].alive)
        this.scores[this.players[0].alive ? 0 : 1]++;
      this.between = 1.2;
      if (this.scores.some((s) => s >= 5))
        this.winner = this.scores[0] >= 5 ? 1 : 2;
    } else if (
      this.warning === 0 &&
      this.players.every((p) => p.shots.length === 0)
    ) {
      this.wave++;
      this.direction = Math.floor(this.rng.next() * 4);
      this.warning = 2.6;
    }
  }
}
