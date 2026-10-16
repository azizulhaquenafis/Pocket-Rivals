import { expect, it } from "vitest";
import { GravityMatch } from "../../src/games/gravity-runner/Rules";
import { GravityView } from "../../src/games/gravity-runner/GravityView";
import { BirdsMatch } from "../../src/games/happy-birds/Rules";
import { BirdView } from "../../src/games/happy-birds/BirdView";
import { games, tournamentGames } from "../../src/core/GameRegistry";
it("deferred games are absent from active discovery and tournaments", () => {
  for (const id of [
    "car-duel",
    "flappy-jump",
    "archery-duel",
    "chicken-jump",
  ]) {
    expect(games.some((g) => g.id === id)).toBe(false);
    expect(tournamentGames.some((g) => g.id === id)).toBe(false);
  }
});
it("gravity presentation interpolates without changing physics or snapping flips", () => {
  const m = new GravityMatch(77),
    v = new GravityView();
  v.reset(m);
  v.capture(m);
  m.flip(0);
  v.flip(0);
  m.step(1 / 120);
  const physical = JSON.stringify(m);
  const start = v.sample(m, 0, 0),
    end = v.sample(m, 1, 1 / 60);
  expect(start.distance).toBe(0);
  expect(end.distance).toBe(m.distance);
  expect(end.players[0].angle).toBeGreaterThan(start.players[0].angle);
  expect(end.players[0].angle).toBeLessThan(Math.PI / 2);
  let angle = end.players[0].angle;
  for (let i = 0; i < 60; i++) {
    const next = v.sample(m, 0.5, 1 / 60).players[0].angle;
    expect(next).toBeGreaterThanOrEqual(angle);
    angle = next;
  }
  expect(angle).toBeCloseTo(Math.PI / 2, 4);
  expect(JSON.stringify(m)).toBe(physical);
  m.distance = 0;
  v.reset(m);
  expect(v.sample(m, 0.5, 0).distance).toBe(0);
});
it("bird wall turns blend continuously and respawn clears old trails", () => {
  const m = new BirdsMatch(77),
    v = new BirdView();
  v.reset(m);
  v.capture(m);
  m.players[0].x += 10;
  m.players[0].direction = -1;
  const physical = JSON.stringify(m),
    pose = v.sample(m, 0.5, 1 / 60)[0];
  expect(pose.x).toBe(105);
  expect(pose.face).toBeGreaterThan(-1);
  expect(pose.face).toBeLessThan(1);
  for (let i = 0; i < 60; i++) v.sample(m, 1, 1 / 60);
  expect(JSON.stringify(m)).toBe(physical);
  m.players[0].x = 100;
  v.reset(m);
  expect(v.trails[0].every((p) => p.x === 100)).toBe(true);
  expect(v.sample(m, 0.5, 0)[0].x).toBe(100);
});
