import {
  pens,
  physicsStep,
  stopped,
  strike,
  type Pen,
  type Shot,
} from "./PenPhysics";
export class PenMatch {
  bodies = pens();
  scores: [number, number] = [0, 0];
  turn: 0 | 1 = 0;
  phase: "aim" | "moving" | "between" | "done" = "aim";
  winner: 1 | 2 | "draw" | null = null;
  roundWinner: 0 | 1 | "draw" | null = null;
  round = 1;
  remaining = 120;
  /** Uncapped foreground elapsed time; host excludes pause/background time. */
  advanceClock(dt: number) {
    if (this.phase === "done" || !Number.isFinite(dt) || dt <= 0) return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining === 0) {
      this.winner = "draw";
      this.phase = "done";
      this.serial++;
    }
  }
  shots = 0;
  totalShots = 0;
  serial = 0;
  impacts = 0;
  private calm = 0;
  private age = 0;
  private draws = 0;
  shoot(player: 0 | 1, shot: Shot) {
    if (
      this.phase !== "aim" ||
      this.turn !== player ||
      !strike(this.bodies[player], shot)
    )
      return false;
    this.phase = "moving";
    this.shots++;
    this.totalShots++;
    this.serial++;
    this.age = this.calm = 0;
    return true;
  }
  step(dt: number) {
    if (this.phase === "done" || this.phase === "aim") return;
    this.age += dt;
    if (this.phase === "between") {
      if (this.age >= 1.3) {
        this.round++;
        this.bodies = pens();
        this.turn = this.round % 2 === 1 ? 0 : 1;
        this.shots = 0;
        this.roundWinner = null;
        this.phase = "aim";
      }
      return;
    }
    // Both renderer and worker use exactly these substeps.
    const steps = Math.max(1, Math.ceil(dt * 240));
    for (let n = 0; n < steps; n++)
      if (physicsStep(this.bodies, dt / steps) > 3) this.impacts++;
    this.calm = this.bodies.every(stopped) ? this.calm + dt : 0;
    if (this.calm < 0.2) return;
    const [a, b] = this.bodies;
    if (a.out || b.out || this.shots >= 36) {
      this.roundWinner = a.out === b.out ? "draw" : a.out ? 1 : 0;
      if (this.roundWinner === "draw") this.draws++;
      else {
        this.scores[this.roundWinner]++;
        this.draws = 0;
      }
      if (this.scores.some((s) => s === 3) || this.draws === 3) {
        this.winner = this.draws === 3 ? "draw" : this.scores[0] === 3 ? 1 : 2;
        this.phase = "done";
      } else this.phase = "between";
      this.age = 0;
      this.serial++;
    } else {
      this.turn = this.turn === 0 ? 1 : 0;
      this.phase = "aim";
    }
  }
  snapshot() {
    return {
      bodies: this.bodies.map((p) => ({ ...p })),
      scores: [...this.scores],
      turn: this.turn,
      phase: this.phase,
      round: this.round,
      roundWinner: this.roundWinner,
      winner: this.winner,
      shots: this.shots,
      totalShots: this.totalShots,
      remaining: this.remaining,
      serial: this.serial,
    };
  }
}
export function simulateShot(bodies: Pen[], player: 0 | 1, shot: Shot) {
  const pair = bodies.map((p) => ({ ...p })) as [Pen, Pen];
  strike(pair[player], shot);
  for (let i = 0; i < 1200; i++) {
    physicsStep(pair, 1 / 240);
    if (pair.every(stopped)) break;
  }
  return pair;
}
