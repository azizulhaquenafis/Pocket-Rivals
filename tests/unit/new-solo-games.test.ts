import { describe, it, expect } from "vitest";
import { DriftWorld, DRIFT_TIERS } from "../../src/future-games/pocket-drift/Rules";
import { MagnetWorld, MAGNET_TIERS } from "../../src/future-games/magnet-dash/Rules";
import { GliderWorld, GLIDER_TIERS } from "../../src/arcade/paper-glider/Rules";
import {
  FoundryWorld,
  FOUNDRY_TIERS,
} from "../../src/future-games/tiny-foundry/Rules";
import { ShadowWorld, SHADOW_TIERS } from "../../src/future-games/shadow-step/Rules";
import { DominoWorld, DOMINO_TIERS } from "../../src/future-games/domino-lab/Rules";
const tiers = ["medium", "hard", "impossible"] as const;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));
for (const tier of tiers) {
  it(`Drift ${tier}: physical steering completes three ordered laps`, () => {
    const w = new DriftWorld(tier);
    for (let i = 0; i < 120 * 100 && !w.done; i++) {
      const base = w.point(w.theta - 0.23),
        target = {
          x: 210 + (base.x - 210) * 0.94,
          y: 383 + (base.y - 383) * 0.94,
        },
        desired = Math.atan2(target.y - w.y, target.x - w.x),
        error = Math.atan2(
          Math.sin(desired - w.angle),
          Math.cos(desired - w.angle),
        );
      w.step(
        1 / 120,
        clamp((error * 3) / w.settings.turn),
        Math.abs(error) > 0.7,
      );
    }
    expect(w.lap, JSON.stringify(w)).toBe(3);
    expect(w.score).toBeGreaterThanOrEqual(600);
  });
  it(`Magnet ${tier}: legal polarity decisions survive a seeded minute`, () => {
    const w = new MagnetWorld(tier, 123);
    for (let i = 0; i < 120 * 60 && !w.done; i++) {
      const next = w.rows.find((r) => !r.passed && r.y < 530);
      if (next && next.y > 220 && w.side === next.side) w.flip();
      w.step(1 / 120);
    }
    expect(w.done).toBe(false);
    expect(w.score).toBeGreaterThan(150);
    expect(w.rows.length).toBeLessThan(5);
  });
  it(`Glider ${tier}: endless narrowing levels, rings, air resistance and precision landings`, () => {
    const w = new GliderWorld(tier);
    const gaps: number[] = [];
    for (let targetLevel = 1; targetLevel <= 3; targetLevel++) {
      expect(w.level).toBe(targetLevel);
      gaps.push(w.gap);
      for (let i = 0; i < 120 * 45 && w.level === targetLevel && !w.done; i++) {
        const wall = w.walls.find((p) => p.y + 20 > w.y),
          ring = w.targets.find((p) => !p.passed);
        const next = wall && (!ring || wall.y < ring.y) ? wall : ring;
        const x = next ? next.x : w.landing;
        const steer = clamp((x - w.x) * 0.06 - w.vx * 0.008);
        w.step(1 / 120, steer, w.y > w.length - 200);
      }
      expect(w.done).toBe(false);
    }
    expect(w.level).toBe(4);
    expect(gaps[1]).toBeLessThan(gaps[0]);
    expect(gaps[2]).toBeLessThan(gaps[1]);
    expect(w.gap).toBeLessThan(gaps[2]);
    expect(w.score).toBeGreaterThanOrEqual(650);
  });
  it(`Foundry ${tier}: casts can meet all eight targets through timed pouring`, () => {
    const w = new FoundryWorld(tier);
    for (let i = 0; i < 120 * 240 && !w.done; i++) {
      // Predict the mold at the actual ballistic arrival time; no score mutation.
      const flight = (-55 + Math.sqrt(55 * 55 + 2 * 600 * 222)) / 600;
      const landingX =
        210 +
        Math.sin((w.time + flight) * w.settings.speed + w.level * 0.4) * 100;
      w.hold(
        w.fill + w.drops.length < w.target &&
          Math.abs(landingX - 210) < w.settings.width / 2 - 12,
      );
      if (w.fill >= w.target - 1 && !w.drops.length) w.finish();
      w.step(1 / 120);
    }
    expect(w.level, JSON.stringify(w)).toBe(9);
    expect(w.score).toBeGreaterThan(650);
  });
  it(`Domino ${tier}: six puzzles have legal bounded-piece solutions`, () => {
    const w = new DominoWorld(tier);
    for (let level = 1; level <= 6; level++) {
      expect(w.level).toBe(level);
      const solution = w.solution();
      expect(solution.length).toBeGreaterThan(10);
      for (const p of solution.slice(1, -1)) expect(w.place(p)).toBe(true);
      expect(w.pieces.length).toBeLessThanOrEqual(w.budget);
      expect(w.launch()).toBe(true);
      for (let i = 0; i < 120 * 25 && w.level === level && !w.done; i++)
        w.step(1 / 120);
    }
    expect(w.done).toBe(true);
    expect(w.lives).toBe(3);
    expect(w.score).toBeGreaterThanOrEqual(600);
  });
}
it("tiers change physical demands, not just labels", () => {
  expect(DRIFT_TIERS.impossible.speed).toBeGreaterThan(
    DRIFT_TIERS.medium.speed,
  );
  expect(MAGNET_TIERS.impossible.spacing).toBeLessThan(
    MAGNET_TIERS.medium.spacing,
  );
  expect(GLIDER_TIERS.impossible.gap).toBeLessThan(GLIDER_TIERS.medium.gap);
  expect(FOUNDRY_TIERS.impossible.tolerance).toBeLessThan(
    FOUNDRY_TIERS.medium.tolerance,
  );
  expect(SHADOW_TIERS.impossible.exposure).toBeLessThan(
    SHADOW_TIERS.medium.exposure,
  );
  expect(DOMINO_TIERS.impossible.spare).toBeLessThan(DOMINO_TIERS.medium.spare);
});
it("Magnet seeded replay is identical and collisions really end a run", () => {
  const a = new MagnetWorld("hard", 88),
    b = new MagnetWorld("hard", 88);
  for (let i = 0; i < 120 * 80; i++) {
    a.step(1 / 120);
    b.step(1 / 120);
  }
  expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  expect(a.done).toBe(true);
  expect(a.lives).toBe(0);
  const score = a.score;
  a.flip();
  a.step(10);
  expect(a.score).toBe(score);
});
it("Glider failure loses hearts without farming unbanked ring points, and air resistance favors tailwind", () => {
  const rng = (seed: number) => () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let seed = 1; seed <= 30; seed++) {
    const w = new GliderWorld("medium", rng(seed));
    for (let i = 0; i < 120 * 90 && !w.done; i++) w.step(1 / 120);
    expect(w.done).toBe(true);
    expect(w.score).toBe(0);
    expect(w.lives).toBe(0);
  }

  // Organic random wind shifts gradually without oscillating identically across seeds.
  const a = new GliderWorld("medium", rng(101));
  const b = new GliderWorld("medium", rng(202));
  a.walls = [];
  b.walls = [];
  let maxDeltaPerSec = 0;
  let prev = a.windRatio;
  for (let i = 0; i < 120 * 12; i++) {
    a.step(1 / 120, 0, true);
    b.step(1 / 120, 0, true);
    maxDeltaPerSec = Math.max(maxDeltaPerSec, Math.abs(a.windRatio - prev) * 120);
    prev = a.windRatio;
  }
  expect(a.windRatio).not.toBeCloseTo(b.windRatio, 2);
  expect(maxDeltaPerSec).toBeLessThan(2.2);

  // Air resistance check: steering WITH crosswind moves faster than steering AGAINST it.
  const tail = new GliderWorld("hard");
  const head = new GliderWorld("hard");
  tail.walls = [];
  head.walls = [];
  // Choose an altitude where wind blows strongly right (positive).
  Object.defineProperty(tail, "wind", { get: () => 70 });
  Object.defineProperty(head, "wind", { get: () => 70 });
  for (let i = 0; i < 180; i++) {
    tail.x = 210;
    head.x = 210;
    tail.step(1 / 120, 1, false);
    head.step(1 / 120, -1, false);
  }
  expect(tail.vx).toBeGreaterThan(Math.abs(head.vx) * 1.6);
  expect(head.vx).toBeLessThan(-50);

  // Red-dotted miss line check: landing outside the runway loses a heart cleanly.
  const miss = new GliderWorld("medium");
  miss.walls = [];
  miss.x = miss.landing > 210 ? 45 : 375;
  miss.y = miss.length - 0.5;
  miss.step(1 / 120, 0, false);
  expect(miss.lives).toBe(2);
  expect(miss.lastCrash?.reason).toBe("miss");
});
it("Foundry cannot award a cast before drops settle; pause release stops pouring", () => {
  const w = new FoundryWorld();
  w.hold(true);
  for (let i = 0; i < 50; i++) w.step(1 / 120);
  expect(w.drops.length).toBeGreaterThan(0);
  w.finish();
  expect(w.score).toBe(0);
  w.hold(true);
  expect(w.pouring).toBe(false);
  for (let i = 0; i < 120; i++) w.step(1 / 120);
  expect(w.lives).toBe(2);
});
it("Domino rejects blocks, duplicates and impossible gap chains", () => {
  const w = new DominoWorld();
  expect(w.place(w.start)).toBe(false);
  const n = [...w.walls][0];
  expect(w.place({ c: n % 7, r: Math.floor(n / 7) })).toBe(false);
  expect(w.place({ c: 6, r: 7 })).toBe(true);
  expect(w.place({ c: 6, r: 7 })).toBe(false);
  w.launch();
  for (let i = 0; i < 500; i++) w.step(1 / 120);
  expect(w.lives).toBe(2);
  expect(w.phase).toBe("plan");
  expect(w.score).toBe(0);
});
it("Shadow walls occlude searchlights and held movement cannot tunnel into cover", () => {
  const w = new ShadowWorld();
  const p = w.center(1, 1);
  w.walls.add(8);
  w.x = p.x - 44;
  w.y = p.y;
  for (let i = 0; i < 40; i++) w.move(1, 0, 1 / 120);
  expect(w.x).toBeLessThan(p.x - 24);
  expect(w.visible({ x: p.x - 44, y: p.y, angle: 0 }, p.x + 44, p.y)).toBe(
    false,
  );
});
it("Shadow every room has connected key and exit routes", () => {
  const w = new ShadowWorld();
  for (let level = 1; level <= 5; level++) {
    w.level = level;
    w.room();
    w.route(w.treasure.x, w.treasure.y);
    expect(w.path.length).toBeGreaterThan(0);
    w.x = w.treasure.x;
    w.y = w.treasure.y;
    w.route(w.exit.x, w.exit.y);
    expect(w.path.length).toBeGreaterThan(0);
  }
});
it("Shadow detection costs a life and grants a visible recovery before restarting", () => {
  const w = new ShadowWorld("impossible");
  const g = w.guards[0];
  w.x = g.x;
  w.y = g.y;
  for (let i = 0; i < 120 && !w.recovery; i++) w.step(1 / 120);
  expect(w.lives).toBe(2);
  expect(w.recovery).toBeGreaterThan(0);
  expect(w.x).toBe(w.center(0, 8).x);
});
for (const tier of tiers)
  it(`Shadow ${tier}: all five rooms admit a timed, undetected legal route`, () => {
    const w = new ShadowWorld(tier);
    function plan(goal: { x: number; y: number }) {
      const start = w.tile(w.x, w.y),
        end = w.tile(goal.x, goal.y),
        q = [{ c: start.c, r: start.r, n: 0, parent: -1 }],
        seen = new Set<string>();
      for (let at = 0; at < q.length; at++) {
        const a = q[at];
        if (a.c === end.c && a.r === end.r) {
          const steps: { c: number; r: number }[] = [];
          for (let i = at; q[i].parent >= 0; i = q[i].parent) steps.push(q[i]);
          return steps.reverse();
        }
        if (a.n >= 180) continue;
        for (const [dc, dr] of [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, -1],
          [0, 1],
        ]) {
          const c = a.c + dc,
            r = a.r + dr,
            n = a.n + 1,
            key = `${c},${r},${n}`;
          if (!w.free(c, r) || seen.has(key)) continue;
          const from = w.center(a.c, a.r),
            to = w.center(c, r);
          let safe = true;
          for (let j = 0; j <= 8 && safe; j++) {
            const t = (a.n + j / 8) * 0.4,
              x = from.x + ((to.x - from.x) * j) / 8,
              y = from.y + ((to.y - from.y) * j) / 8;
            safe = !w.guards.some((g, i) =>
              w.visible(
                {
                  ...g,
                  angle:
                    (w.time + t) * w.settings.sweep * (i ? -1 : 1) +
                    i * Math.PI +
                    w.level * 0.4,
                },
                x,
                y,
              ),
            );
          }
          if (safe) {
            seen.add(key);
            q.push({ c, r, n, parent: at });
          }
        }
      }
      throw Error(`No safe route ${tier} room ${w.level}`);
    }
    for (let room = 1; room <= 5; room++) {
      expect(w.level).toBe(room);
      for (const goal of [w.treasure, w.exit]) {
        const path = plan(goal);
        for (const p of path) {
          const target = w.center(p.c, p.r);
          w.route(target.x, target.y);
          for (let i = 0; i < 48; i++) w.step(1 / 120);
        }
      }
      for (let i = 0; i < 120; i++) w.step(1 / 120);
    }
    expect(w.done).toBe(true);
    expect(w.level).toBe(6);
    expect(w.lives).toBe(3);
    expect(w.score).toBe(625);
  });

it("Foundry mold graphics represent actual filled volume for every shape", async () => {
  const { MOLDS, area } = await import("../../src/future-games/tiny-foundry/Molds");
  for (const mold of MOLDS)
    for (let v = 0; v <= 100; v++)
      expect(area(mold.fills[v].points) / area(mold.outline)).toBeCloseTo(
        v / 100,
        4,
      );
});

it("finished boards retain their final layout during the results transition", () => {
  const d = new DominoWorld();
  d.level = 6;
  d.layout();
  const start = d.start,
    goal = d.goal;
  d.level = 7;
  expect(d.start).toEqual(start);
  expect(d.goal).toEqual(goal);
  const g = new GliderWorld();
  g.level = 3;
  const strip = g.landing,
    length = g.length;
  g.lives = 1;
  g.crash("miss");
  expect(g.done).toBe(true);
  expect(g.landing).toBe(strip);
  expect(g.length).toBe(length);
  const f = new FoundryWorld();
  f.level = 8;
  const mold = f.x,
    target = f.target;
  f.level = 9;
  expect(f.x).toBe(mold);
  expect(f.target).toBe(target);
});
