import { it, expect } from "vitest";
import { HandMotion } from "../../src/games/light-fingers/HandMotion";
import { LightMatch } from "../../src/games/light-fingers/Rules";

it("failed hands reach, recoil and regain color exactly when the legal cooldown ends", () => {
  const match = new LightMatch(() => 0),
    hand = new HandMotion();
  match.tap(0);
  hand.recover(match.time, match.blockedUntil[0]);
  expect(hand.pose(0).reach).toBe(0);
  expect(hand.pose(0.15).reach).toBeCloseTo(1);
  expect(hand.pose(0.2).gray).toBe(1);
  expect(hand.pose(0.5).reach).toBeLessThan(0);
  expect(hand.pose(1).gray).toBeLessThan(hand.pose(0.5).gray);
  expect(hand.pose(1.25)).toEqual({
    reach: 0,
    gray: 0,
    grip: 0,
    carrying: false,
    phase: "ready",
  });
  match.update(1.25);
  expect(match.canTap(0)).toBe(true);
  expect(match.scores).toEqual([0, 0]);
});
it("outcome changes continue from the current hand position rather than snapping", () => {
  for (const outcome of ["steal", "recover"] as const) {
    const hand = new HandMotion();
    hand.grab(0);
    const before = hand.pose(0.07).reach;
    if (outcome === "steal") hand.steal(0.07);
    else hand.recover(0.07, 1.32);
    expect(hand.pose(0.07).reach).toBeCloseTo(before);
    expect(Math.abs(hand.pose(0.0701).reach - before)).toBeLessThan(0.001);
  }
});
it("a steal closes the fingers, carries the gem and returns to its own home", () => {
  const hand = new HandMotion();
  hand.steal(2);
  expect(hand.pose(2.1).carrying).toBe(false);
  expect(hand.pose(2.2).reach).toBe(1);
  expect(hand.pose(2.3).carrying).toBe(true);
  expect(hand.pose(2.3).grip).toBe(1);
  expect(hand.pose(2.6).reach).toBeLessThan(0.5);
  expect(hand.pose(2.85).phase).toBe("ready");
});
it("failed retries neither extend recovery nor animate the idle opponent", () => {
  const match = new LightMatch(() => 0),
    hands = [new HandMotion(), new HandMotion()];
  match.tap(0);
  const until = match.blockedUntil[0];
  hands[0].recover(0, until);
  for (let i = 0; i < 100; i++) {
    match.update(0.01);
    expect(match.tap(0)).toBe(false);
    expect(match.blockedUntil[0]).toBe(until);
    expect(hands[1].pose(match.time).phase).toBe("ready");
  }
  expect(hands[0].pose(match.time).phase).toBe("recovery");
});
