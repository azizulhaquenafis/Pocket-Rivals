import { describe, it, expect } from "vitest";
import { MatchClock } from "../../src/shared/rules/MatchClock";
import { PossessionClock } from "../../src/games/air-hockey/PossessionClock";
import { MotionController } from "../../src/shared/physics/MotionController";
import { PongAI } from "../../src/games/pong/PongAI";
import { PongWorld } from "../../src/games/pong/PongPhysics";
import { AirHockeyAI } from "../../src/games/air-hockey/AirHockeyAI";
import { HockeyWorld } from "../../src/games/air-hockey/AirHockeyPhysics";
import {
  ConnectFourBoard,
  FOUR_LINES,
} from "../../src/games/connect-four/ConnectFourRules";
import { searchConnectFour } from "../../src/games/connect-four/ConnectFourAI";
import { courses, type Course } from "../../src/games/mini-golf/courses";
import {
  newBall,
  shoot,
  golfStep,
  moving,
  simulate,
} from "../../src/games/mini-golf/GolfPhysics";
import { GolfMatch } from "../../src/games/mini-golf/GolfMatch";
import { planGolfShot } from "../../src/games/mini-golf/GolfAI";
import { SnakeWorld } from "../../src/arcade/snake/SnakeRules";
import { ShooterWorld } from "../../src/arcade/space-shooter/ShooterWorld";
import { StorageManager } from "../../src/core/StorageManager";
import { ArcadeScoreManager } from "../../src/core/ArcadeScoreManager";
import type { Difficulty } from "../../src/shared/contracts/AIController";
const difficulties: Difficulty[] = ["medium", "hard", "impossible"];
describe("Match clocks", () => {
  for (const scores of [
    [0, 0],
    [1, 0],
    [0, 4],
    [3, 2],
  ])
    it(`regulation expiry ${scores}`, () => {
      const c = new MatchClock();
      expect(c.advance(119.99, scores)).toBeNull();
      expect(c.advance(0.02, scores)).toBe(
        scores[0] === scores[1] ? "draw" : scores[0] > scores[1] ? 1 : 2,
      );
    });
  for (const tied of [1, 2, 3, 4])
    it(`tied ${tied} grants exactly one overtime`, () => {
      const c = new MatchClock();
      expect(c.advance(120, [tied, tied])).toBeNull();
      expect(c.overtime).toBe(true);
      expect(c.remaining).toBe(60);
      expect(c.advance(59, [tied, tied])).toBeNull();
      expect(c.advance(1, [tied, tied])).toBe("draw");
      expect(c.remaining).toBe(0);
    });
  it("sudden death wins immediately; 5 wins without waiting; results are idempotent", () => {
    const c = new MatchClock();
    c.advance(120, [2, 2]);
    expect(c.score([2, 3])).toBe(2);
    expect(c.advance(999, [5, 3])).toBe(2);
    const d = new MatchClock();
    expect(d.score([5, 4])).toBe(1);
  });
  it("large stalls account for both periods; future 0–0 overtime draws", () => {
    const c = new MatchClock();
    expect(c.advance(185, [2, 2])).toBe("draw");
    const d = new MatchClock();
    d.overtime = true;
    d.remaining = 60;
    expect(d.advance(60, [0, 0])).toBe("draw");
  });
  it("clock uses elapsed seconds and is independent of frame frequency", () => {
    for (const hz of [30, 60, 90, 144]) {
      const c = new MatchClock();
      for (let i = 0; i < hz * 20; i++) c.advance(1 / hz, [0, 0]);
      expect(c.remaining).toBeCloseTo(100, 6);
      const before = c.remaining;
      expect(c.remaining).toBe(before);
    }
  });
});
describe("Possession", () => {
  it("counts one half with hysteresis, resets crossing, awards once", () => {
    const p = new PossessionClock();
    p.advance(5, 500);
    p.advance(5, 380);
    expect(p.side).toBe(1);
    expect(p.elapsed).toBe(10);
    p.advance(1, 376);
    expect(p.side).toBe(2);
    expect(p.elapsed).toBe(1);
    expect(p.advance(14, 200)).toBe(1);
    expect(p.side).toBeNull();
    expect(p.advance(0.001, 200)).toBeNull();
    p.reset();
    expect(p.elapsed).toBe(0);
  });
  it("center starts neutral; penalty reaches five and resets both mallets", () => {
    const p = new PossessionClock();
    expect(p.advance(30, 381)).toBeNull();
    let calls = 0;
    const w = new HockeyWorld(
      () => {},
      () => calls++,
    );
    w.scores = [4, 0];
    w.mallets[0].x = 99;
    w.awardPoint(1);
    expect(w.done).toBe(true);
    expect(w.mallets[0].x).toBe(210);
    w.awardPoint(1);
    expect(calls).toBe(1);
  });
});
describe("Stable legal AI motion", () => {
  it("controller caps acceleration and converges without a limit cycle", () => {
    const c = new MotionController(0, 0);
    let x = 0,
      y = 0,
      vx = 0,
      vy = 0,
      maxOvershoot = 0;
    for (let i = 0; i < 1200; i++) {
      const p = c.move(1 / 120, x, y, 200, 100, 600);
      expect(Math.hypot(c.vx - vx, c.vy - vy)).toBeLessThanOrEqual(35.00001);
      expect(Math.hypot(c.vx, c.vy)).toBeLessThanOrEqual(600.01);
      x = p.x;
      y = p.y;
      vx = c.vx;
      vy = c.vy;
      maxOvershoot = Math.max(maxOvershoot, x - 200);
    }
    expect(x).toBeCloseTo(200, 0);
    expect(y).toBeCloseTo(100, 0);
    expect(maxOvershoot).toBeLessThan(0.5);
    expect(c.vx).toBe(0);
  });
  for (const difficulty of difficulties)
    it(`${difficulty} initializes quietly and tracks in both physics games`, () => {
      const p = new PongWorld(),
        ai = new PongAI(difficulty, () => 0.5);
      for (let i = 0; i < 120; i++)
        p.step(1 / 120, [210, ai.update(1 / 120, p)]);
      expect(p.paddles[1].x).toBe(210);
      p.cooldown = 0;
      p.ball = { x: 325, y: 320, vx: 0, vy: -340, r: 9 };
      for (let i = 0; i < 40; i++)
        p.step(1 / 120, [210, ai.update(1 / 120, p)]);
      expect(p.paddles[1].x).toBeGreaterThan(230);
      const h = new HockeyWorld(),
        hai = new AirHockeyAI(difficulty, () => 0.5);
      for (let i = 0; i < 120; i++)
        h.step(1 / 120, [h.mallets[0], hai.update(1 / 120, h)]);
      expect(h.mallets[1].x).toBe(210);
      expect(h.mallets[1].y).toBe(183);
      h.cooldown = 0;
      h.puck.x = 330;
      h.puck.y = 260;
      h.puck.vy = -220;
      for (let i = 0; i < 80; i++) {
        h.step(1 / 120, [h.mallets[0], hai.update(1 / 120, h)]);
        expect(h.mallets[1].y).toBeLessThanOrEqual(352);
        expect(h.mallets[1].x).toBeGreaterThanOrEqual(53);
      }
    });
});
describe("Connect Four rules and bounded search", () => {
  it("has all 69 winning windows and rejects full/illegal columns", () => {
    expect(FOUR_LINES).toHaveLength(69);
    const b = new ConnectFourBoard();
    expect(b.drop(-1)).toBe(-1);
    expect(b.drop(0.1)).toBe(-1);
    for (let i = 0; i < 6; i++) expect(b.drop(0)).toBe((5 - i) * 7);
    expect(b.drop(0)).toBe(-1);
    expect(b.history).toHaveLength(6);
  });
  for (const [name, moves] of [
    ["vertical", [0, 1, 0, 1, 0, 1, 0]],
    ["horizontal", [0, 0, 1, 1, 2, 2, 3]],
    ["diagonal", [0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 5, 3, 3]],
  ] as const)
    it(name, () => {
      const b = new ConnectFourBoard();
      moves.forEach((c) => b.drop(c));
      expect(b.winner).toBe(1);
      expect(b.line).toHaveLength(4);
      expect(ConnectFourBoard.restore(b.save()).cells).toEqual(b.cells);
      expect(b.drop(6)).toBe(-1);
    });
  it("recognizes every geometrical winning direction and a full draw", () => {
    for (const line of FOUR_LINES) {
      const b = new ConnectFourBoard();
      b.cells.fill(2);
      b.winner = null;
      b.turn = 1;
      b.history = Array(41).fill(0);
      line.forEach((i) => (b.cells[i] = 1));
      const at = Math.min(...line);
      for (let i = at; i >= 0; i -= 7) b.cells[i] = null;
      expect(b.drop(at % 7)).toBe(at);
      expect(b.winner).toBe(1);
    }
    const b = new ConnectFourBoard();
    b.cells = Array.from(
      { length: 42 },
      (_, i) =>
        (Math.floor(i / 7) % 2 === 0
          ? [1, 1, 2, 2, 1, 1, 2]
          : [2, 2, 1, 1, 2, 2, 1])[i % 7] as 1 | 2,
    );
    b.cells[0] = null;
    b.turn = 1;
    b.history = Array(41).fill(0);
    b.drop(0);
    expect(b.winner).toBe("draw");
  });
  for (const d of difficulties)
    it(`${d} chooses legally and finds immediate wins`, () => {
      const b = new ConnectFourBoard();
      [0, 1, 0, 1, 0, 2].forEach((c) => b.drop(c));
      expect(searchConnectFour(b, d, () => 0.5).column).toBe(0);
      const empty = new ConnectFourBoard(),
        before = empty.save(),
        r = searchConnectFour(empty, d, () => 0.5);
      expect(empty.legal()).toContain(r.column);
      expect(empty.save()).toEqual(before);
      expect(r.milliseconds).toBeLessThan(1000);
    });
  it("Impossible blocks a loss and restoration rejects stale illegal history", () => {
    const b = new ConnectFourBoard();
    [0, 1, 0, 1, 0].forEach((c) => b.drop(c));
    expect(searchConnectFour(b, "impossible").column).toBe(0);
    expect(
      ConnectFourBoard.restore({ version: 1, moves: [9] }).history,
    ).toEqual([]);
  });
});
describe("Mini Golf physics, turns and planning", () => {
  const empty: Course = {
    id: "test",
    name: "test",
    par: 1,
    start: { x: 170, y: 330 },
    hole: { x: 170, y: 70 },
    obstacles: [],
  };
  it("captures a correctly powered putt, counts a stroke once and never shoots a moving ball", () => {
    const b = newBall(empty);
    expect(shoot(b, -Math.PI / 2, Math.sqrt(2 * 65 * 260))).toBe(true);
    expect(shoot(b, 0, 600)).toBe(false);
    for (let i = 0; i < 1200; i++) golfStep(b, empty, 1 / 120);
    expect(b.holed).toBe(true);
    expect(moving(b)).toBe(false);
  });
  it("walls and obstacles survive high-speed impacts without tunneling", () => {
    for (const c of courses)
      for (let n = 0; n < 36; n++) {
        const b = simulate(c, newBall(c), (n * Math.PI) / 18, 600);
        expect(Number.isFinite(b.x + b.y)).toBe(true);
        expect(b.x).toBeGreaterThanOrEqual(6.99);
        expect(b.x).toBeLessThanOrEqual(333.01);
        expect(b.y).toBeGreaterThanOrEqual(6.99);
        expect(b.y).toBeLessThanOrEqual(393.01);
        expect(
          c.obstacles.some(
            (o) => b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h,
          ),
        ).toBe(false);
      }
  });
  it("both rivals play independent balls; fewer strokes wins; ties are explicit", () => {
    const m = new GolfMatch(1);
    m.takeShot(0, 100);
    expect(m.strokes).toEqual([1, 0]);
    m.ball.vx = 0;
    m.finishShot();
    expect(m.turn).toBe(2);
    expect(m.ball.x).toBe(m.course.start.x);
    m.takeShot(0, 100);
    m.ball.holed = true;
    m.ball.vx = 0;
    m.finishShot();
    expect(m.turn).toBe(1);
    m.takeShot(0, 100);
    m.ball.holed = true;
    m.ball.vx = 0;
    m.finishShot();
    expect(m.totals).toEqual([2, 1]);
    expect(m.winner).toBe(2);
    const tie = new GolfMatch(1);
    for (let i = 0; i < 2; i++) {
      tie.takeShot(0, 100);
      tie.ball.vx = 0;
      tie.ball.holed = true;
      tie.finishShot();
    }
    expect(tie.winner).toBe("draw");
  });
  it("restores a valid checkpoint and rejects malformed positions", () => {
    const m = new GolfMatch(3);
    expect(GolfMatch.restore(m.save(), 3).save()).toEqual(m.save());
    const d = m.save();
    d.balls[0].x = NaN;
    expect(GolfMatch.restore(d, 3).ball.x).toBe(courses[0].start.x);
  });
  for (const d of difficulties)
    it(`${d} simulates legal shots with a bounded budget`, () => {
      const r = planGolfShot(empty, newBall(empty), d, () => 0.5);
      expect(r.power).toBeGreaterThanOrEqual(20);
      expect(r.power).toBeLessThanOrEqual(600);
      expect(r.milliseconds).toBeLessThan(1000);
      if (d === "impossible")
        expect(simulate(empty, newBall(empty), r.angle, r.power).holed).toBe(
          true,
        );
    });
  it("Impossible can complete all five designed courses with real physics", () => {
    for (const course of courses) {
      let ball = newBall(course),
        strokes = 0;
      while (!ball.holed && strokes++ < 12) {
        const s = planGolfShot(course, ball, "impossible", () => 0.5);
        ball = simulate(course, ball, s.angle, s.power);
      }
      expect(
        ball.holed,
        `${course.name}, ${strokes} shots at ${ball.x},${ball.y}`,
      ).toBe(true);
    }
  }, 10000);
});
describe("Solo Arcade", () => {
  it("Snake food grows score/body and reversal is rejected", () => {
    const s = new SnakeWorld(() => 0.5);
    s.food = { x: 9, y: 11 };
    expect(s.steer("left")).toBe(false);
    s.tick();
    expect(s.score).toBe(10);
    expect(s.body).toHaveLength(4);
    expect(s.body.some((c) => c.x === s.food?.x && c.y === s.food?.y)).toBe(
      false,
    );
  });
  it("Snake treats a vacating tail legally, detects walls/body, and has fixed timing", () => {
    const s = new SnakeWorld();
    s.body = [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
    ];
    s.direction = "right";
    s.food = { x: 10, y: 10 };
    s.tick();
    expect(s.dead).toBe(false);
    s.direction = "left";
    s.tick();
    expect(s.dead).toBe(true);
    for (const hz of [30, 60, 144]) {
      const w = new SnakeWorld();
      w.food = { x: 0, y: 0 };
      for (let i = 0; i < hz; i++) w.update(1 / hz);
      expect(w.body[0].x).toBe(13);
    }
    const wall = new SnakeWorld();
    for (let i = 0; i < 20; i++) wall.tick();
    expect(wall.dead).toBe(true);
  });
  it("Shooter uses swept projectiles, scores kills, advances waves and bounds its pool", () => {
    const w = new ShooterWorld(() => 0.5);
    w.enemies = [{ x: 210, y: 300, hp: 1, kind: 0, alive: true }];
    const p = w.projectiles[0];
    Object.assign(p, {
      x: 210,
      y: 325,
      previousY: 325,
      vy: -490,
      enemy: false,
      active: true,
    });
    w.step(0.08, 210, false);
    expect(w.score).toBe(60);
    expect(w.transitioning).toBe(true);
    for (let i = 0; i < 150; i++) w.step(1 / 120, 210, false);
    expect(w.wave).toBe(2);
    expect(w.enemies.length).toBeGreaterThan(6);
    for (let i = 0; i < 10000; i++)
      w.step(1 / 120, 210 + Math.sin(i * 0.01) * 100, true);
    expect(w.projectiles).toHaveLength(80);
    expect(
      w.projectiles
        .filter((p) => p.active)
        .every((p) => p.y >= 116 && p.y <= 646),
    ).toBe(true);
  });
  it("Shooter respects damage immunity and ends at zero lives", () => {
    const w = new ShooterWorld();
    for (let i = 0; i < 3; i++) {
      w.invulnerable = 0;
      Object.assign(w.projectiles[0], {
        x: w.player.x,
        y: 580,
        vy: 300,
        enemy: true,
        active: true,
      });
      w.step(0.04, w.player.x, false);
    }
    expect(w.lives).toBe(0);
    expect(w.dead).toBe(true);
  });
  it("high scores persist independently of rival scores and never decrease", () => {
    const values = new Map<string, string>(),
      store = new StorageManager({
        getItem: (k) => values.get(k) ?? null,
        setItem: (k, v) => void values.set(k, v),
      }),
      scores = new ArcadeScoreManager(store);
    expect(scores.record("snake", 80)).toBe(80);
    scores.record("snake", 30);
    expect(new ArcadeScoreManager(store).best("snake")).toBe(80);
    expect(scores.best("space-shooter")).toBe(0);
    expect(store.data.rounds).toBe(0);
  });
});

describe("Physical match checkpoints", () => {
  it("restores Pong clock and rally, rejecting invalid saves", async () => {
    const { savePong, restorePong } =
      await import("../../src/games/pong/PongState");
    const w = new PongWorld(),
      c = new MatchClock();
    w.scores = [2, 2];
    c.advance(121, w.scores);
    w.ball.x = 300;
    const restored = new PongWorld(),
      clock = new MatchClock();
    expect(restorePong(restored, clock, savePong(w, c))).toBe(true);
    expect(restored.ball.x).toBe(300);
    expect(clock.remaining).toBe(59);
    expect(clock.overtime).toBe(true);
    const invalid = savePong(w, c);
    invalid.ball.x = NaN;
    expect(restorePong(restored, clock, invalid)).toBe(false);
  });
  it("restores Hockey possession independently of the match clock", async () => {
    const { saveHockey, restoreHockey } =
      await import("../../src/games/air-hockey/HockeyState");
    const w = new HockeyWorld(),
      c = new MatchClock(),
      p = new PossessionClock();
    c.advance(20, w.scores);
    p.advance(12, 500);
    const w2 = new HockeyWorld(),
      c2 = new MatchClock(),
      p2 = new PossessionClock();
    expect(restoreHockey(w2, c2, p2, saveHockey(w, c, p))).toBe(true);
    expect(c2.remaining).toBe(100);
    expect(p2.advance(3, 500)).toBe(2);
  });
  it("keeps records in memory when localStorage is blocked", () => {
    const storage = new StorageManager(undefined),
      score = new ArcadeScoreManager(storage);
    score.record("snake", 70);
    expect(score.best("snake")).toBe(70);
    expect(storage.persistent).toBe(false);
  });
});
