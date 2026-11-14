import { describe, expect, it } from "vitest";
import { OrbitWorld } from "../../src/arcade/orbit-hop/Rules";
const tiers = ["medium", "hard", "impossible"] as const;
const rng = (seed: number) => () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
function shot(w: OrbitWorld, angle: number, ballistic = false) {
  const c = new OrbitWorld(rng(w.highest + 927), w.difficulty);
  c.planets = w.planets.map((p) => ({ ...p }));
  c.current = w.current;
  c.highest = w.highest;
  c.camera = w.camera;
  c.angle = angle;
  c.step(0);
  if (ballistic) c.gravityAt = () => ({ x: 0, y: 0 });
  c.launch();
  for (let i = 0; i < 600 && !c.orbit && !c.done; i++) c.step(1 / 120);
  return c;
}
describe("Orbit Hop gravity journey", () => {
  it.each(tiers)(
    "%s: gravity is inward, finite and fades continuously at the visible halo",
    (tier) => {
      const w = new OrbitWorld(rng(1), tier);
      const p = w.planets[1];
      w.planets = [w.planets[0], p];
      const radius = w.fieldRadius(p);
      expect(w.gravityAt(p.x + radius + 1, p.y)).toEqual({ x: 0, y: 0 });
      const edge = w.gravityAt(p.x + radius - 0.01, p.y);
      expect(edge.x).toBeLessThan(0);
      expect(Math.abs(edge.x)).toBeLessThan(0.001);
      const inner = w.gravityAt(p.x + p.r + 9, p.y);
      expect(inner.x).toBeLessThan(-200);
      expect(Math.abs(inner.x)).toBeLessThanOrEqual(w.tuning.pull);
      expect(inner.y).toBe(0);
    },
  );
  it("gravity really bends a near miss into a landing; it never teleports at halo entry", () => {
    const w = new OrbitWorld(rng(7));
    let assisted = false;
    for (let i = 0; i < 360 && !assisted; i++) {
      const a = (i * Math.PI) / 180;
      const curved = shot(w, a),
        straight = shot(w, a, true);
      assisted =
        curved.highest > 0 && curved.lives === 3 && straight.highest === 0;
    }
    expect(assisted).toBe(true);
    w.orbit = false;
    w.flight = 1;
    const p = w.planets[1];
    w.ball = { x: p.x + w.fieldRadius(p) - 1, y: p.y, vx: -30, vy: 0 };
    const x = w.ball.x;
    w.step(1 / 120);
    expect(w.orbit).toBe(false);
    expect(Math.abs(w.ball.x - x)).toBeLessThan(1);
  });
  it("tiers reduce planet/field sizes and increase gaps and orbit timing pressure", () => {
    const worlds = tiers.map((t) => new OrbitWorld(rng(23), t));
    for (let i = 1; i < worlds.length; i++) {
      const a = worlds[i - 1],
        b = worlds[i];
      expect(b.planets[1].r).toBeLessThan(a.planets[1].r);
      expect(b.fieldRadius(b.planets[1])).toBeLessThan(
        a.fieldRadius(a.planets[1]),
      );
      expect(b.planets[0].y - b.planets[1].y).toBeGreaterThan(
        a.planets[0].y - a.planets[1].y,
      );
      expect(b.tuning.orbit).toBeGreaterThan(a.tuning.orbit);
    }
  });
  it.each(tiers)(
    "%s: 80 seeded ten-planet journeys have legal launch routes and bounded storage",
    (tier) => {
      for (let seed = 0; seed < 80; seed++) {
        let w = new OrbitWorld(rng(seed), tier);
        for (let hop = 0; hop < 10; hop++) {
          for (let settle = 0; settle < 120; settle++) w.step(1 / 120);
          let landed: OrbitWorld | undefined;
          for (let a = 0; a < 180 && !landed; a++) {
            const c = shot(w, (a * Math.PI) / 90);
            if (c.highest > w.highest && c.lives === 3) landed = c;
          }
          expect(landed, `seed ${seed}, hop ${hop}`).toBeDefined();
          w = landed!;
          expect(w.planets.length).toBeLessThanOrEqual(9);
          expect(Math.hypot(w.ball.vx, w.ball.vy)).toBeLessThanOrEqual(400.001);
        }
      }
    },
    30000,
  );
  it("flight previews cannot mutate live state", () => {
    const w = new OrbitWorld(rng(51), "medium");
    const before = JSON.stringify(w);
    const first = w.preview();
    expect(first).toEqual(w.preview());
    expect(JSON.stringify(w)).toBe(before);
  });
});
