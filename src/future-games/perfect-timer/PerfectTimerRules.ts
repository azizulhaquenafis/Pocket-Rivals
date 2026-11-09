export const TOTAL_ROUNDS = 5;

// Standard base targets with centisecond precision
export const TARGET_PRESETS = [500, 743, 1000, 1267, 1525]; // in centiseconds (5.00s, 7.43s, 10.00s, 12.67s, 15.25s)

export function formatSeconds(centiseconds: number): string {
  const clamped = Math.max(0, Math.round(centiseconds));
  return (clamped / 100).toFixed(2) + "s";
}

export function formatSecondsRaw(centiseconds: number): string {
  const clamped = Math.max(0, Math.round(centiseconds));
  return (clamped / 100).toFixed(2);
}

export interface TimerRoundResult {
  round: number;
  target: number; // centiseconds (e.g. 1000 = 10.00s)
  stops: [number, number]; // recorded centiseconds for each player
  errors: [number, number]; // |stop - target| in centiseconds
  winner: 1 | 2 | "draw";
}

export class PerfectTimerMatch {
  round = 1;
  scores: [number, number] = [0, 0];
  history: TimerRoundResult[] = [];
  target = 1000; // current target in centiseconds
  stops: [number | null, number | null] = [null, null]; // centiseconds

  private resolved?: TimerRoundResult;
  private usedTargets = new Set<number>();

  constructor(private rng: () => number = Math.random) {
    this.startNewRound();
  }

  startNewRound() {
    this.resolved = undefined;
    this.stops = [null, null];

    const available = TARGET_PRESETS.filter(
      (value) => !this.usedTargets.has(value),
    );
    let candidate = available.length
      ? available[Math.floor(this.rng() * available.length)]
      : 500 + Math.floor(this.rng() * 1001);
    // Deterministic fallback avoids duplicate targets even with a constant test RNG.
    for (let i = 0; i < 1001 && this.usedTargets.has(candidate); i++)
      candidate = 500 + ((candidate - 499) % 1001);

    this.usedTargets.add(candidate);
    this.target = candidate;
  }

  recordStop(player: 0 | 1, elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0)
      throw new RangeError("Invalid elapsed time");
    if (this.stops[player] !== null) return this.stops[player]!;
    // High-resolution conversion to integer centiseconds using consistent rounding
    const centiseconds = Math.max(0, Math.round(elapsedMs / 10));
    this.stops[player] = centiseconds;
    return centiseconds;
  }

  get bothStopped(): boolean {
    return this.stops[0] !== null && this.stops[1] !== null;
  }

  resolveRound(): TimerRoundResult {
    if (this.resolved) return this.resolved;
    if (!this.bothStopped) {
      throw new Error("Cannot resolve round: both players must have stopped");
    }
    const s0 = this.stops[0]!;
    const s1 = this.stops[1]!;
    const err0 = Math.abs(s0 - this.target);
    const err1 = Math.abs(s1 - this.target);

    let winner: 1 | 2 | "draw";
    if (err0 < err1) {
      winner = 1;
      this.scores[0]++;
    } else if (err1 < err0) {
      winner = 2;
      this.scores[1]++;
    } else {
      winner = "draw";
    }

    const result: TimerRoundResult = {
      round: this.round,
      target: this.target,
      stops: [s0, s1],
      errors: [err0, err1],
      winner,
    };
    this.resolved = result;
    this.history.push(result);
    return result;
  }

  nextRound(): boolean {
    if (!this.resolved || this.isMatchOver) return false;
    this.round++;
    this.startNewRound();
    return true;
  }

  get isSuddenDeath(): boolean {
    return this.round > TOTAL_ROUNDS && this.scores[0] === this.scores[1];
  }

  get isMatchOver(): boolean {
    if (this.round < TOTAL_ROUNDS) return false;
    if (this.round === TOTAL_ROUNDS) {
      return (
        this.history.length === TOTAL_ROUNDS &&
        this.scores[0] !== this.scores[1]
      );
    }
    return this.scores[0] !== this.scores[1];
  }

  get matchWinner(): 1 | 2 | "draw" | null {
    if (!this.isMatchOver) return null;
    if (this.scores[0] > this.scores[1]) return 1;
    if (this.scores[1] > this.scores[0]) return 2;
    return "draw";
  }
}
