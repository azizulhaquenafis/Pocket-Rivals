import { courses } from "../courses";
import { GolfPhysics } from "../GolfPhysics";
import {
  COURSE_TIMEOUT,
  seedFor,
  total,
  winner,
  type Attempt,
} from "./CompetitionRules";
/** Hot-seat attempts own their clocks. Menus/handoffs never call update. */
export class LocalVersusMode {
  readonly attempts: [Attempt[], Attempt[]] = [[], []];
  player: 0 | 1 = 0;
  hole = 0;
  elapsed = 0;
  world: GolfPhysics;
  phase: "ready" | "playing" | "between" | "complete" = "ready";
  constructor(
    readonly plan: number[],
    readonly seed: number,
  ) {
    this.world = this.create();
  }
  private create() {
    return new GolfPhysics(
      courses[this.plan[this.hole]],
      0,
      seedFor(this.seed, this.plan[this.hole]),
    );
  }
  begin() {
    if (this.phase === "ready" || this.phase === "between") {
      this.world = this.create();
      this.elapsed = 0;
      this.phase = "playing";
    }
  }
  update(dt: number) {
    if (this.phase !== "playing") return;
    this.elapsed += Math.max(0, dt);
    this.world.advance(dt);
    if (this.world.status !== "playing" || this.elapsed >= COURSE_TIMEOUT)
      this.finish();
  }
  private finish(reason?: Attempt["reason"]) {
    if (this.phase !== "playing") return;
    const won = this.world.status === "won";
    this.attempts[this.player].push({
      time: Math.min(COURSE_TIMEOUT, this.elapsed),
      strokes: this.world.strokes,
      completed: won && !reason,
      reason:
        reason ??
        (won
          ? undefined
          : this.elapsed >= COURSE_TIMEOUT
            ? "timeout"
            : "strokes"),
    });
    if (won && !reason && this.hole < this.plan.length - 1) {
      this.hole++;
      this.phase = "between";
    } else if (this.player === 0) {
      this.player = 1;
      this.hole = 0;
      this.phase = "ready";
    } else this.phase = "complete";
  }
  forfeit() {
    this.finish("forfeit");
  }
  get totals() {
    return this.attempts.map((a) => total(a, this.plan.length)) as [
      ReturnType<typeof total>,
      ReturnType<typeof total>,
    ];
  }
  get winner() {
    return winner(...this.totals);
  }
}
