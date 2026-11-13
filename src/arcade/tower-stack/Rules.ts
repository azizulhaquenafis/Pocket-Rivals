import type { Difficulty } from "../../shared/contracts/AIController";
export interface Block {
  x: number;
  width: number;
  level: number;
}
export class TowerWorld {
  blocks: Block[] = [{ x: 110, width: 200, level: 0 }];
  moving: Block = { x: 40, width: 200, level: 1 };
  debris: {
    x: number;
    y: number;
    width: number;
    vy: number;
    rotation: number;
  }[] = [];
  direction = 1;
  score = 0;
  combo = 0;
  done = false;
  flash = 0;
  camera = 0;
  constructor(readonly difficulty: Difficulty = "medium") {}
  get top() {
    return this.blocks[this.blocks.length - 1];
  }
  step(dt: number) {
    this.flash = Math.max(0, this.flash - dt);
    if (!this.done) {
      this.moving.x +=
        this.direction *
        ({ medium: 72, hard: 105, impossible: 145 }[this.difficulty] +
          Math.min(210, this.moving.level * 7)) *
        dt;
      if (this.moving.x < 38) {
        this.moving.x = 38;
        this.direction = 1;
      }
      if (this.moving.x + this.moving.width > 382) {
        this.moving.x = 382 - this.moving.width;
        this.direction = -1;
      }
    }
    this.camera +=
      (Math.max(0, this.top.level - 7) * 28 - this.camera) *
      (1 - Math.exp(-8 * dt));
    for (const p of this.debris) {
      p.vy += 700 * dt;
      p.y += p.vy * dt;
      p.rotation += dt * 1.5;
    }
    this.debris = this.debris.filter((p) => p.y + this.camera < 720).slice(-8);
  }
  drop() {
    if (this.done) return false;
    const m = this.moving,
      t = this.top,
      left = Math.max(m.x, t.x),
      right = Math.min(m.x + m.width, t.x + t.width),
      overlap = right - left;
    if (overlap < 2) {
      this.done = true;
      return false;
    }
    const perfect =
      Math.abs(m.x - t.x) <=
      { medium: 5, hard: 3, impossible: 1.5 }[this.difficulty];
    if (perfect) {
      m.x = t.x;
      this.combo++;
      this.flash = 0.35;
    } else {
      this.combo = 0;
      const cut =
        m.x < left
          ? { x: m.x, width: left - m.x }
          : { x: right, width: m.x + m.width - right };
      this.debris.push({ ...cut, y: 595 - m.level * 28, vy: 0, rotation: 0 });
      m.x = left;
      m.width = overlap;
    }
    this.score += 10 + (perfect ? 5 * Math.min(5, this.combo) : 0);
    this.blocks.push({ ...m });
    this.blocks = this.blocks.slice(-22);
    this.direction = m.level % 2 ? -1 : 1;
    this.moving = {
      x: this.direction > 0 ? 38 : 382 - m.width,
      width: m.width,
      level: m.level + 1,
    };
    return true;
  }
}
