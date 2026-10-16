import { it, expect } from "vitest";
import { GravityMatch } from "../../src/games/gravity-runner/Rules";
import { GravityAI } from "../../src/games/gravity-runner/AI";
import { MAPS } from "../../src/games/gravity-runner/Maps";
import {
  advanceRunner,
  type Runner,
  type Obstacle,
} from "../../src/games/gravity-runner/RunnerPhysics";
const runner = (y = 160, gravity: -1 | 1 = 1): Runner => ({
  y,
  gravity,
  vy: 0,
  alive: true,
  cooldown: 0,
});
it("simultaneous falls replay; legal survival points finish at five", () => {
  const m = new GravityMatch(1);
  m.players.forEach((p) => (p.y = 193));
  m.gaps = [{ x: 0, width: 1000, side: 1 }];
  m.step(1 / 120);
  expect(m.scores).toEqual([0, 0]);
  expect(m.between).toBeGreaterThan(0);
  for (let i = 0; i < 5; i++) {
    m.step(1.2);
    m.players[0].y = 193;
    m.gaps = [{ x: 0, width: 1000, side: 1 }];
    m.players[1].y = 10;
    m.players[1].gravity = -1;
    m.step(1 / 120);
  }
  expect(m.winner).toBe(2);
  expect(m.flip(1)).toBe(false);
});
it("100 seeded opponents at every difficulty beat idle players using legal flips", () => {
  for (const d of ["medium", "hard", "impossible"] as const)
    for (let seed = 0; seed < 100; seed++) {
      const m = new GravityMatch(seed),
        a = new GravityAI(d, seed);
      for (let i = 0; i < 36000 && !m.winner; i++) {
        if (a.update(m)) expect(m.flip(1)).toBe(true);
        m.step(1 / 120);
      }
      expect(m.winner, `${d} seed ${seed}`).toBe(2);
      expect(m.scores[1]).toBe(5);
    }
});
it("100 seeds per difficulty traverse two minutes of increasingly fast shared hazards", () => {
  for (const d of ["medium", "hard", "impossible"] as const)
    for (let seed = 0; seed < 100; seed++) {
      const m = new GravityMatch(seed),
        a = new GravityAI(d, seed);
      let flips = 0,
        railLandings = 0;
      for (let i = 0; i < 14400; i++) {
        if (a.update(m)) {
          expect(m.flip(1)).toBe(true);
          m.flip(0);
          flips++;
        }
        m.step(1 / 120);
        const p = m.players[1];
        if (p.vy === 0 && p.y > 20 && p.y < 150) railLandings++;
        if (m.between) break;
      }
      expect(m.round, `${d} seed ${seed}`).toBe(1);
      expect(m.players[1].alive, `${d} seed ${seed}`).toBe(true);
      expect(m.age).toBeGreaterThan(119);
      expect(railLandings).toBeGreaterThan(100);
      expect(flips).toBeGreaterThan(15);
      expect(m.winner).toBeNull();
    }
}, 120000);
it("four maps select reproducibly, random seeds cover all themes, and explicit maps work", () => {
  const chosen = new Set<string>();
  for (let seed = 0; seed < 100; seed++) {
    const a = new GravityMatch(seed),
      b = new GravityMatch(seed);
    expect(a.map).toEqual(b.map);
    expect(a.obstacles).toEqual(b.obstacles);
    chosen.add(a.map.id);
  }
  expect(chosen.size).toBe(4);
  for (const map of MAPS)
    expect(new GravityMatch(7, map.id).map.id).toBe(map.id);
});
it("double wall gaps always have a continuous rail and ample entry/exit clearance", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = new GravityMatch(seed);
    for (const o of m.obstacles.filter((o) => o.kind === "platform")) {
      const gaps = m.gaps.filter(
        (g) => g.x > o.x && g.x + g.width < o.x + o.width,
      );
      if (!gaps.length) continue; // Pinches and islands use rails with intact walls.
      expect(gaps).toHaveLength(2);
      expect(gaps.map((g) => g.side).sort()).toEqual([-1, 1]);
      expect(gaps[0].x - o.x).toBeGreaterThanOrEqual(180);
      expect(o.x + o.width - gaps[0].x - gaps[0].width).toBeGreaterThanOrEqual(
        179.999,
      );
      expect(gaps[0].x).toBe(gaps[1].x);
      expect(gaps[0].width).toBe(gaps[1].width);
    }
  }
});
it("middle platform lands on both faces without jitter; front penetration remains lethal", () => {
  const rail: Obstacle = {
    x: 0,
    width: 600,
    side: 0,
    depth: 24,
    kind: "platform",
  };
  for (const side of [-1, 1] as const) {
    const p = runner(side === 1 ? 160 : 10, side === 1 ? -1 : 1);
    for (let i = 0; i < 120; i++) advanceRunner(p, 50 + i, 1 / 120, [], [rail]);
    expect(p.alive).toBe(true);
    expect(p.y).toBe(side === 1 ? 106 : 64);
    expect(p.vy).toBe(0);
    const before = p.y;
    for (let i = 0; i < 120; i++)
      advanceRunner(p, 200 + i, 1 / 120, [], [rail]);
    expect(p.y).toBe(before);
  }
  const inside = runner(85);
  advanceRunner(inside, 1, 1 / 120, [], [rail]);
  expect(inside.alive).toBe(false);
});
it("spikes, ledges and beams stay lethal at their visible bounds", () => {
  for (const kind of ["ledge", "spikes", "beam"] as const)
    for (const side of (kind === "beam" ? [0] : [-1, 1]) as (-1 | 0 | 1)[]) {
      const p = runner(
        side === 0 ? 85 : side === 1 ? 160 : 10,
        side === -1 ? -1 : 1,
      );
      advanceRunner(
        p,
        50,
        1 / 120,
        [],
        [{ x: 0, width: 100, side, depth: 36, kind }],
      );
      expect(p.alive).toBe(false);
    }
});
it("no time limit or forced replay; speed rises smoothly and geometry stays bounded", () => {
  const m = new GravityMatch(17),
    a = new GravityAI("impossible", 17);
  let previous = m.speed(),
    maxObjects = 0;
  for (let i = 0; i < 120 * 360; i++) {
    if (a.update(m)) {
      m.flip(1);
      m.flip(0);
    }
    m.step(1 / 120);
    expect(m.speed()).toBeGreaterThanOrEqual(previous);
    previous = m.speed();
    maxObjects = Math.max(maxObjects, m.gaps.length + m.obstacles.length);
    if (m.between) break;
  }
  expect(m.age).toBeGreaterThan(359);
  expect(m.winner).toBeNull();
  expect(m.round).toBe(1);
  expect(m.distance).toBeGreaterThan(75000);
  expect(m.speed()).toBe(264);
  expect(maxObjects).toBeLessThan(30);
});
it("reaction/search budgets differ by difficulty while every accepted action remains legal", () => {
  const actions: Record<string, number[]> = {};
  for (const d of ["medium", "hard", "impossible"] as const) {
    const m = new GravityMatch(42),
      a = new GravityAI(d, 42),
      times: number[] = [];
    for (let i = 0; i < 120 * 120; i++) {
      if (a.update(m)) {
        expect(m.flip(1)).toBe(true);
        m.flip(0);
        times.push(Math.round(m.age * 120));
      }
      m.step(1 / 120);
    }
    actions[d] = times;
    expect(times.length).toBeGreaterThan(8);
  }
  expect(actions.medium).not.toEqual(actions.hard);
  expect(actions.hard).not.toEqual(actions.impossible);
});

it("a returning wall cannot teleport a fallen runner back into the corridor", () => {
  for (const side of [-1, 1] as const) {
    const p = runner(side === 1 ? 175 : -5, side);
    advanceRunner(p, 200, 1 / 120, [], []);
    expect(p.alive).toBe(false);
    expect(side === 1 ? p.y > 160 : p.y < 10).toBe(true);
  }
});
