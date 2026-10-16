import { it, expect } from "vitest";
import { SpikeMatch } from "../../src/games/spike-attacks/Rules";
import { SpikeAI, coverRoute } from "../../src/games/spike-attacks/AI";
import {
  attackDepth,
  BLOCKS,
  clearPoint,
  movePlayer,
  pistonHits,
  safeFrom,
  SPEED,
  type Side,
} from "../../src/games/spike-attacks/ArenaPhysics";
import { MAPS, selectMap } from "../../src/games/spike-attacks/Maps";
import { SpikeView } from "../../src/games/spike-attacks/SpikeView";
it("pistons stop at the first real block and cannot strike through cover", () => {
  expect(attackDepth(2, 0)).toBe(0);
  expect(attackDepth(2, 2)).toBe(80);
  expect(attackDepth(2, 1)).toBe(320);
  expect(pistonHits({ x: 200, y: 60 }, 2, 2, 80)).toBe(true);
  expect(pistonHits({ x: 200, y: 180 }, 2, 2, 80)).toBe(false);
  expect(safeFrom({ x: 200, y: 180 }, 2)).toBe(true);
  expect(pistonHits({ x: 80, y: 200 }, 2, 0, 320)).toBe(true);
  expect(pistonHits({ x: 40, y: 200 }, 2, 0, 320)).toBe(true);
});
it("movement is speed limited, slides against blocks and never tunnels", () => {
  const p = { x: 140, y: 110 };
  movePlayer(p, 100, 0, 1);
  expect(p.x).toBe(151);
  const start = { ...p };
  movePlayer(p, 20, 80, 1 / 120);
  expect(Math.hypot(p.x - start.x, p.y - start.y)).toBeLessThanOrEqual(
    SPEED / 120 + 0.001,
  );
  expect(p.y).toBeGreaterThan(start.y);
  for (let i = 0; i < 1000; i++)
    movePlayer(p, Math.sin(i * 0.2) * 100, Math.cos(i * 0.3) * 100, 1 / 30);
  expect(clearPoint(p, 8.99)).toBe(true);
});
it("real shared attacks score once, replay simultaneous deaths and return to their socket", () => {
  const m = new SpikeMatch(4);
  m.direction = 2;
  m.players[0] = { x: 120, y: 210, tx: 120, ty: 210, alive: true };
  m.players[1] = { x: 200, y: 180, tx: 200, ty: 180, alive: true };
  for (let i = 0; i < 500 && !m.between; i++) m.step(1 / 120);
  expect(m.scores).toEqual([0, 1]);
  const scores = [...m.scores];
  m.step(0.1);
  expect(m.scores).toEqual(scores);
  const t = new SpikeMatch(4);
  t.direction = 2;
  t.players.forEach((p) =>
    Object.assign(p, { x: 120, y: 210, tx: 120, ty: 210 }),
  );
  for (let i = 0; i < 500 && !t.between; i++) t.step(1 / 120);
  expect(t.scores).toEqual([0, 0]);
  expect(t.between).toBeGreaterThan(0);
  const idle = new SpikeMatch(3);
  idle.players.forEach((p) =>
    Object.assign(p, { x: 200, y: 180, tx: 200, ty: 180 }),
  );
  idle.direction = 2;
  for (let i = 0; i < 600 && idle.wave === 1; i++) idle.step(1 / 120);
  expect(idle.wave).toBe(2);
  expect(idle.lengths).toEqual([0, 0, 0, 0]);
  expect(idle.direction).not.toBe(2);
});
it("warning and strike speed ramp up, with at least one reachable safe option per edge", () => {
  const m = new SpikeMatch(2),
    early = m.warningDuration(),
    speed = m.extensionSpeed();
  m.wave = 30;
  expect(m.warningDuration()).toBeLessThan(early);
  expect(m.warningDuration()).toBeGreaterThanOrEqual(1.05);
  expect(m.extensionSpeed()).toBeGreaterThan(speed);
  for (const side of [0, 1, 2, 3] as Side[]) {
    let reached = false;
    for (let y = 20; y <= 300; y += 20)
      for (let x = 20; x <= 300; x += 20)
        if (
          safeFrom({ x, y }, side) &&
          coverRoute(m.players[0], { x, y }).length
        )
          reached = true;
    expect(reached).toBe(true);
  }
});
it("100 seeded matches across all maps keep both AI players inside legal geometry", () => {
  let deaths = 0;
  for (let seed = 0; seed < 100; seed++) {
    const m = new SpikeMatch(seed, MAPS[seed % 3].id),
      a = new SpikeAI("impossible", seed),
      b = new SpikeAI("medium", seed + 1);
    for (let i = 0; i < 120 * 40 && !m.winner; i++) {
      a.update(1 / 120, m, 0);
      b.update(1 / 120, m, 1);
      const alive = m.players.map((p) => p.alive);
      m.advanceClock(1 / 120);
      m.step(1 / 120);
      for (const j of [0, 1] as const) {
        if (alive[j] && !m.players[j].alive) deaths++;
        if (!clearPoint(m.players[j], 8.99, m.map.blocks))
          throw Error(`Invalid ${seed}/${m.map.id}`);
      }
    }
    expect(m.wave).toBeGreaterThan(1);
  }
  expect(deaths).toBeGreaterThan(0);
});
it("all three maps have reachable cover on every edge and no permanent safe camping spot", () => {
  expect(new Set(MAPS.map((m) => JSON.stringify(m.blocks))).size).toBe(3);
  const selected = new Set<string>();
  for (let seed = 0; seed < 100; seed++)
    selected.add(selectMap("random", seed).id);
  expect(selected.size).toBe(3);
  expect(selectMap("random", 72)).toEqual(selectMap("random", 72));
  for (const map of MAPS) {
    const m = new SpikeMatch(22, map.id);
    expect(m.map.id).toBe(map.id);
    for (const spawn of map.spawns)
      expect(clearPoint(spawn, 9.5, map.blocks)).toBe(true);
    const covered = [false, false, false, false];
    for (let y = 12; y <= 308; y += 4)
      for (let x = 12; x <= 308; x += 4) {
        const p = { x, y };
        if (!clearPoint(p, 9.5, map.blocks)) continue;
        const safe = ([0, 1, 2, 3] as Side[]).map((side) =>
          safeFrom(p, side, 0.5, map.blocks),
        );
        expect(safe.every(Boolean), `camp at ${map.id}:${x},${y}`).toBe(false);
        safe.forEach((yes, side) => {
          if (yes && coverRoute(m.players[0], p, map.blocks).length)
            covered[side] = true;
        });
      }
    expect(covered).toEqual([true, true, true, true]);
  }
});
it("an exposed AI dies exactly like a human, even when its reaction cannot save it", () => {
  for (const difficulty of ["medium", "hard", "impossible"] as const) {
    const m = new SpikeMatch(1),
      ai = new SpikeAI(difficulty, 1);
    m.direction = 2;
    m.phase = "extend";
    m.phaseAge = 0.4;
    Object.assign(m.players[0], { x: 200, y: 180, tx: 200, ty: 180 });
    Object.assign(m.players[1], { x: 120, y: 210, tx: 120, ty: 210 });
    ai.update(1 / 120, m);
    m.step(1 / 120);
    expect(m.players[1].alive).toBe(false);
    expect(m.scores).toEqual([1, 0]);
    const before = m.scores.slice();
    ai.update(1, m);
    m.step(0.1);
    expect(m.scores).toEqual(before);
  }
});
it("foreground deadline, completion guards and interpolation preserve legal state", () => {
  const m = new SpikeMatch(1),
    v = new SpikeView();
  v.reset(m);
  v.capture(m);
  m.target(0, 120, 200);
  m.step(1 / 120);
  const physical = JSON.stringify(m);
  v.sample(m, 0.5, 1 / 60);
  expect(JSON.stringify(m)).toBe(physical);
  m.scores = [1, 0];
  m.advanceClock(120);
  expect(m.winner).toBe(1);
  const p = { ...m.players[0] };
  m.target(0, 0, 0);
  m.step(0.1);
  expect(m.players[0]).toEqual(p);
  const tie = new SpikeMatch(2);
  tie.advanceClock(120);
  expect(tie.winner).toBe("draw");
});

it("difficulty has distinct seeded reaction timing and terminal AI never acts", () => {
  const means: number[] = [];
  for (const difficulty of ["medium", "hard", "impossible"] as const) {
    const delays: number[] = [];
    for (let seed = 0; seed < 100; seed++) {
      const m = new SpikeMatch(seed),
        a = new SpikeAI(difficulty, seed);
      m.direction = 0;
      let elapsed = 0;
      while (
        elapsed < 1 &&
        m.players[1].tx === 212 &&
        m.players[1].ty === 208
      ) {
        a.update(0.01, m);
        elapsed += 0.01;
      }
      expect(elapsed).toBeLessThan(1);
      delays.push(elapsed);
      m.winner = 1;
      const before = JSON.stringify(m.players);
      a.update(10, m);
      expect(JSON.stringify(m.players)).toBe(before);
    }
    expect(new Set(delays.map((n) => n.toFixed(2))).size).toBeGreaterThan(5);
    means.push(delays.reduce((a, b) => a + b, 0) / delays.length);
  }
  expect(means[0]).toBeGreaterThan(means[1] + 0.15);
  expect(means[1]).toBeGreaterThan(means[2] + 0.06);
});
