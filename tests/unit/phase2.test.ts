import { describe, it, expect } from "vitest";
import { TicTacToeBoard } from "../../src/games/tic-tac-toe/classic/ClassicRules";
import { classicMove } from "../../src/games/tic-tac-toe/classic/ClassicAI";
import { UltimateBoard } from "../../src/games/tic-tac-toe/ultimate/UltimateRules";
import { ultimateMove } from "../../src/games/tic-tac-toe/ultimate/UltimateSearch";
import { HockeyWorld } from "../../src/games/air-hockey/AirHockeyPhysics";
import { validPuckPosition } from "../../src/games/air-hockey/rink";
import { PongWorld } from "../../src/games/pong/PongPhysics";
import { PongAI, reflectedX } from "../../src/games/pong/PongAI";
import { AirHockeyAI } from "../../src/games/air-hockey/AirHockeyAI";
import {
  TournamentManager,
  shuffledSchedule,
} from "../../src/core/TournamentManager";
import { StorageManager } from "../../src/core/StorageManager";
import type { MatchSpec, Player } from "../../src/shared/contracts/GameModule";
import { WIN_LINES } from "../../src/games/tic-tac-toe/shared/lines";
const dt = 1 / 120;
describe("hockey contact regression", () => {
  it.each([
    [35, 123, -1000, -1000],
    [385, 123, 1000, -1000],
    [35, 639, -1000, 1000],
    [385, 639, 1000, 1000],
  ])("resolves corner %s, %s without a wall trap", (x, y, vx, vy) => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    Object.assign(w.puck, { x, y, vx, vy });
    w.step(dt, w.mallets);
    expect(validPuckPosition(w.puck.x, w.puck.y, w.puck.r)).toBe(true);
    expect(w.puck.vx * vx).toBeLessThan(0);
    expect(w.puck.vy * vy).toBeLessThan(0);
    for (let i = 0; i < 300; i++) w.step(dt, w.mallets);
    expect(Number.isFinite(w.puck.x + w.puck.y)).toBe(true);
    expect(w.recoveries).toBe(0);
  });
  it("never nudges a playable stationary puck", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    Object.assign(w.puck, { x: 90, y: 300, vx: 0, vy: 0 });
    for (let i = 0; i < 2400; i++) w.step(dt, w.mallets);
    expect(w.puck.x).toBe(90);
    expect(w.puck.y).toBe(300);
    expect(w.recoveries).toBe(0);
  });
  it("repairs nonfinite unplayable state only after the watchdog interval", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    w.puck.x = NaN;
    for (let i = 0; i < 50; i++) w.step(dt, w.mallets);
    expect(w.recoveries).toBe(0);
    for (let i = 0; i < 60; i++) w.step(dt, w.mallets);
    expect(w.recoveries).toBe(1);
    expect(Number.isFinite(w.puck.x)).toBe(true);
    expect(w.scores).toEqual([0, 0]);
  });
  it("handles prolonged repeated high speed contacts and initial complete overlap", () => {
    const w = new HockeyWorld();
    w.cooldown = 0;
    Object.assign(w.puck, { x: 210, y: 183, vx: 1100, vy: 0 });
    for (let i = 0; i < 24000; i++) {
      if (w.done) {
        w.done = false;
        w.scores = [0, 0];
      }
      if (i % 97 === 0) {
        w.puck.vx = (i % 2 ? 1 : -1) * 1100;
        w.puck.vy = (i % 3 ? 1 : -1) * 1100;
      }
      w.step(dt, [
        {
          x: 55 + 310 * Math.abs(Math.sin(i * 0.019)),
          y: 425 + 190 * Math.abs(Math.cos(i * 0.017)),
        },
        {
          x: 55 + 310 * Math.abs(Math.cos(i * 0.02)),
          y: 145 + 190 * Math.abs(Math.sin(i * 0.02)),
        },
      ]);
      expect(Number.isFinite(w.puck.x + w.puck.y)).toBe(true);
      expect(Math.hypot(w.puck.vx, w.puck.vy)).toBeLessThanOrEqual(1100.001);
    }
    expect(w.recoveries).toBe(0);
  });
  it("ends a match exactly once after five goals", () => {
    let reports = 0;
    const w = new HockeyWorld(
      () => {},
      () => reports++,
    );
    for (let i = 0; i < 5; i++) {
      w.cooldown = 0;
      Object.assign(w.puck, { x: 210, y: 99, vx: 0, vy: -300 });
      w.step(dt, w.mallets);
    }
    expect(w.done).toBe(true);
    expect(w.scores).toEqual([5, 0]);
    for (let i = 0; i < 30; i++) w.step(dt, w.mallets);
    expect(reports).toBe(5);
  });
});
describe("physics AI plays through ordinary constrained targets", () => {
  it("reflects predicted trajectories over multiple rails", () => {
    expect(reflectedX(400, 10, 390)).toBe(380);
    expect(reflectedX(-20, 10, 390)).toBe(40);
  });
  it.each(["medium", "hard", "impossible"] as const)(
    "%s never exceeds human movement limits",
    (difficulty) => {
      const p = new PongWorld(),
        pa = new PongAI(difficulty, () => 0.5),
        h = new HockeyWorld(),
        ha = new AirHockeyAI(difficulty, () => 0.5);
      for (let i = 0; i < 1200; i++) {
        const px = p.paddles[1].x,
          hx = h.mallets[1].x,
          hy = h.mallets[1].y;
        const target = pa.update(dt, p);
        expect(Math.abs(target - px)).toBeLessThanOrEqual(1800 * dt);
        p.step(dt, [210, target]);
        const ht = ha.update(dt, h);
        expect(Math.hypot(ht.x - hx, ht.y - hy)).toBeLessThanOrEqual(1500 * dt);
        h.step(dt, [h.mallets[0], ht]);
        expect(h.mallets[1].y).toBeLessThanOrEqual(352.001);
      }
    },
  );
});
describe("Classic AI", () => {
  it.each([1, 2] as Player[])(
    "Impossible as player %i cannot lose against any legal strategy",
    (ai) => {
      let leaves = 0;
      function visit(board: TicTacToeBoard) {
        if (board.winner) {
          leaves++;
          expect(board.winner).not.toBe(ai === 1 ? 2 : 1);
          return;
        }
        const moves =
          board.turn === ai
            ? [classicMove(board, "impossible")]
            : board.cells.flatMap((c, i) => (c ? [] : [i]));
        for (const move of moves) {
          const next = TicTacToeBoard.restore(board.save());
          expect(next.play(move)).toBe(true);
          visit(next);
        }
      }
      visit(new TicTacToeBoard());
      expect(leaves).toBeGreaterThan(1);
    },
  );
  it("restores only valid move histories", () => {
    const b = new TicTacToeBoard();
    [0, 4, 1].forEach((i) => b.play(i));
    expect(TicTacToeBoard.restore(b.save()).cells).toEqual(b.cells);
    expect(
      TicTacToeBoard.restore({ version: 1, moves: [0, 0] }).history,
    ).toEqual([]);
  });
});
describe("Ultimate exact rules", () => {
  it("allows all 81 opening cells and routes by local cell", () => {
    const b = new UltimateBoard();
    expect(b.legalMoves()).toHaveLength(81);
    b.play(3 * 9 + 7);
    expect(b.forced).toBe(7);
    expect(b.legalMoves().every((i) => Math.floor(i / 9) === 7)).toBe(true);
    expect(b.play(0)).toBe(false);
  });
  it.each(WIN_LINES.map((l) => [l]))(
    "claims a mini-board on line %s",
    (line) => {
      const b = new UltimateBoard();
      for (const c of line.slice(0, 2)) b.cells[18 + c] = 1;
      expect(b.play(18 + line[2])).toBe(true);
      expect(b.boards[2]).toBe(1);
      b.forced = null;
      expect(b.play(18 + line[0])).toBe(false);
    },
  );
  it("closes a full drawn mini-board", () => {
    const b = new UltimateBoard();
    b.cells.splice(0, 9, 1, 2, 1, 1, 2, 2, 2, 1, null);
    b.play(8);
    expect(b.boards[0]).toBe("draw");
    b.forced = null;
    expect(b.legalMoves().some((i) => i < 9)).toBe(false);
  });
  it("grants free choice when sent to a won or drawn board", () => {
    for (const status of [1, "draw"] as const) {
      const b = new UltimateBoard();
      b.boards[4] = status;
      b.play(4);
      expect(b.forced).toBeNull();
      expect(b.legalMoves().some((i) => Math.floor(i / 9) === 4)).toBe(false);
      expect(b.legalMoves().some((i) => Math.floor(i / 9) === 7)).toBe(true);
    }
  });
  it.each(WIN_LINES.map((l) => [l]))(
    "wins the large board on line %s",
    (line) => {
      const b = new UltimateBoard();
      b.boards[line[0]] = 1;
      b.boards[line[1]] = 1;
      const base = line[2] * 9;
      b.cells[base] = 1;
      b.cells[base + 1] = 1;
      b.play(base + 2);
      expect(b.winner).toBe(1);
      expect(b.legalMoves()).toEqual([]);
    },
  );
  it("draws globally when no unresolved boards remain", () => {
    const b = new UltimateBoard();
    b.boards = ["draw", 1, 2, 2, 1, 1, 1, 2, null];
    b.cells.splice(72, 9, 1, 2, 1, 1, 2, 2, 2, 1, null);
    b.play(80);
    expect(b.winner).toBe("draw");
    expect(b.legalMoves()).toEqual([]);
  });
  it("restores routing, closed boards and turn by replaying legal history", () => {
    const b = new UltimateBoard();
    for (let i = 0; i < 45 && !b.winner; i++) {
      const legal = b.legalMoves();
      b.play(legal[(i * 7) % legal.length]);
    }
    const saved = b.save(),
      r = UltimateBoard.restore(saved);
    expect(r.cells).toEqual(b.cells);
    expect(r.boards).toEqual(b.boards);
    expect(r.forced).toBe(b.forced);
    expect(r.turn).toBe(b.turn);
    expect(
      UltimateBoard.restore({ version: 1, moves: [0, 9] }).history,
    ).toEqual([]);
  });
  it.each(["medium", "hard", "impossible"] as const)(
    "%s AI obeys routing through a complete game",
    (difficulty) => {
      const b = new UltimateBoard();
      for (let i = 0; i < 81 && !b.winner; i++) {
        const result = ultimateMove(b, difficulty, {
          budgetMs: 4,
          random: () => 0.5,
        });
        expect(b.legal(result.move)).toBe(true);
        b.play(result.move);
      }
      expect(b.winner).not.toBeNull();
    },
  );
  it("finds an immediate global win", () => {
    const b = new UltimateBoard();
    b.boards[0] = 2;
    b.boards[1] = 2;
    b.turn = 2;
    b.forced = 2;
    b.cells[18] = 2;
    b.cells[19] = 2;
    expect(ultimateMove(b, "impossible", { budgetMs: 30 }).move).toBe(20);
  });
});
describe("Tournament state machine", () => {
  const spec: MatchSpec = {
    gameId: "a-future-module",
    options: { mode: "ai", difficulty: "hard" },
  };
  function memory() {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
  }
  it("supports arbitrary registered-game contracts and shuffled configurable rounds", () => {
    const plan = shuffledSchedule(
      [spec, { ...spec, gameId: "another-game" }],
      7,
      () => 0.5,
    );
    expect(plan).toHaveLength(7);
    expect(new Set(plan.slice(0, 2).map((s) => s.gameId)).size).toBe(2);
    expect(() => shuffledSchedule([], 3)).toThrow();
  });
  it("scores wins and half-point draws once, then finishes with consistent totals", () => {
    const t = new TournamentManager(new StorageManager(memory()));
    t.create([spec, spec, spec]);
    const first = t.startRound()!;
    expect(t.finish("stale", { winner: 1, scores: [5, 0] })).toBe(false);
    expect(t.finish(first.token, { winner: 1, scores: [5, 0] })).toBe(true);
    expect(t.finish(first.token, { winner: 1, scores: [5, 0] })).toBe(false);
    t.finish(t.startRound()!.token, { winner: "draw", scores: [0, 0] });
    t.finish(t.startRound()!.token, { winner: 2, scores: [0, 5] });
    expect(t.state?.phase).toBe("complete");
    expect(t.state?.points).toEqual([1.5, 1.5]);
    expect(t.startRound()).toBeNull();
  });
  it("persists the round token and checkpoint across closure", () => {
    const m = memory(),
      t = new TournamentManager(new StorageManager(m));
    t.create([spec, spec]);
    const round = t.startRound()!;
    t.checkpoint(round.token, { version: 1, moves: [4] });
    const r = new TournamentManager(new StorageManager(m));
    expect(r.startRound()).toEqual({
      ...round,
      checkpoint: { version: 1, moves: [4] },
    });
    r.finish(round.token, { winner: 2, scores: [0, 5] });
    expect(new TournamentManager(new StorageManager(m)).state?.points).toEqual([
      0, 1,
    ]);
  });
  it("invalidates stale callbacks on restart and gives rematches fresh identities", () => {
    const t = new TournamentManager(new StorageManager(memory()));
    t.create([spec]);
    const old = t.startRound()!;
    t.restartRound();
    expect(t.finish(old.token, { winner: 1, scores: [5, 0] })).toBe(false);
    expect(t.checkpoint(old.token, {})).toBe(false);
    const current = t.startRound()!;
    t.finish(current.token, { winner: 1, scores: [5, 0] });
    const id = t.state!.id;
    t.rematch();
    expect(t.state!.id).not.toBe(id);
    expect(t.state!.points).toEqual([0, 0]);
    expect(t.state!.phase).toBe("between");
  });
  it("rejects corrupted state and recomputes stored points", () => {
    const m = memory();
    m.setItem(
      "pocket-rivals.tournament.v1",
      JSON.stringify({ version: 1, phase: "playing" }),
    );
    expect(new TournamentManager(new StorageManager(m)).state).toBeNull();
  });
});
