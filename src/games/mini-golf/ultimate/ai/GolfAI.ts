import { MatchRandom, replayMode } from "../../../../shared/ai/MatchRandom";
import { WorkerTask } from "../../../../shared/utilities/WorkerTask";
import type { Difficulty } from "../../../../shared/contracts/AIController";
import type { GolfPhysics } from "../GolfPhysics";
import type { PlanInput, ShotPlan } from "./ShotPlanner";
export class GolfAI {
  readonly personality: MatchRandom;
  private task: WorkerTask<PlanInput, ShotPlan>;
  private busy = false;
  private generation = 0;
  private plan: ShotPlan | null = null;
  private deadline = 0;
  private time = 0;
  private waypoint = 0;
  private origin = { x: 0, y: 0 };
  accelerated = false;
  constructor(
    readonly difficulty: Difficulty,
    report: (ms: number) => void,
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
    this.task = new WorkerTask(
      () =>
        new Worker(new URL("./planner.worker.ts", import.meta.url), {
          type: "module",
        }),
      report,
    );
  }
  update(dt: number, world: GolfPhysics) {
    this.time += dt;
    if (!world.shootable) {
      this.plan = null;
      return;
    }
    if (this.plan && this.time >= this.deadline) {
      const p = this.plan;
      this.plan = null;
      if (
        Math.hypot(world.ball.x - p.origin.x, world.ball.y - p.origin.y) < 12
      ) {
        this.waypoint = p.waypoint;
        world.shoot(p.vx, p.vy);
      }
      return;
    }
    if (this.busy || this.plan || this.time < this.deadline) return;
    const baseDelay =
      { medium: 2.2, hard: 1.6, impossible: 1.2 }[this.difficulty] *
      (0.9 + this.personality.tempo * 0.1);
    const delay = this.accelerated
      ? 0.25
      : this.personality.sample(baseDelay, 0.15, 0.9);
    const token = this.generation;
    this.busy = true;
    this.origin = { ...world.ball };
    this.deadline = this.time + delay;
    void this.task
      .run({
        state: world.exportState(),
        difficulty: this.difficulty,
        waypoint: this.waypoint,
        delay,
        seed: this.personality.seed,
        replay: replayMode(),
      })
      .then((plan) => {
        if (token !== this.generation) return;
        this.busy = false;
        if (plan) {
          this.plan = plan;
          this.deadline += plan.wait;
        } else this.deadline = this.time + 0.5;
      });
  }
  cancel() {
    this.generation++;
    this.task.cancel();
    this.busy = false;
    this.plan = null;
    this.deadline = this.time + 0.2;
  }
  reset() {
    this.cancel();
    this.waypoint = 0;
  }
  dispose() {
    this.cancel();
  }
  snapshot() {
    return {
      ...this.personality.snapshot(),
      thinking: this.busy,
      waypoint: this.waypoint,
      pending: !!this.plan,
    };
  }
}
