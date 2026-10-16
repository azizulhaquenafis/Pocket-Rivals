import { integrate, collide, type Car } from "./Physics";
export class CarMatch {
  cars: [Car, Car] = this.spawn();
  scores: [number, number] = [0, 0];
  winner: 1 | 2 | "draw" | null = null;
  between = 1;
  round = 1;
  time = 0;
  roundTime = 0;
  private first = true;
  private spawn(): [Car, Car] {
    return [0, 1].map((i) => ({
      x: i ? 265 : 75,
      y: 224,
      vx: 0,
      vy: 0,
      angle: 0,
      omega: 0,
      facing: i ? -1 : 1,
      alive: true,
      grounded: false,
    })) as [Car, Car];
  }
  step(dt: number, controls: [number, number]) {
    if (this.winner) return;
    this.time += dt;
    if (this.time >= 240) {
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
        this.cars = this.spawn();
        this.roundTime = 0;
        if (!this.first) this.round++;
        this.first = false;
      }
      return;
    }
    this.roundTime += dt;
    integrate(this.cars[0], controls[0], dt);
    integrate(this.cars[1], controls[1], dt);
    collide(...this.cars);
    if (this.cars.some((c) => !c.alive) || this.roundTime >= 40) {
      if (this.cars[0].alive !== this.cars[1].alive)
        this.scores[this.cars[0].alive ? 0 : 1]++;
      this.between = 1.2;
      if (this.scores.some((s) => s >= 5))
        this.winner = this.scores[0] >= 5 ? 1 : 2;
    }
  }
}
