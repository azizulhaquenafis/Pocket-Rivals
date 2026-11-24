import { expect, it } from "vitest";
import {
  attackDepth,
  movePlayer,
  separatePlayers,
  clearPoint,
  RADIUS,
} from "../../src/games/spike-attacks/ArenaPhysics";
import { SpikeMatch } from "../../src/games/spike-attacks/Rules";
import { needleTip } from "../../src/games/hammer-hit/NeedleGeometry";

it("a moving survivor pushes an idle equal-mass body without passing through", () => {
  const a = { x: 80, y: 120 },
    b = { x: 98, y: 120 };
  for (let i = 0; i < 120; i++) {
    movePlayer(a, 100, 0, 1 / 120, []);
    separatePlayers(a, b, []);
    expect(b.x - a.x).toBeCloseTo(18, 3);
  }
  expect(a.x).toBeCloseTo(160, 3);
  expect(b.x).toBeCloseTo(178, 3);
});
it("equal opposing drives resist, while sidestepping can break contact", () => {
  const a = { x: 80, y: 120 },
    b = { x: 98, y: 120 };
  for (let i = 0; i < 120; i++) {
    movePlayer(a, 100, 0, 1 / 120, []);
    movePlayer(b, -100, 0, 1 / 120, []);
    separatePlayers(a, b, []);
  }
  expect(a.x).toBeCloseTo(80, 4);
  expect(b.x).toBeCloseTo(98, 4);
  movePlayer(b, 0, 100, 0.1, []);
  separatePlayers(a, b, []);
  expect(b.y).toBeGreaterThan(130);
});
it("contact cannot push through arena boundaries or cover", () => {
  for (const blocks of [[], [{ x: 160, y: 80, w: 30, h: 80 }]]) {
    const wall = blocks.length ? 160 : 320;
    const b = { x: wall - RADIUS, y: 120 },
      a = { x: b.x - 18, y: 120 };
    for (let i = 0; i < 240; i++) {
      movePlayer(a, 100, 0, 1 / 120, blocks);
      separatePlayers(a, b, blocks);
      expect(clearPoint(a, 8.99, blocks)).toBe(true);
      expect(clearPoint(b, 8.99, blocks)).toBe(true);
      expect(b.x - a.x).toBeGreaterThan(17.999);
    }
  }
});
it("idle contact updates the idle target rather than adding an artificial opposing force", () => {
  const m = new SpikeMatch(2);
  // Open area on Courtyard; stop before the first physical attack.
  Object.assign(m.players[0], { x: 110, y: 210, tx: 140, ty: 210 });
  Object.assign(m.players[1], { x: 128, y: 210, tx: 128, ty: 210 });
  for (let i = 0; i < 12; i++) m.step(1 / 120);
  expect(m.players[1].x).toBeGreaterThan(128);
  expect(m.players[1].tx).toBe(m.players[1].x);
  const before = structuredClone(m.players);
  m.winner = 1;
  m.step(0.1);
  expect(m.players).toEqual(before);
});
it("the hammer indicator keeps its full sweep inside the machine and above the anvil base", () => {
  for (let i = -100; i <= 100; i++) {
    const tip = needleTip(i / 100);
    expect(tip.x - 3).toBeGreaterThan(147);
    expect(tip.x + 3).toBeLessThan(273);
    expect(tip.y + 3).toBeLessThanOrEqual(606);
  }
  expect(needleTip(-1)).toEqual({ x: 156, y: 598 });
  expect(needleTip(1)).toEqual({ x: 264, y: 598 });
  expect(needleTip(0).y).toBe(544);
});

it("a legal push can expose the other player to a piston and scores exactly once", () => {
  const m = new SpikeMatch(2);
  m.direction = 2;
  m.phase = "hold";
  for (let lane = 0; lane < 4; lane++)
    m.lengths[lane] = attackDepth(2, lane, m.map.blocks);
  Object.assign(m.players[0], { x: 190, y: 208, tx: 100, ty: 208 });
  Object.assign(m.players[1], { x: 172, y: 208, tx: 172, ty: 208 });
  m.step(0.1);
  expect(m.players[0].alive).toBe(true);
  expect(m.players[1].alive).toBe(false);
  expect(m.scores).toEqual([1, 0]);
  m.step(0.1);
  expect(m.scores).toEqual([1, 0]);
});
