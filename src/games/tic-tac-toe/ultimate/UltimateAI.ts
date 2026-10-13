import { WorkerTask } from "../../../shared/utilities/WorkerTask";
import type { Difficulty } from "../../../shared/contracts/AIController";
import type { UltimateBoard } from "./UltimateRules";
export class UltimateAI {
  private task: WorkerTask<
    { id: number; state: unknown; difficulty: Difficulty },
    { move: number }
  >;
  constructor(
    private difficulty: Difficulty,
    report: (ms: number) => void = () => {},
  ) {
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
