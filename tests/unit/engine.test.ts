import { describe, it, expect } from "vitest";
import { PongWorld } from "../../src/games/pong/PongPhysics";
import { HockeyWorld } from "../../src/games/air-hockey/AirHockeyPhysics";
import {
  TicTacToeBoard,
  WIN_LINES,
} from "../../src/games/tic-tac-toe/classic/ClassicRules";
import { FixedStep } from "../../src/shared/physics/FixedStep";
import { StorageManager } from "../../src/core/StorageManager";
import { ScoreManager } from "../../src/core/ScoreManager";
const dt = 1 / 120;
describe("Pong", () => {
  it("sweeps a fast ball against a paddle", () => {
    const w = new PongWorld();
    w.cooldown = 0;
    w.ball = { x: 210, y: 580, vx: 0, vy: 820, r: 9 };
    for (let i = 0; i < 4; i++) w.step(dt, [210, 210]);
    expect(w.ball.vy).toBeLessThan(0);
    expect(w.hits).toBe(1);
  });
  it("steers off-center contacts and transfers paddle motion", () => {
    const w = new PongWorld();
    w.cooldown = 0;
    w.ball = { x: 239, y: 591, vx: 0, vy: 500, r: 9 };
    w.step(dt, [215, 210]);
    expect(w.ball.vx).toBeGreaterThan(200);
    expect(w.ball.vy).toBeLessThan(0);
  });
  it("scores once, serves automatically and finishes at five", () => {
    let calls = 0;
    const w = new PongWorld(
      () => {},
      () => calls++,
    );
    for (let n = 0; n < 5; n++) {
      w.cooldown = 0;
      w.ball.y = 90;
      w.step(dt, [210, 210]);
    }
    expect(w.scores).toEqual([5, 0]);
    expect(calls).toBe(5);
    expect(w.done).toBe(true);
    for (let i = 0; i < 100; i++) w.step(dt, [210, 210]);
    expect(calls).toBe(5);
  });
  it.each([30, 60, 90, 144])(
    "gives the same 3s simulation at %i FPS",
    (fps) => {
      const simulate = (hz: number) => {
        const w = new PongWorld();
        const fixed = new FixedStep();
        for (let i = 0; i < hz * 3; i++)
          fixed.advance(1 / hz, (dt) => w.step(dt, [150, 270]));
        return w;
      };
      const a = simulate(fps),
        b = simulate(120);
      expect(a.ball.x).toBeCloseTo(b.ball.x, 6);
      expect(a.ball.y).toBeCloseTo(b.ball.y, 6);
      expect(a.scores).toEqual(b.scores);
    },
  );
});
describe("Air hockey", () => {
  it("releases a puck pinned between a mallet and a rail", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    Object.assign(w.mallets[0], { x: 53, y: 500 });
    Object.assign(w.puck, { x: 35, y: 500, vx: -600, vy: 0 });
    w.step(dt, w.mallets);
    expect(
      Math.hypot(w.puck.x - w.mallets[0].x, w.puck.y - w.mallets[0].y),
    ).toBeGreaterThanOrEqual(39.9);
    expect(w.puck.x).toBeGreaterThanOrEqual(35);
    expect(Math.hypot(w.puck.vx, w.puck.vy)).toBeGreaterThan(0);
  });

  it("reflects a high-speed puck from a stationary mallet", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    w.puck.x = 210;
    w.puck.y = 524;
    w.puck.vy = 1100;
    w.puck.vx = 0;
    for (let i = 0; i < 4; i++) w.step(dt, w.mallets);
    expect(w.puck.vy).toBeLessThan(0);
    expect(w.scores).toEqual([0, 0]);
  });
  it("transfers mallet velocity and caps resulting puck speed", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    w.puck.x = 210;
    w.puck.y = 525;
    w.puck.vx = 0;
    w.puck.vy = 0;
    for (let i = 0; i < 6; i++) w.step(dt, [{ x: 210, y: 470 }, w.mallets[1]]);
    expect(w.puck.vy).toBeLessThan(-100);
    expect(Math.hypot(w.puck.vx, w.puck.vy)).toBeLessThanOrEqual(1100.01);
  });
  it("requires the entire puck to enter the goal", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    w.puck.x = 210;
    w.puck.y = 105;
    w.puck.vy = -100;
    w.puck.vx = 0;
    w.step(dt, w.mallets);
    expect(w.scores).toEqual([0, 0]);
    for (let i = 0; i < 8; i++) w.step(dt, w.mallets);
    expect(w.scores).toEqual([1, 0]);
  });
  it("bounces off closed goal-line sections", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    w.puck.x = 90;
    w.puck.y = 124;
    w.puck.vy = -1100;
    w.step(dt, w.mallets);
    expect(w.puck.vy).toBeGreaterThan(0);
    expect(w.puck.y).toBeGreaterThanOrEqual(123);
    expect(w.scores).toEqual([0, 0]);
  });
  it("constrains each mallet to its own half", () => {
    const w = new HockeyWorld();
    for (let i = 0; i < 120; i++)
      w.step(dt, [
        { x: -100, y: 0 },
        { x: 800, y: 900 },
      ]);
    expect(w.mallets[0].y).toBeGreaterThanOrEqual(410);
    expect(w.mallets[1].y).toBeLessThanOrEqual(352);
    expect(w.mallets[0].x).toBeGreaterThanOrEqual(53);
    expect(w.mallets[1].x).toBeLessThanOrEqual(367);
  });
  it.each([30, 60, 144])("is deterministic at %i rendering FPS", (fps) => {
    const sim = (hz: number) => {
      const w = new HockeyWorld(),
        clock = new FixedStep();
      for (let i = 0; i < hz * 6; i++)
        clock.advance(1 / hz, (dt) => w.step(dt, w.mallets));
      return w;
    };
    const a = sim(fps),
      b = sim(120);
    expect(a.puck.x).toBeCloseTo(b.puck.x, 6);
    expect(a.puck.y).toBeCloseTo(b.puck.y, 6);
    expect(a.scores).toEqual(b.scores);
  });
  it("survives 60k steps of fast adversarial input without nonfinite state", () => {
    const w = new HockeyWorld();
    for (let i = 0; i < 60000; i++) {
      if (w.done) {
        w.done = false;
        w.scores = [0, 0];
      }
      w.step(dt, [
        { x: 210 + 180 * Math.sin(i * 0.2), y: 530 + 140 * Math.sin(i * 0.1) },
        {
          x: 210 + 180 * Math.cos(i * 0.19),
          y: 230 + 140 * Math.cos(i * 0.07),
        },
      ]);
      expect(Number.isFinite(w.puck.x + w.puck.y + w.puck.vx + w.puck.vy)).toBe(
        true,
      );
      expect(w.puck.x).toBeGreaterThanOrEqual(34.99);
      expect(w.puck.x).toBeLessThanOrEqual(385.01);
      expect(Math.hypot(w.puck.vx, w.puck.vy)).toBeLessThanOrEqual(1100.01);
    }
  });
});
describe("Tic-tac-toe", () => {
  it.each(WIN_LINES.map((x) => [x]))("detects a win on %s", (line) => {
    const w = new TicTacToeBoard();
    line.slice(0, 2).forEach((i) => (w.cells[i] = 1));
    expect(w.play(line[2])).toBe(true);
    expect(w.winner).toBe(1);
    expect(w.line).toEqual(line);
    expect(w.play(8)).toBe(false);
  });
  it("rejects occupied cells without consuming a turn", () => {
    const w = new TicTacToeBoard();
    w.play(4);
    expect(w.turn).toBe(2);
    expect(w.play(4)).toBe(false);
    expect(w.turn).toBe(2);
  });
  it("detects a draw", () => {
    const w = new TicTacToeBoard();
    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach((i) => w.play(i));
    expect(w.winner).toBe("draw");
  });
  it("checks every possible reachable game tree", () => {
    let terminals = 0;
    const walk = (w: TicTacToeBoard) => {
      if (w.winner) {
        terminals++;
        expect(
          w.cells.filter((x) => x === 1).length -
            w.cells.filter((x) => x === 2).length,
        ).toBeGreaterThanOrEqual(0);
        return;
      }
      w.cells.forEach((c, i) => {
        if (c) return;
        const next = new TicTacToeBoard();
        next.cells = [...w.cells];
        next.turn = w.turn;
        expect(next.play(i)).toBe(true);
        walk(next);
      });
    };
    walk(new TicTacToeBoard());
    expect(terminals).toBe(255168);
  });
});
describe("Persistence and lifecycle", () => {
  it("stores wins once per round, includes draws, and survives reload", () => {
    let value: string | null = null;
    const memory = {
      getItem: () => value,
      setItem: (_k: string, v: string) => (value = v),
    };
    const store = new StorageManager(memory),
      scores = new ScoreManager(store);
    scores.beginRound();
    scores.record(1);
    scores.record(2);
    scores.beginRound();
    scores.record("draw");
    expect(new StorageManager(memory).data).toMatchObject({
      wins: [1, 0],
      rounds: 2,
      draws: 1,
    });
    store.resetScores();
    expect(store.data.wins).toEqual([0, 0]);
  });
  it("handles corrupted or blocked localStorage", () => {
    expect(
      new StorageManager({ getItem: () => "{", setItem: () => {} }).data.wins,
    ).toEqual([0, 0]);
    const s = new StorageManager({
      getItem: () => null,
      setItem: () => {
        throw Error("blocked");
      },
    });
    expect(() => s.save()).not.toThrow();
    expect(s.persistent).toBe(false);
  });
  it("sanitizes invalid values", () => {
    const s = new StorageManager({
      getItem: () =>
        JSON.stringify({ version: 1, wins: [-1, "9"], rounds: null }),
      setItem: () => {},
    });
    expect(s.data.wins).toEqual([0, 0]);
    expect(s.data.sound).toBe(true);
  });
  it("bounds catch-up after interruptions and discards paused time", () => {
    const clock = new FixedStep();
    let ticks = 0;
    clock.advance(20, () => ticks++);
    expect(ticks).toBe(12);
    clock.reset();
    clock.advance(0, () => ticks++);
    expect(ticks).toBe(12);
  });
});
