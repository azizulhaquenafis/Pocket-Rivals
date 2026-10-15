import { describe, it, expect } from "vitest";
import {
  PerfectTimerMatch,
  formatSeconds,
  formatSecondsRaw,
  TARGET_PRESETS,
} from "../../src/games/perfect-timer/PerfectTimerRules";
import { PerfectTimerAI } from "../../src/games/perfect-timer/PerfectTimerAI";

describe("Perfect Timer Rules & Precision", () => {
  it("formats centiseconds to 0.01s resolution accurately", () => {
    expect(formatSeconds(1000)).toBe("10.00s");
    expect(formatSeconds(743)).toBe("7.43s");
    expect(formatSeconds(997)).toBe("9.97s");
    expect(formatSeconds(3)).toBe("0.03s");
    expect(formatSeconds(0)).toBe("0.00s");
    expect(formatSecondsRaw(1267)).toBe("12.67");
  });

  it("converts millisecond elapsed time to integer centiseconds with consistent rounding", () => {
    const match = new PerfectTimerMatch();
    // 9974ms rounds to 997 centiseconds (9.97s)
    const c1 = match.recordStop(0, 9974);
    expect(c1).toBe(997);

    // 10008ms rounds to 1001 centiseconds (10.01s)
    const c2 = match.recordStop(1, 10008);
    expect(c2).toBe(1001);
  });

  it("prevents repeated stops from overwriting initial stop time", () => {
    const match = new PerfectTimerMatch();
    const first = match.recordStop(0, 5000);
    const second = match.recordStop(0, 8000);
    expect(first).toBe(500);
    expect(second).toBe(500);
    expect(match.stops[0]).toBe(500);
  });

  it("calculates centisecond absolute error and determines winner accurately", () => {
    const match = new PerfectTimerMatch();
    // Target: 10.00 seconds (1000 centiseconds)
    match.target = 1000;

    // Player 1: 9.97s (997 centiseconds) -> Error: 3 (0.03s)
    // Player 2: 10.01s (1001 centiseconds) -> Error: 1 (0.01s)
    match.recordStop(0, 9970);
    match.recordStop(1, 10010);

    const res = match.resolveRound();
    expect(res.target).toBe(1000);
    expect(res.stops).toEqual([997, 1001]);
    expect(res.errors).toEqual([3, 1]);
    expect(res.winner).toBe(2); // Player 2 wins (closer)
    expect(match.scores).toEqual([0, 1]);
  });

  it("declares round tied when absolute errors in centiseconds are identical", () => {
    const match = new PerfectTimerMatch();
    match.target = 1000;

    // Player 1: 9.95s (995cs) -> Error: 5cs
    // Player 2: 10.05s (1005cs) -> Error: 5cs
    match.recordStop(0, 9950);
    match.recordStop(1, 10050);

    const res = match.resolveRound();
    expect(res.errors).toEqual([5, 5]);
    expect(res.winner).toBe("draw");
    expect(match.scores).toEqual([0, 0]); // no points awarded
  });

  it("progresses across 5 rounds and handles sudden death if tied", () => {
    const match = new PerfectTimerMatch();

    // Rounds 1..4: Alternate wins
    for (let r = 1; r <= 4; r++) {
      match.target = 1000;
      if (r <= 2) {
        match.recordStop(0, 10000);
        match.recordStop(1, 10500);
      } else {
        match.recordStop(0, 10500);
        match.recordStop(1, 10000);
      }
      match.resolveRound();
      match.nextRound();
    }

    // Round 5 tied: both 10000ms
    match.target = 1000;
    match.recordStop(0, 9900);
    match.recordStop(1, 10100);
    match.resolveRound();

    // Scores are 2 - 2 at round 5 -> Sudden Death!
    expect(match.scores).toEqual([2, 2]);
    expect(match.isMatchOver).toBe(false);
    expect(match.nextRound()).toBe(true);
    expect(match.round).toBe(6);
    expect(match.isSuddenDeath).toBe(true);

    // Sudden death round 6: Player 1 wins
    match.target = 743;
    match.recordStop(0, 7430); // 0 error
    match.recordStop(1, 7500); // 7 error
    match.resolveRound();

    expect(match.scores).toEqual([3, 2]);
    expect(match.isMatchOver).toBe(true);
    expect(match.matchWinner).toBe(1);
  });
});

describe("Perfect Timer AI", () => {
  it("schedules stops reflecting difficulty error distributions", () => {
    const target = 1000; // 10.00s
    const startMs = 100000;

    // Impossible uses the exact visible target; no artificial minimum error.
    const aiImp = new PerfectTimerAI("impossible", 42);
    aiImp.scheduleRound(target, startMs);
    // At target time (startMs + 10000ms), should not stop yet or already stopped within 80ms
    // Check scheduled stop time
    let stoppedAt = -1;
    for (let t = startMs; t <= startMs + 15000; t += 5) {
      if (aiImp.shouldStop(t)) {
        stoppedAt = t;
        break;
      }
    }
    const impErrCentiseconds = Math.abs(
      Math.round((stoppedAt - startMs) / 10) - target,
    );
    expect(impErrCentiseconds).toBe(0);

    // Hard AI: error 15..35 centiseconds (0.15s..0.35s)
    const aiHard = new PerfectTimerAI("hard", 42);
    aiHard.scheduleRound(target, startMs);
    stoppedAt = -1;
    for (let t = startMs; t <= startMs + 15000; t += 5) {
      if (aiHard.shouldStop(t)) {
        stoppedAt = t;
        break;
      }
    }
    const hardErrCentiseconds = Math.abs(
      Math.round((stoppedAt - startMs) / 10) - target,
    );
    expect(hardErrCentiseconds).toBeGreaterThanOrEqual(0);
    expect(hardErrCentiseconds).toBeLessThanOrEqual(35);

    // Medium AI: error 40..110 centiseconds (0.40s..1.10s)
    const aiMed = new PerfectTimerAI("medium", 42);
    aiMed.scheduleRound(target, startMs);
    stoppedAt = -1;
    for (let t = startMs; t <= startMs + 15000; t += 5) {
      if (aiMed.shouldStop(t)) {
        stoppedAt = t;
        break;
      }
    }
    const medErrCentiseconds = Math.abs(
      Math.round((stoppedAt - startMs) / 10) - target,
    );
    expect(medErrCentiseconds).toBeGreaterThanOrEqual(0);
    expect(medErrCentiseconds).toBeLessThanOrEqual(110);
  });
});
