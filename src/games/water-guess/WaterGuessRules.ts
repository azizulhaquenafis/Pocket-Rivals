export const TOTAL_ROUNDS = 5;
export const MIN_PERCENT = 1000; // 10.00%
export const MAX_PERCENT = 9000; // 90.00%

export function formatPercent(hundredths: number): string {
  const clamped = Math.max(0, Math.min(10000, Math.round(hundredths)));
  return (clamped / 100).toFixed(2) + "%";
}

export function formatValue(hundredths: number): string {
  const clamped = Math.max(0, Math.min(10000, Math.round(hundredths)));
  return (clamped / 100).toFixed(2);
}

export function parsePercentInput(input: string): number {
  const cleaned = input.trim().replace("%", "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(10000, Math.round(num * 100)));
}

export interface WaterRoundResult {
  round: number;
  actual: number; // 0..10000
  guesses: [number, number]; // 0..10000
  errors: [number, number]; // absolute error in hundredths
  winner: 1 | 2 | "draw";
}

export class WaterGuessMatch {
  round = 1;
  scores: [number, number] = [0, 0];
  history: WaterRoundResult[] = [];
  actual = 0; // 0..10000
  guesses: [number | null, number | null] = [null, null];
  private resolved?: WaterRoundResult;
  private usedActuals = new Set<number>();

  constructor(private rng: () => number = Math.random) {
    this.startNewRound();
  }

  startNewRound() {
    this.resolved = undefined;
    this.guesses = [null, null];
    let candidate = 5000;
    let attempts = 0;
    do {
      // Generate percentage with 0.01% granularity between 10.00% and 90.00%
      const r = this.rng();
      candidate = MIN_PERCENT + Math.floor(r * (MAX_PERCENT - MIN_PERCENT + 1));
      attempts++;
    } while (this.usedActuals.has(candidate) && attempts < 100);

    this.usedActuals.add(candidate);
    this.actual = candidate;
  }

  submit(player: 0 | 1, guessHundredths: number): boolean {
    if (!Number.isFinite(guessHundredths)) return false;
    if (this.guesses[player] !== null) return false;
    const clamped = Math.max(0, Math.min(10000, Math.round(guessHundredths)));
    this.guesses[player] = clamped;
    return true;
  }

  get bothSubmitted(): boolean {
    return this.guesses[0] !== null && this.guesses[1] !== null;
  }

  resolveRound(): WaterRoundResult {
    if (this.resolved) return this.resolved;
    if (!this.bothSubmitted) {
      throw new Error("Cannot resolve round: both players must submit guesses");
    }
    const g0 = this.guesses[0]!;
    const g1 = this.guesses[1]!;
    const err0 = Math.abs(g0 - this.actual);
    const err1 = Math.abs(g1 - this.actual);

    let winner: 1 | 2 | "draw";
    if (err0 < err1) {
      winner = 1;
      this.scores[0]++;
    } else if (err1 < err0) {
      winner = 2;
      this.scores[1]++;
    } else {
      winner = "draw";
      // Equal error: tied round, no points awarded
    }

    const result: WaterRoundResult = {
      round: this.round,
      actual: this.actual,
      guesses: [g0, g1],
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
      // If round 5 has completed and scores are tied, continue sudden death
      return (
        this.history.length === TOTAL_ROUNDS &&
        this.scores[0] !== this.scores[1]
      );
    }
    // In sudden death (round > 5), match ends as soon as scores are not equal
    return this.scores[0] !== this.scores[1];
  }

  get matchWinner(): 1 | 2 | "draw" | null {
    if (!this.isMatchOver) return null;
    if (this.scores[0] > this.scores[1]) return 1;
    if (this.scores[1] > this.scores[0]) return 2;
    return "draw";
  }
}
