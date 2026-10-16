import { it, expect } from "vitest";
import { BirdsMatch } from "../../src/games/happy-birds/Rules";
import { BirdsAI } from "../../src/games/happy-birds/AI";
import {
  advanceBird,
  spikeCollision,
  RADIUS,
  HEIGHT,
} from "../../src/games/happy-birds/ArenaPhysics";
import {
  recoveryPose,
  recoveryColor,
  home,
} from "../../src/games/happy-birds/Recovery";
import { MatchRandom } from "../../src/shared/ai/MatchRandom";
import { pickupDistance, spawnStar } from "../../src/games/happy-birds/Stars";
function collect(m: BirdsMatch, player: 0 | 1) {
  m.players[player].x = player === 0 ? 100 : 220;
  m.players[player].y = 230;
  m.players[player].vy = 0;
  m.players[player].alive = true;
  m.players[player].recovery = 0;
  m.stars = [
    {
      id: 1000 + m.scores[player],
      x: m.players[player].x,
      y: 230,
      born: -1,
    },
  ];
  m.step(1 / 120);
}
it("flaps obey launch and flap cooldown; safe walls bounce without awarding stars", () => {
  const m = new BirdsMatch(1);
  expect(m.flap(0)).toBe(false);
  m.step(1.2);
  expect(m.flap(0)).toBe(true);
  expect(m.flap(0)).toBe(false);
  const p = {
    ...m.players[0],
    x: RADIUS + 0.1,
    y: 220,
    vy: 0,
    direction: -1 as const,
  };
  expect(advanceBird(p, 0.01, 115, m.walls)).toBe(0);
  expect(p.alive).toBe(true);
  expect(p.direction).toBe(1);
  expect(m.scores).toEqual([0, 0]);
});
it("triangle collisions start an independent three-second recovery without lost stars", () => {
  expect(spikeCollision(26, 44, 0, 0)).toBe(true);
  expect(spikeCollision(18 + RADIUS + 1, 44, 0, 0)).toBe(false);
  const m = new BirdsMatch(4);
  m.between = 0;
  m.scores = [7, 9];
  m.players[0].y = HEIGHT;
  m.step(1 / 120);
  expect(m.players[0].alive).toBe(false);
  expect(m.players[0].recovery).toBe(3);
  expect(m.flap(0)).toBe(false);
  expect(m.between).toBe(0);
  expect(m.scores).toEqual([7, 9]);
  const blueX = m.players[1].x;
  for (let i = 0; i < 359; i++) m.step(1 / 120);
  expect(m.players[0].alive).toBe(false);
  expect(m.players[0].recovery).toBeGreaterThan(0);
  expect(m.players[1].x).not.toBe(blueX);
  m.step(1 / 120);
  expect(m.players[0].alive).toBe(true);
  expect(m.players[0].recovery).toBe(0);
  expect(m.players[0].x).toBe(home(0).x);
  expect(m.players[0].y).toBe(230);
  expect(m.players[0].vy).toBeLessThan(0);
  expect(m.scores[0]).toBe(7);
  expect(m.scores[1]).toBeGreaterThanOrEqual(9);
});
it("the fifteenth real pickup ends the race; contacts cannot award duplicate points", () => {
  const m = new BirdsMatch(2);
  m.between = 0;
  for (let i = 0; i < 15; i++) {
    collect(m, 0);
    expect(m.scores[0]).toBe(i + 1);
    if (i < 14) {
      expect(m.winner).toBeNull();
      expect(m.stars).toHaveLength(1);
    } else expect(m.stars).toHaveLength(0);
  }
  expect(m.winner).toBe(1);
  expect(m.flap(1)).toBe(false);
  const final = JSON.stringify(m);
  m.step(1);
  expect(JSON.stringify(m)).toBe(final);
});
it("one shared star is awarded to its nearest collector; exact same-step finishes can draw", () => {
  const m = new BirdsMatch(9);
  m.between = 0;
  m.players.forEach((p) => {
    p.x = 160;
    p.y = 230;
    p.vy = 0;
  });
  m.scores = [14, 14];
  m.stars = [{ id: 99, x: 160, y: 230, born: -1 }];
  m.step(1 / 120);
  expect(m.scores).toEqual([15, 15]);
  expect(m.winner).toBe("draw");
});
it("recovering birds never collect stars and do not interrupt their opponent", () => {
  const m = new BirdsMatch(1);
  m.between = 0;
  m.players[0].y = HEIGHT;
  m.step(1 / 120);
  m.stars = [{ id: 1, x: m.players[0].x, y: m.players[0].y, born: -1 }];
  m.step(1 / 120);
  expect(m.scores).toEqual([0, 0]);
  collect(m, 1);
  expect(m.scores).toEqual([0, 1]);
});
it("stars spawn reproducibly away from spikes, and collectible collision is swept", () => {
  for (let seed = 0; seed < 100; seed++) {
    const a = new BirdsMatch(seed),
      b = new BirdsMatch(seed);
    expect(a.stars).toEqual(b.stars);
    for (const s of a.stars) {
      expect(s.x).toBeGreaterThan(55);
      expect(s.x).toBeLessThan(265);
      expect(s.y).toBeGreaterThan(70);
      expect(s.y).toBeLessThan(390);
    }
  }
  expect(
    pickupDistance(
      { id: 0, x: 100, y: 100, born: 0 },
      { x: 50, y: 100 },
      { x: 150, y: 100 },
    ),
  ).toBe(0);
});
it("recovery moves smoothly to the middle and restores all body colors without a countdown", () => {
  expect(recoveryPose(3)).toEqual({ progress: 0, travel: 0, tint: 0 });
  expect(recoveryPose(0)).toEqual({ progress: 1, travel: 1, tint: 1 });
  expect(recoveryColor(0xf49b58, 0)).toBe(0xa8afb1);
  expect(recoveryColor(0xf49b58, 1)).toBe(0xf49b58);
  let travel = 0,
    tint = 0;
  for (let i = 0; i <= 360; i++) {
    const p = recoveryPose(3 - i / 120);
    expect(p.travel).toBeGreaterThanOrEqual(travel);
    expect(p.tint).toBeGreaterThanOrEqual(tint);
    travel = p.travel;
    tint = p.tint;
  }
});
it("all difficulties finish genuine 15-star races across 100 seeds using legal flaps", () => {
  for (const d of ["medium", "hard", "impossible"] as const)
    for (let seed = 0; seed < 100; seed++) {
      const m = new BirdsMatch(seed),
        a = new BirdsAI(d, seed);
      for (let i = 0; i < 120 * 240 && !m.winner; i++) {
        if (a.update(1 / 120, m)) expect(m.flap(1)).toBe(true);
        m.step(1 / 120);
      }
      expect(m.winner, `${d} seed ${seed}: ${m.scores}`).toBe(2);
      expect(m.scores[1]).toBe(15);
    }
}, 120000);
it("a race does not expire before either participant collects fifteen", () => {
  const m = new BirdsMatch(1);
  m.between = 0;
  m.age = 121;
  m.scores = [8, 7];
  m.step(1 / 120);
  expect(m.winner).toBeNull();
  expect(m.scores).toEqual([8, 7]);
});
it("wall warning changes wait until every active bird clears that wall", () => {
  const m = new BirdsMatch(8);
  m.between = 0;
  const w = m.walls[0];
  w.pending = { rows: [0, 1, 7, 8], window: 3, remaining: 0 };
  m.players[0].x = 50;
  m.step(0.01);
  expect(w.pending).toBeDefined();
  m.players.forEach((p) => (p.x = 160));
  m.step(0.01);
  expect(w.pending).toBeUndefined();
  expect(w.version).toBe(1);
});

it("one shared star ranges across the arena without fixed slots or nearby repeat positions", () => {
  const m = new BirdsMatch(13),
    random = new MatchRandom(99),
    points: ReturnType<typeof spawnStar>[] = [];
  expect(m.stars).toHaveLength(1);
  for (let i = 0; i < 1000; i++) {
    const previous = points.at(-1),
      s = spawnStar(random, i, i, [], previous);
    if (previous)
      expect(
        Math.hypot(s.x - previous.x, s.y - previous.y),
      ).toBeGreaterThanOrEqual(80);
    const safe = spawnStar(random, i, i, m.players, previous);
    for (const p of m.players)
      expect(Math.hypot(safe.x - p.x, safe.y - p.y)).toBeGreaterThanOrEqual(65);
    points.push(s);
  }
  expect(
    Math.max(...points.map((s) => s.x)) - Math.min(...points.map((s) => s.x)),
  ).toBeGreaterThan(195);
  expect(
    Math.max(...points.map((s) => s.y)) - Math.min(...points.map((s) => s.y)),
  ).toBeGreaterThan(230);
  for (const x of [58, 126, 194])
    for (const y of [110, 190, 270])
      expect(
        points.filter(
          (s) => s.x >= x && s.x < x + 68 && s.y >= y && s.y < y + 80,
        ).length,
      ).toBeGreaterThan(30);
});
