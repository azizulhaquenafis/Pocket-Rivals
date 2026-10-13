export type Direction = "up" | "right" | "down" | "left";
export interface Cell {
  x: number;
  y: number;
}
const vectors: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};
export class SnakeWorld {
  readonly width = 17;
  readonly height = 20;
  body: Cell[] = [
    { x: 8, y: 11 },
    { x: 7, y: 11 },
    { x: 6, y: 11 },
  ];
  previous: Cell[] = this.body.map((c) => ({ ...c }));
  direction: Direction = "right";
  food: Cell | null = null;
  score = 0;
  dead = false;
  won = false;
  private queue: Direction[] = [];
  accumulator = 0;
  constructor(private random = Math.random) {
    this.spawnFood();
  }
  get interval() {
    return Math.max(0.065, 0.18 - this.score * 0.0015);
  }
  steer(dir: Direction) {
    const last = this.queue.at(-1) ?? this.direction,
      a = vectors[last],
      b = vectors[dir];
    if (
      this.queue.length >= 2 ||
      last === dir ||
      (a.x + b.x === 0 && a.y + b.y === 0)
    )
      return false;
    this.queue.push(dir);
    return true;
  }
  clearInput() {
    this.queue = [];
  }
  update(dt: number) {
    if (this.dead) return;
    this.accumulator += Math.max(0, Math.min(dt, 0.5));
    while (this.accumulator >= this.interval && !this.dead) {
      this.accumulator -= this.interval;
      this.tick();
    }
  }
  tick() {
    if (this.dead) return;
    this.direction = this.queue.shift() ?? this.direction;
    const d = vectors[this.direction],
      head = { x: this.body[0].x + d.x, y: this.body[0].y + d.y },
      eating = head.x === this.food?.x && head.y === this.food?.y,
      solid = eating ? this.body : this.body.slice(0, -1);
    if (
      head.x < 0 ||
      head.x >= this.width ||
      head.y < 0 ||
      head.y >= this.height ||
      solid.some((c) => c.x === head.x && c.y === head.y)
    ) {
      this.dead = true;
      return;
    }
    this.previous = this.body.map((c) => ({ ...c }));
    this.body.unshift(head);
    if (eating) {
      this.score += 10;
      this.spawnFood();
    } else this.body.pop();
  }
  spawnFood() {
    const free: Cell[] = [];
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++)
        if (!this.body.some((c) => c.x === x && c.y === y)) free.push({ x, y });
    if (!free.length) {
      this.food = null;
      this.dead = this.won = true;
      return;
    }
    this.food =
      free[Math.min(free.length - 1, Math.floor(this.random() * free.length))];
  }
}
