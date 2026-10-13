import { it, expect } from "vitest";
import { LightMatch } from "../../src/games/light-fingers/Rules";
import { LightAI } from "../../src/games/light-fingers/AI";
it("Light Fingers penalizes early taps once and rejects multi-tap exploits", () => {
  const m = new LightMatch(() => 0);
  m.tap(0);
  m.tap(0);
  m.update(0.016);
  expect(m.scores).toEqual([0, 1]);
  m.tap(0);
  m.update(0.1);
  expect(m.scores).toEqual([0, 1]);
});
it("Light Fingers cannot accept a claim until the shared signal is presented", () => {
  const m = new LightMatch(() => 0);
  m.update(2);
  expect(m.phase).toBe("signal");
  m.tap(0);
  m.update(0.016);
  expect(m.scores).toEqual([0, 0]);
  m.presentSignal();
  m.tap(0);
  m.update(0.016);
  expect(m.scores).toEqual([1, 0]);
});
it("Light Fingers resolves simultaneous taps as a replay and ends at five", () => {
  const m = new LightMatch(() => 0);
  m.tap(0);
  m.tap(1);
  m.update(0.02);
  expect(m.scores).toEqual([0, 0]);
  for (let i = 0; i < 5; i++) {
    m.update(1.2);
    m.tap(1);
    m.update(0.02);
  }
  expect(m.winner).toBe(1);
  m.tap(1);
  m.update(1);
  expect(m.scores).toEqual([5, 0]);
});
it("Light AI never anticipates the signal and reacts with a legal minimum delay", () => {
  for (const d of ["medium", "hard", "impossible"] as const) {
    const m = new LightMatch(() => 0),
      ai = new LightAI(d, () => 0);
    for (let i = 0; i < 200; i++) {
      m.update(0.01);
      ai.update(m);
    }
    expect(m.scores).toEqual([0, 0]);
    m.presentSignal();
    for (let i = 0; i < 10; i++) {
      m.update(0.01);
      ai.update(m);
    }
    expect(m.scores).toEqual([0, 0]);
    for (let i = 0; i < 60; i++) {
      m.update(0.01);
      ai.update(m);
    }
    expect(m.scores).toEqual([0, 1]);
  }
});
