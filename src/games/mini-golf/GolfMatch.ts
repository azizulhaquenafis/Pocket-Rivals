import type { Player, Winner } from "../../shared/contracts/GameResult";
import { courses } from "./courses";
import { newBall, shoot, type GolfBall } from "./GolfPhysics";
export class GolfMatch {
  hole = 0;
  turn: Player = 1;
  balls: [GolfBall, GolfBall];
  strokes: [number, number] = [0, 0];
  totals: [number, number] = [0, 0];
  history: [number, number][] = [];
  winner: Winner | null = null;
  shotActive = false;
  constructor(readonly count = 5) {
    this.balls = [newBall(this.course), newBall(this.course)];
  }
  get course() {
    return courses[this.hole];
  }
  get ball() {
    return this.balls[this.turn - 1];
  }
  takeShot(angle: number, power: number) {
    if (this.winner || this.shotActive || !shoot(this.ball, angle, power))
      return false;
    this.strokes[this.turn - 1]++;
    this.shotActive = true;
    return true;
  }
  finishShot() {
    if (!this.shotActive) return;
    this.shotActive = false;
    const i = this.turn - 1;
    if (!this.ball.holed && this.strokes[i] >= 12) {
      this.strokes[i] = 13;
      this.ball.holed = true;
    }
    if (this.balls.every((b) => b.holed)) {
      this.history.push([...this.strokes]);
      this.totals[0] += this.strokes[0];
      this.totals[1] += this.strokes[1];
      if (this.hole + 1 >= this.count) {
        this.winner =
          this.totals[0] === this.totals[1]
            ? "draw"
            : this.totals[0] < this.totals[1]
              ? 1
              : 2;
        return;
      }
      this.hole++;
      this.balls = [newBall(this.course), newBall(this.course)];
      this.strokes = [0, 0];
      this.turn = this.hole % 2 ? 2 : 1;
    } else {
      const next = this.turn === 1 ? 2 : 1;
      if (!this.balls[next - 1].holed) this.turn = next;
    }
  }
  save() {
    return {
      version: 1,
      count: this.count,
      hole: this.hole,
      turn: this.turn,
      balls: this.balls,
      strokes: this.strokes,
      totals: this.totals,
      history: this.history,
    };
  }
  static restore(data: unknown, count: number) {
    const fresh = new GolfMatch(count);
    if (!data || typeof data !== "object") return fresh;
    const d = data as ReturnType<GolfMatch["save"]>;
    if (
      d.version !== 1 ||
      d.count !== count ||
      !Number.isInteger(d.hole) ||
      d.hole < 0 ||
      d.hole >= count ||
      ![1, 2].includes(d.turn) ||
      !Array.isArray(d.balls) ||
      d.balls.length !== 2 ||
      !Array.isArray(d.history) ||
      d.history.length !== d.hole
    )
      return fresh;
    if (
      ![d.strokes, d.totals].every(
        (a) =>
          Array.isArray(a) &&
          a.length === 2 &&
          a.every((n) => Number.isInteger(n) && n >= 0 && n <= 65),
      )
    )
      return fresh;
    if (
      !d.balls.every(
        (b) =>
          b &&
          Number.isFinite(b.x + b.y) &&
          b.x >= 7 &&
          b.x <= 333 &&
          b.y >= 7 &&
          b.y <= 393 &&
          typeof b.holed === "boolean" &&
          b.vx === 0 &&
          b.vy === 0,
      )
    )
      return fresh;
    if (
      !d.history.every(
        (a) =>
          Array.isArray(a) &&
          a.length === 2 &&
          a.every((n) => Number.isInteger(n) && n >= 1 && n <= 13),
      ) ||
      d.totals.some((n, i) => n !== d.history.reduce((sum, h) => sum + h[i], 0))
    )
      return fresh;
    if (
      d.balls.every((b) => b.holed) ||
      d.balls[d.turn - 1].holed ||
      d.strokes.some((n) => n > 13)
    )
      return fresh;
    const course = courses[d.hole];
    if (
      d.balls.some(
        (b) =>
          !b.holed &&
          course.obstacles.some(
            (o) =>
              b.x > o.x - 6.9 &&
              b.x < o.x + o.w + 6.9 &&
              b.y > o.y - 6.9 &&
              b.y < o.y + o.h + 6.9,
          ),
      )
    )
      return fresh;
    Object.assign(fresh, {
      hole: d.hole,
      turn: d.turn,
      balls: structuredClone(d.balls),
      strokes: [...d.strokes],
      totals: [...d.totals],
      history: structuredClone(d.history),
    });
    return fresh;
  }
}
