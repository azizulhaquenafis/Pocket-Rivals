import { it, expect } from "vitest";
import {
  ColorWorld,
  crossing,
  touchesWrongColor,
} from "../../src/arcade/color-switch/Rules";
import {
  STEP,
  planCrossing,
  replayCrossing,
} from "../helpers/color-switch-replay";

const tiers = ["medium", "hard", "impossible"] as const;

function climb(w: ColorWorld, count: number, margin = 0) {
  const lives = w.lives;
  for (let shape = 0; shape < count; shape++) {
    const score = w.score;
    replayCrossing(w, planCrossing(w, margin));
    expect(w.score).toBe(score + 100);
    expect(w.lives).toBe(lives);
    expect(w.color).toBe(w.obstacle().color);
    expect(w.vy).toBeLessThan(0);
  }
}

it.each(tiers)(
  "%s has legal timed routes through the five shapes and into the next rotation",
  (tier) => {
    const w = new ColorWorld(tier);
    climb(w, 6, 10);
    expect(w.score).toBe(600);
  },
);

it.each(tiers)(
  "%s needs a timed exit and can wait inside the opening ring",
  (tier) => {
    const w = new ColorWorld(tier);
    const taps = planCrossing(w);
    let waitedInside = 0;
    const impactHeight = crossing(w.obstacle(), false).y;
    for (const tap of taps) {
      if (tap) w.hop();
      for (let i = 0; i < 6; i++) {
        w.step(STEP);
        if (
          w.y > w.obstacle().center - 55 &&
          w.y < w.obstacle().center + 55 &&
          touchesWrongColor(
            w.obstacle(),
            w.x,
            impactHeight,
            w.settings.thickness,
          )
        )
          waitedInside++;
      }
    }
    expect(waitedInside * STEP).toBeGreaterThan(0.38);
    expect(w.cleared).toBe(1);
    expect(w.lives).toBe(3);
  },
);

it("blind repeated hops are punished on Impossible while timed taps clear the same start", () => {
  const w = new ColorWorld("impossible");
  for (let tick = 0; tick < 900 && w.lives === 3 && !w.cleared; tick++) {
    if (tick % 24 === 0) w.hop();
    w.step(STEP);
  }
  expect(w.lives).toBe(2);
  expect(w.cleared).toBe(0);
  const timed = new ColorWorld("impossible");
  climb(timed, 2);
});

it.each([0.35, 1.15, 2.3])(
  "Impossible has a continuous route with a %ss delayed start",
  (delay) => {
    const w = new ColorWorld("impossible");
    for (let tick = 0; tick < Math.round(delay / STEP); tick++) w.step(STEP);
    climb(w, 10, 10);
    expect(w.lives).toBe(3);
  },
);

it("falling after a clear costs one life and retries from the next shape", () => {
  const w = new ColorWorld();
  climb(w, 3);
  for (let i = 0; i < 300; i++) w.step(STEP);
  expect(w.lives).toBe(2);
  expect(w.cleared).toBe(3);
  expect(w.score).toBe(300);
  const y = w.y;
  for (let i = 0; i < 120; i++) w.step(STEP);
  expect(w.y).toBe(y);
  climb(w, 2);
});

it.each(tiers)(
  "%s: each switch scores once and recovering keeps the new color",
  (tier) => {
    const w = new ColorWorld(tier);
    climb(w, 2);
    const current = w.obstacle();
    const color = w.color;
    expect(w.switchFlash).toBeGreaterThan(0);
    for (let tick = 0; tick < 300 && !w.grace; tick++) w.step(STEP);
    expect(w.lives).toBe(2);
    expect(w.score).toBe(200);
    expect(w.color).toBe(color);
    expect(w.y).toBeGreaterThan(current.center + current.extent + 60);
    w.hop();
    w.hop();
    while (w.grace) w.step(STEP);
    expect(w.vy).toBeLessThan(0);
    for (let i = 0; i < 50; i++) w.step(STEP);
    expect(w.vy).toBeGreaterThan(0);
    expect(w.lives).toBe(2);
    expect(w.color).toBe(color);
  },
);

it("clearing input during a retry cancels the buffered tap", () => {
  const w = new ColorWorld();
  climb(w, 2);
  for (let tick = 0; tick < 300 && !w.grace; tick++) w.step(STEP);
  expect(w.grace).toBeGreaterThan(0);
  w.hop();
  w.clearInput();
  const retryY = w.y;
  for (let tick = 0; tick < 100; tick++) w.step(STEP);
  expect(w.y).toBe(retryY);
  expect(w.vy).toBe(0);
  expect(w.score).toBe(200);
});
