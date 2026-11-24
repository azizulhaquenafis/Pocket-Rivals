import { it, expect } from "vitest";
import { CONTOURS, pointAt } from "../../src/arcade/color-switch/Contours";
import {
  COLOR_TIERS,
  ColorWorld,
  COURSE_X,
  crossing,
  touchesWrongColor,
  visitColorBands,
} from "../../src/arcade/color-switch/Rules";

it("tiers differ in real band speed, width, obstacle spacing and guidance", () => {
  const tiers = Object.values(COLOR_TIERS);
  const speeds = tiers.map((tier) => tier.speed);
  expect(speeds[0]).toBeLessThan(speeds[1]);
  expect(speeds[1]).toBeLessThan(speeds[2]);
  for (const field of ["window", "spacing", "lane"] as const) {
    expect(tiers[0][field]).toBeGreaterThan(tiers[1][field]);
    expect(tiers[1][field]).toBeGreaterThan(tiers[2][field]);
  }
  expect(tiers.map((tier) => tier.guide)).toEqual([true, false, false]);
});

it.each(["medium", "hard", "impossible"] as const)(
  "%s: paint moves along fixed contours and visible colors agree with contacts",
  (tier) => {
    const w = new ColorWorld(tier);
    const thickness = w.settings.thickness;
    for (let index = 0; index < 20; index++) {
      const initial = w.obstacle(index);
      const originalOutline = CONTOURS[initial.shape];
      const opens = [0, 0];
      for (let k = 0; k < 24; k++) {
        w.time =
          (k * originalOutline[0].length) /
          (24 * (w.settings.speed + Math.min(18, index * 1.4)));
        const obstacle = w.obstacle(index);
        expect(obstacle.center).toBe(initial.center);
        expect(CONTOURS[obstacle.shape]).toBe(originalOutline);

        for (const entry of [false, true]) {
          const { x, y } = crossing(obstacle, entry);
          expect(Math.abs(x - COURSE_X)).toBeLessThan(w.settings.lane / 2);
          if (!touchesWrongColor(obstacle, x, y, thickness))
            opens[entry ? 0 : 1]++;
        }
        visitColorBands(obstacle, (path, from, to, offset) => {
          const x = pointAt(path, (from + to) / 2);
          if (offset && to - from > 1) {
            expect(
              touchesWrongColor(
                obstacle,
                COURSE_X + x.x,
                obstacle.center + x.y,
                thickness,
              ),
            ).toBe(true);
          }
        });
      }
      for (const open of opens) {
        expect(open).toBeGreaterThan(0);
        expect(open).toBeLessThan(16);
      }
    }
  },
);

it("Impossible gives a materially shorter exit timing window than Hard and Medium", () => {
  const contour = CONTOURS.ring[0];
  const durations = (["medium", "hard", "impossible"] as const).map((tier) => {
    const w = new ColorWorld(tier);
    const dt = contour.length / w.settings.speed / 360;
    const exit = crossing(w.obstacle(), false);
    let open = 0;
    for (let i = 0; i < 360; i++) {
      w.time = i * dt;
      if (
        !touchesWrongColor(w.obstacle(), exit.x, exit.y, w.settings.thickness)
      )
        open += dt;
    }
    return open;
  });
  expect(durations[0]).toBeGreaterThan(durations[1] * 1.5);
  expect(durations[1]).toBeGreaterThan(durations[2] * 1.5);
  expect(durations[2]).toBeGreaterThan(0.24);
  expect(durations[2]).toBeLessThan(0.37);
});
