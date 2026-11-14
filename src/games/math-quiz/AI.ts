import type { Difficulty } from "../../shared/contracts/AIController";
import { MatchRandom, type SeedInput } from "../../shared/ai/MatchRandom";
import type { QuizMatch } from "./Rules";

/** A bank-key opponent, not a symbolic solver. Delays begin at presentation. */
const TIERS = {
  medium: { scale: 0.68, min: 2.6, max: 8, accuracy: 0.74, variation: 0.04 },
  hard: { scale: 0.32, min: 1.5, max: 4.2, accuracy: 0.95, variation: 0.02 },
  impossible: { scale: 0.055, min: 0.7, max: 1.25, accuracy: 1, variation: 0 },
} as const;

export class QuizAI {
  private readonly rng: MatchRandom;
  private round = -1;
  private tapped = false;
  private delay = 0;
  private answer = 0;
  private readonly accuracy: number;
  private readonly pace: number;

  constructor(
    private difficulty: Difficulty,
    seed?: SeedInput,
  ) {
    this.rng = new MatchRandom(seed);
    // Keep one recognizable pace/accuracy style throughout the match. Jitter is
    // sampled only once per question; rendering never changes the decision.
    this.pace = 0.94 + this.rng.tempo * 0.06;
    const tier = TIERS[difficulty];
    this.accuracy =
      tier.accuracy + ((this.rng.role - 1.5) / 1.5) * tier.variation;
  }

  update(m: QuizMatch) {
    if (m.phase !== "active") return;
    if (m.round !== this.round) {
      this.round = m.round;
      this.tapped = false;
      const q = m.question;
      const tier = TIERS[this.difficulty];
      const estimate = Number.isFinite(q.estimatedSeconds)
        ? q.estimatedSeconds
        : 10;
      const nominal = Math.max(
        tier.min,
        Math.min(tier.max, estimate * tier.scale),
      );
      this.delay = Math.max(
        tier.min,
        Math.min(
          tier.max,
          this.rng.sample(nominal * this.pace, nominal * 0.1, tier.min),
        ),
      );
      // Impossible always uses the verified answer. Lower tiers select a real
      // distractor when mistaken; scores still pass through the same rules.
      this.answer =
        this.rng.next() < this.accuracy
          ? q.correctIndex
          : (q.correctIndex + 1 + Math.floor(this.rng.next() * 2)) % 3;
    }
    if (!this.tapped && m.time - m.visibleAt >= this.delay) {
      m.answer(1, this.answer);
      this.tapped = true;
    }
  }

  snapshot() {
    return {
      ...this.rng.snapshot(),
      difficulty: this.difficulty,
      delay: this.delay,
      accuracy: this.accuracy,
      tapped: this.tapped,
    };
  }
}
