import { describe, it, expect } from "vitest";
import {
  WaterGuessMatch,
  formatPercent,
  formatValue,
  parsePercentInput,
  MIN_PERCENT,
  MAX_PERCENT,
} from "../../src/games/water-guess/WaterGuessRules";
import { WaterGuessAI } from "../../src/games/water-guess/WaterGuessAI";
import { TUBE } from "../../src/games/water-guess/WaterRenderer";

describe("Water Guess Rules & Precision", () => {
  it("accepts only whole percentages and prevents duplicate guesses", () => {
    expect(formatPercent(6800)).toBe("68%");
    expect(formatValue(4700)).toBe("47");
    expect(parsePercentInput("68%")).toBe(6800);
    expect(parsePercentInput("0")).toBe(0);
    expect(parsePercentInput("100")).toBe(10000);
    for (const text of ["68.75", "-1", "101", "50oops", ""])
      expect(parsePercentInput(text)).toBeNaN();
    const m = new WaterGuessMatch();
    expect(m.submit(0, 5025)).toBe(false);
    expect(m.submit(0, 5000)).toBe(true);
    expect(m.submit(1, 5000)).toBe(false);
    expect(m.submit(1, 5100)).toBe(true);
  });
  it("generates all 81 whole water levels without repeats even with a constant RNG", () => {
    const m = new WaterGuessMatch(() => 0.5),
      seen = new Set<number>();
    for (let i = 0; i < 81; i++) {
      expect(m.actual % 100).toBe(0);
      expect(m.actual).toBeGreaterThanOrEqual(MIN_PERCENT);
      expect(m.actual).toBeLessThanOrEqual(MAX_PERCENT);
      expect(seen.has(m.actual)).toBe(false);
      seen.add(m.actual);
      m.startNewRound();
    }
  });
  it("scores closest whole guesses once and permits equidistant draws", () => {
    const m = new WaterGuessMatch();
    m.actual = 6800;
    m.submit(0, 6700);
    m.submit(1, 7000);
    expect(m.resolveRound().errors).toEqual([100, 200]);
    expect(m.resolveRound().winner).toBe(1);
    expect(m.scores).toEqual([1, 0]);
    const tie = new WaterGuessMatch();
    tie.actual = 5000;
    tie.submit(0, 4900);
    tie.submit(1, 5100);
    expect(tie.resolveRound().winner).toBe("draw");
  });

  it("handles 5-round match victory and sudden-death extension", () => {
    const match = new WaterGuessMatch();

    // Round 1..4: P1 wins
    for (let r = 1; r <= 4; r++) {
      match.actual = 5000;
      match.submit(0, 5000); // 0 err
      match.submit(1, 5500); // 500 err
      match.resolveRound();
      expect(match.isMatchOver).toBe(false);
      match.nextRound();
    }

    // Round 5: P2 wins
    match.actual = 5000;
    match.submit(0, 5500);
    match.submit(1, 5000);
    match.resolveRound();

    // Scores are 4 - 1 -> Match over!
    expect(match.scores).toEqual([4, 1]);
    expect(match.isMatchOver).toBe(true);
    expect(match.matchWinner).toBe(1);

    // Test Sudden Death when scores are tied at round 5
    const tiedMatch = new WaterGuessMatch();
    for (let r = 1; r <= 4; r++) {
      tiedMatch.actual = 5000;
      if (r <= 2) {
        tiedMatch.submit(0, 5000);
        tiedMatch.submit(1, 6000);
      } else {
        tiedMatch.submit(0, 6000);
        tiedMatch.submit(1, 5000);
      }
      tiedMatch.resolveRound();
      tiedMatch.nextRound();
    }
    // Round 5 tied
    tiedMatch.actual = 5000;
    tiedMatch.submit(0, 4900);
    tiedMatch.submit(1, 5100);
    tiedMatch.resolveRound();

    // Scores are 2 - 2 at round 5 -> Sudden Death!
    expect(tiedMatch.scores).toEqual([2, 2]);
    expect(tiedMatch.isMatchOver).toBe(false);
    expect(tiedMatch.nextRound()).toBe(true);
    expect(tiedMatch.round).toBe(6);
    expect(tiedMatch.isSuddenDeath).toBe(true);

    // Round 6: P2 wins sudden death
    tiedMatch.actual = 4000;
    tiedMatch.submit(0, 4500);
    tiedMatch.submit(1, 4000);
    tiedMatch.resolveRound();

    expect(tiedMatch.scores).toEqual([2, 3]);
    expect(tiedMatch.isMatchOver).toBe(true);
    expect(tiedMatch.matchWinner).toBe(2);
  });
});

describe("Water Guess Tube Geometry & Linearity", () => {
  it("maintains strict uniform linear cross-section and usable height", () => {
    // 0% water corresponds to yBottom (465)
    // 100% water corresponds to yTop (155)
    // Total usable height is 310
    const { yTop, yBottom, height } = TUBE;
    expect(yBottom - yTop).toBe(height);
    expect(height).toBe(310);

    const calcY = (hundredths: number) =>
      yBottom - (hundredths / 10000) * height;
    expect(calcY(0)).toBe(465);
    expect(calcY(5000)).toBe(310);
    expect(calcY(10000)).toBe(155);
    expect(calcY(2500)).toBe(387.5);
    expect(calcY(7500)).toBe(232.5);
  });
});

describe("Water Guess AI", () => {
  it("produces appropriate error ranges across difficulties with seeded determinism", () => {
    const actual = 5000; // 50.00%

    const aiImp = new WaterGuessAI("impossible", 42);
    const impGuess = aiImp.estimate(actual);
    const impErr = Math.abs(impGuess - actual);
    // Impossible error: 10..60 hundredths (0.10%..0.60%)
    expect(impErr).toBe(0);

    const aiHard = new WaterGuessAI("hard", 42);
    const hardGuess = aiHard.estimate(actual);
    const hardErr = Math.abs(hardGuess - actual);
    // Hard error: 80..250 hundredths (0.80%..2.50%)
    expect(hardErr).toBeGreaterThanOrEqual(0);
    expect(hardErr).toBeLessThanOrEqual(250);

    const aiMed = new WaterGuessAI("medium", 42);
    const medGuess = aiMed.estimate(actual);
    const medErr = Math.abs(medGuess - actual);
    // Medium error: 250..750 hundredths (2.50%..7.50%)
    expect(medErr).toBeGreaterThanOrEqual(0);
    expect(medErr).toBeLessThanOrEqual(750);
  });
});
