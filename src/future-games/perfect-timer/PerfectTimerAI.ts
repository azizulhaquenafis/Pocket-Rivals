import type { Difficulty } from "../../shared/contracts/AIController";
import { MatchRandom } from "../../shared/ai/MatchRandom";
/** A coherent fast/slow internal clock per match; Impossible uses the visible exact target. */
export class PerfectTimerAI {
  readonly personality: MatchRandom;
  private scheduledStopMs: number | null = null;
  constructor(
    public readonly difficulty: Difficulty = "medium",
    seed?: number,
  ) {
    this.personality = new MatchRandom(seed);
  }
  scheduleRound(targetCentiseconds: number, startPerfMs: number) {
    const r = this.personality,
      spread =
        this.difficulty === "medium" ? 72 : this.difficulty === "hard" ? 21 : 0,
      bias = r.side * spread * (0.15 + r.role * 0.06);
    const error = Math.round(
      r.sample(bias, spread * (0.8 + r.tempo * 0.1), -spread * 1.4),
    );
    this.scheduledStopMs =
      startPerfMs + Math.max(50, targetCentiseconds + error) * 10;
  }
  shouldStop(elapsedMs: number) {
    return this.scheduledStopMs !== null && elapsedMs >= this.scheduledStopMs;
  }
  reset() {
    this.scheduledStopMs = null;
  }
  snapshot() {
    return this.personality.snapshot();
  }
}
