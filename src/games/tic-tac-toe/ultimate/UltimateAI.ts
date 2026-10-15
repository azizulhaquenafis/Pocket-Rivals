import { MatchRandom, replayMode } from "../../../shared/ai/MatchRandom";
import { WorkerTask } from "../../../shared/utilities/WorkerTask";
import type { Difficulty } from "../../../shared/contracts/AIController";
import type { UltimateBoard } from "./UltimateRules";
export class UltimateAI {
  readonly personality: MatchRandom;
  snapshot() {
    return this.personality.snapshot();
  }
  private task: WorkerTask<
    {
      id: number;
      state: unknown;
      difficulty: Difficulty;
      seed: number;
      replay: boolean;
    },
    { move: number }
  >;
  constructor(
    private difficulty: Difficulty,
    report: (ms: number) => void = () => {},
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
    this.task = new WorkerTask(
      () =>
        new Worker(new URL("./ai.worker.ts", import.meta.url), {
          type: "module",
        }),
      report,
    );
  }
  async choose(board: UltimateBoard) {
    const answer = await this.task.run({
      id: 1,
      state: board.save(),
      difficulty: this.difficulty,
      seed: this.personality.seed,
      replay: replayMode(),
    });
    return answer?.move ?? board.legalMoves()[0] ?? -1;
  }
  cancel() {
    this.task.cancel();
  }
  dispose() {
    this.task.cancel();
  }
}
