import { GolfPhysics } from "../GolfPhysics";
import { courses } from "../courses";
import { GolfAI } from "../ai/GolfAI";
import type { Difficulty } from "../../../../shared/contracts/AIController";
import {
  COURSE_TIMEOUT,
  FINISH_TOLERANCE,
  seedFor,
  total,
  winner,
  type Attempt,
} from "./CompetitionRules";
/** Two independent course instances, one foreground clock and one reproducible seed. */
export class AIChallengeMode {
  readonly attempts: [Attempt[], Attempt[]] = [[], []];
  readonly holes = [0, 0];
  readonly elapsed = [0, 0];
  readonly worlds: [GolfPhysics, GolfPhysics];
  readonly ai: GolfAI;
  phase: "ready" | "playing" | "complete" = "ready";
  private finishClock: number | null = null;
  private clock = 0;
  private failed: [boolean, boolean] = [false, false];
  constructor(
    readonly plan: number[],
    readonly seed: number,
    difficulty: Difficulty,
    report: (ms: number) => void,
  ) {
    this.worlds = [this.create(0), this.create(0)];
    this.ai = new GolfAI(difficulty, report);
  }
  private create(hole: number) {
    return new GolfPhysics(
      courses[this.plan[hole]],
      0,
      seedFor(this.seed, this.plan[hole]),
    );
  }
  begin() {
    if (this.phase === "ready") this.phase = "playing";
  }
  update(dt: number) {
    if (this.phase !== "playing") return;
    this.clock += dt;
    for (const p of [0, 1] as const) {
      if (this.attempts[p].length === this.plan.length || this.failed[p])
        continue;
      const w = this.worlds[p];
      this.elapsed[p] += dt;
      if (p === 1) this.ai.update(dt, w);
      w.advance(dt);
      if (w.status !== "playing" || this.elapsed[p] >= COURSE_TIMEOUT) {
        const completed = w.status === "won";
        this.attempts[p].push({
          time: Math.min(COURSE_TIMEOUT, this.elapsed[p]),
          strokes: w.strokes,
          completed,
          reason: completed
            ? undefined
            : this.elapsed[p] >= COURSE_TIMEOUT
              ? "timeout"
              : "strokes",
        });
        if (completed && this.holes[p] < this.plan.length - 1) {
          this.holes[p]++;
          this.elapsed[p] = 0;
          this.worlds[p] = this.create(this.holes[p]);
          if (p === 1) this.ai.reset();
        } else {
          this.failed[p] = !completed;
          this.finishClock ??= this.clock;
        }
      }
    }
    if (
      this.failed.some(Boolean) ||
      (this.finishClock !== null &&
        this.clock - this.finishClock >= FINISH_TOLERANCE)
    ) {
      this.phase = "complete";
      this.ai.cancel();
    }
  }
  forfeit() {
    if (this.phase !== "playing") return;
    this.failed[0] = true;
    this.attempts[0].push({
      time: this.elapsed[0],
      strokes: this.worlds[0].strokes,
      completed: false,
      reason: "forfeit",
    });
    this.phase = "complete";
    this.ai.cancel();
  }
  get totals() {
    return this.attempts.map((a) => total(a, this.plan.length)) as [
      ReturnType<typeof total>,
      ReturnType<typeof total>,
    ];
  }
  get winner() {
    if (this.failed[0] && this.failed[1]) return "draw" as const;
    if (this.failed[0]) return 2 as const;
    if (this.failed[1]) return 1 as const;
    return winner(...this.totals);
  }
  pause() {
    this.ai.cancel();
    this.worlds.forEach((w) => w.resetAccumulator());
  }
  dispose() {
    this.ai.dispose();
  }
}
