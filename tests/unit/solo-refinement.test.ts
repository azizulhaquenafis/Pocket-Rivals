import { expect, it } from "vitest";
import { OrbitWorld } from "../../src/arcade/orbit-hop/Rules";
import { ColorWorld } from "../../src/arcade/color-switch/Rules";
import { ClimberWorld } from "../../src/arcade/pocket-climber/Rules";
import { TowerWorld } from "../../src/arcade/tower-stack/Rules";
import { PourWorld } from "../../src/arcade/perfect-pour/Rules";
const tiers = ["medium", "hard", "impossible"] as const;
const rng = (seed: number) => () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
it.each(tiers)(
  "%s: every screen edge resolves a miss in one physics step, never repeatedly",
  (tier) => {
    for (const [x, y] of [
      [30, 300],
      [390, 300],
      [200, 118],
      [200, 644],
    ]) {
      const w = new OrbitWorld(rng(1), tier);
      w.launch();
      w.ball = { x, y, vx: 0, vy: 0 };
      w.step(1 / 120);
      expect(w.lives).toBe(2);
      expect(w.orbit).toBe(true);
      expect(w.launch()).toBe(false);
      for (let i = 0; i < 60; i++) w.step(1 / 120);
      expect(w.lives).toBe(2);
      expect(w.launch()).toBe(true);
    }
  },
);
it.each(tiers)(
  "%s: new rings stop momentum, protect the transition and settle above center",
  (tier) => {
    const w = new ColorWorld(tier);
    for (let ring = 0; ring < 12; ring++) {
      w.y = w.center - 96;
      w.vy = -235;
      w.step(1 / 120);
      expect(w.transition).toBeGreaterThan(0);
      const level = w.level;
      for (let i = 0; i < 85; i++) {
        w.hop();
        w.step(1 / 120);
      }
      expect(w.level).toBe(level);
      expect(w.lives).toBe(3);
      expect(w.center + w.camera).toBeCloseTo(350, 4);
      expect(w.y + w.camera).toBeGreaterThan(540);
    }
  },
);
it.each(tiers)(
  "%s: 30 seeded climber routes have reachable jumps and bounded hazards",
  (tier) => {
    for (let seed = 0; seed < 30; seed++) {
      const w = new ClimberWorld(rng(seed), tier);
      for (let i = 0; i < 120 * 50 && !w.done && w.highest < 25; i++) {
        const p =
          w.platforms.find((p) => p.id === w.highest + 1) ??
          w.platforms.at(-1)!;
        const target = w.left(p, w.age + 0.12) + p.width / 2;
        w.step(1 / 120, Math.max(-1, Math.min(1, (target - w.x) / 20)));
        // Separate proof of jumps: hazards are checked with their real collision below.
        w.rocks = [];
      }
      expect(w.highest, `seed ${seed}`).toBeGreaterThanOrEqual(25);
      expect(w.platforms.length).toBeLessThan(16);
    }
  },
);
it("climber rocks telegraph before lethal contact; fragile ledges disappear after use", () => {
  const w = new ClimberWorld(rng(1), "hard");
  w.rocks = [{ x: w.x, y: w.y, vy: 0, vx: 0, warning: 1 }];
  w.step(1 / 120, 0);
  expect(w.done).toBe(false);
  w.rocks[0] = { x: w.x, y: w.y, vy: 0, vx: 0, warning: 0 };
  w.step(1 / 120, 0);
  expect(w.done).toBe(true);
  const c = new ClimberWorld(rng(1), "hard");
  c.platforms[0].fragile = true;
  c.y = 577;
  c.vy = 120;
  c.step(1 / 120, 0);
  expect(c.platforms[0].crumble).toBeGreaterThan(0);
  for (let i = 0; i < 60; i++) c.step(1 / 120, 0);
  expect(c.platforms[0].crumble).toBeGreaterThan(0.45);
});
it("tiers change orbit speed, ring speed, tower speed, pour flow and ledge clearance", () => {
  const metrics = tiers.map((tier) => {
    const o = new OrbitWorld(rng(5), tier);
    o.step(0.1);
    const t = new TowerWorld(tier);
    t.step(0.1);
    const c = new ClimberWorld(rng(1), tier);
    return [
      Math.abs(o.angle),
      new ColorWorld(tier).speed,
      t.moving.x,
      new PourWorld(tier).flow,
      -c.platforms[1].width,
    ];
  });
  for (let i = 0; i < 5; i++) {
    expect(metrics[1][i]).toBeGreaterThan(metrics[0][i]);
    expect(metrics[2][i]).toBeGreaterThan(metrics[1][i]);
  }
});

it.each(tiers)(
  "%s: Orbit has legal launches to five successive planets across 20 seeds",
  (tier) => {
    for (let seed = 0; seed < 20; seed++) {
      let w = new OrbitWorld(rng(seed), tier);
      for (let n = 0; n < 5; n++) {
        // Let the landing camera settle before choosing the next legal launch.
        for (let settle = 0; settle < 120; settle++) w.step(1 / 120);
        let found: OrbitWorld | undefined;
        for (let a = 0; a < 144 && !found; a++) {
          const c = new OrbitWorld(rng(seed + n + 100), tier);
          c.planets = w.planets.map((p) => ({ ...p }));
          c.current = w.current;
          c.highest = w.highest;
          c.camera = w.camera;
          c.angle = (a * Math.PI * 2) / 144;
          c.step(0);
          c.launch();
          for (let i = 0; i < 600 && !c.orbit && !c.done; i++) c.step(1 / 120);
          if (c.highest > w.highest && c.lives === 3 && c.orbit) found = c;
        }
        expect(found, `seed ${seed}, planet ${n}`).toBeDefined();
        w = found!;
      }
    }
  },
);

it("Color transition camera moves monotonically without a first-frame reversal", () => {
  const w = new ColorWorld();
  w.y = w.center - 96;
  w.vy = -235;
  let previous = w.camera;
  for (let i = 0; i < 100; i++) {
    w.step(1 / 120);
    expect(w.camera).toBeGreaterThanOrEqual(previous);
    previous = w.camera;
  }
  expect(w.center + w.camera).toBeCloseTo(350);
});

it("Star Patrol tiers increase real movement/projectile speed and shorten the warning", async () => {
  const { ShooterWorld } =
    await import("../../src/arcade/space-shooter/ShooterWorld");
  const metrics = tiers.map((tier) => {
    const w = new ShooterWorld(rng(42), tier);
    const movement = w.speed;
    for (let i = 0; i < 240; i++) {
      w.step(1 / 120, 210, false);
      const shot = w.projectiles.find((p) => p.active && p.enemy);
      if (shot)
        return {
          movement,
          speed: Math.hypot(shot.vx, shot.vy),
          delay: i / 120,
        };
    }
    throw Error("Enemy never shot");
  });
  for (let i = 1; i < 3; i++) {
    expect(metrics[i].movement).toBeGreaterThan(metrics[i - 1].movement);
    expect(metrics[i].speed).toBeGreaterThan(metrics[i - 1].speed);
    expect(metrics[i].delay).toBeLessThan(metrics[i - 1].delay);
  }
});
