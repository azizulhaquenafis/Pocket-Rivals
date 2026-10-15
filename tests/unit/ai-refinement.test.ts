import { afterAll, describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { MatchRandom } from "../../src/shared/ai/MatchRandom";
import { ClassicAI } from "../../src/games/tic-tac-toe/classic/ClassicAI";
import { TicTacToeBoard } from "../../src/games/tic-tac-toe/classic/ClassicRules";
import { LightAI } from "../../src/games/light-fingers/AI";
import { LightMatch } from "../../src/games/light-fingers/Rules";
import { FruitAI } from "../../src/games/fruit-duel/AI";
import { FruitMatch } from "../../src/games/fruit-duel/Rules";
import { HammerAI } from "../../src/games/hammer-hit/AI";
import { HammerMatch } from "../../src/games/hammer-hit/Rules";
import { LumberAI } from "../../src/games/lumberjack/AI";
import { LumberMatch } from "../../src/games/lumberjack/Rules";
import { PongAI } from "../../src/games/pong/PongAI";
import { PongWorld } from "../../src/games/pong/PongPhysics";
import { AirHockeyAI } from "../../src/games/air-hockey/AirHockeyAI";
import { HockeyWorld } from "../../src/games/air-hockey/AirHockeyPhysics";
import { ConnectFourBoard } from "../../src/games/connect-four/ConnectFourRules";
import { searchConnectFour } from "../../src/games/connect-four/ConnectFourAI";
import { DotsBoard } from "../../src/games/dots-and-boxes/Rules";
import { chooseEdge } from "../../src/games/dots-and-boxes/AI";
import { UltimateBoard } from "../../src/games/tic-tac-toe/ultimate/UltimateRules";
import { ultimateMove } from "../../src/games/tic-tac-toe/ultimate/UltimateSearch";
import { GolfPhysics } from "../../src/games/mini-golf/ultimate/GolfPhysics";
import { courses } from "../../src/games/mini-golf/ultimate/courses";
import { planShot } from "../../src/games/mini-golf/ultimate/ai/ShotPlanner";
const levels = ["medium", "hard", "impossible"] as const;
const records: Record<string, unknown>[] = [];
afterAll(() => {
  if (process.env.AI_AUDIT)
    writeFileSync(
      "docs/ai-audit.json",
      JSON.stringify(
        {
          description:
            "Seeded AI simulations; durations are simulated seconds, CPU is host wall time. No device benchmark.",
          records,
        },
        null,
        2,
      ),
    );
});
it("24 reproducible match identities and isolated random streams", () => {
  const profiles = new Set<number>();
  for (let seed = 0; seed < 200; seed++) {
    const a = new MatchRandom(seed),
      b = new MatchRandom(seed);
    profiles.add(a.profile);
    expect(Array.from({ length: 12 }, a.next)).toEqual(
      Array.from({ length: 12 }, b.next),
    );
  }
  expect(profiles.size).toBe(24);
});
for (const difficulty of levels)
  describe(difficulty, () => {
    it("100 Classic matches have legal varied openings and optimal Impossible outcomes", () => {
      const openings = new Set<number>();
      for (let seed = 0; seed < 100; seed++) {
        const start = performance.now(),
          b = new TicTacToeBoard(),
          ai = new ClassicAI(difficulty, seed),
          rng = new MatchRandom(seed + 400),
          actions: number[] = [];
        while (!b.winner) {
          const legal = b.cells.flatMap((v, i) => (v ? [] : [i]));
          const move =
            b.turn === 1
              ? ai.choose(b)
              : legal[Math.floor(rng.next() * legal.length)];
          expect(b.play(move)).toBe(true);
          actions.push(move);
        }
        openings.add(actions[0]);
        if (difficulty === "impossible") expect(b.winner).not.toBe(2);
        records.push({
          game: "classic",
          seed,
          difficulty,
          profile: ai.snapshot().profile,
          opening: actions[0],
          actions,
          score: b.winner,
          duration: actions.length * ai.delay,
          cpu: performance.now() - start,
        });
      }
      expect(openings.size).toBeGreaterThan(1);
    });
    it("100 reflex and survival matches vary timing without illegal actions", () => {
      const reactions = new Set<string>(),
        scores = new Set<string>();
      for (let seed = 0; seed < 100; seed++) {
        const rng = new MatchRandom(seed + 999),
          start = performance.now(),
          light = new LightMatch(rng.next),
          lightAI = new LightAI(difficulty, seed),
          fruit = new FruitMatch(rng.next),
          fruitAI = new FruitAI(difficulty, seed),
          hammer = new HammerMatch(),
          hammerAI = new HammerAI(difficulty, seed),
          lumber = new LumberMatch(seed),
          lumberAI = new LumberAI(difficulty, seed);
        const finished: Record<string, number> = {};
        const acts = {
          light: [] as number[],
          fruit: [] as number[],
          hammer: [] as number[],
          lumber: [] as number[],
        };
        let seconds = 0,
          ls = -1,
          fv = -1;
        let lightDelay = 0.4,
          fruitDelay = 0.35;
        for (
          let frame = 0;
          frame < 24000 &&
          (!light.winner || !fruit.winner || !hammer.done || !lumber.winner);
          frame++
        ) {
          const dt = 1 / 120;
          seconds += dt;
          if (!light.winner) {
            light.update(dt);
            light.presentSignal();
            if (ls !== light.serial) {
              ls = light.serial;
              lightDelay = rng.sample(0.4, 0.16, 0.15);
            }
            lightAI.update(light);
            if (
              light.phase === "active" &&
              light.time - light.signalAt >= lightDelay
            )
              light.tap(0);
            if (acts.light.length === ls)
              acts.light.push(lightAI.snapshot().reaction);
          }
          if (!fruit.winner) {
            fruit.update(dt);
            fruit.present();
            if (fv !== fruit.version) {
              fv = fruit.version;
              fruitDelay = rng.sample(0.35, 0.13, 0.15);
            }
            fruitAI.update(fruit);
            if (acts.fruit.length <= fruit.version)
              acts.fruit.push(fruitAI.snapshot().reaction);
            if (
              fruit.phase === "active" &&
              fruit.current === fruit.target &&
              fruit.time - fruit.visibleAt >= fruitDelay
            )
              fruit.tap(0);
          }
          if (!hammer.done) {
            hammer.update(dt);
            if (hammerAI.update(hammer)) {
              acts.hammer.push(seconds);
              expect(hammer.hit(1)).not.toBeNull();
            }
            if (
              hammer.cooldowns[0] === 0 &&
              Math.abs(hammer.position(0)) < 0.18
            )
              hammer.hit(0);
          }
          if (!lumber.winner) {
            lumber.update(dt);
            const side = lumberAI.update(dt, lumber);
            if (side) {
              if (difficulty === "impossible")
                expect(lumber.safe(1, side)).toBe(true);
              lumber.chop(1, side);
              acts.lumber.push(side);
            }
            if (lumber.phase === "playing" && lumber.players[0].idle > 0.3)
              lumber.chop(0, lumber.safe(0, -1) ? -1 : 1);
          }
          if (light.winner) finished["light-fingers"] ??= seconds;
          if (fruit.winner) finished["fruit-duel"] ??= seconds;
          if (hammer.done) finished["hammer-hit"] ??= seconds;
          if (lumber.winner) finished["lumberjack"] ??= seconds;
        }
        expect(light.winner).not.toBeNull();
        expect(fruit.winner).not.toBeNull();
        expect(hammer.done).toBe(true);
        expect(lumber.winner).not.toBeNull();
        reactions.add(acts.light.slice(0, 3).join(","));
        scores.add(hammer.scores[1].join(","));
        const before = [
          ...light.scores,
          ...fruit.scores,
          ...hammer.totals,
          ...lumber.totals,
        ];
        for (let i = 0; i < 5; i++) {
          lightAI.update(light);
          fruitAI.update(fruit);
          expect(hammerAI.update(hammer)).toBe(false);
          expect(lumberAI.update(0.1, lumber)).toBeNull();
        }
        expect([
          ...light.scores,
          ...fruit.scores,
          ...hammer.totals,
          ...lumber.totals,
        ]).toEqual(before);
        for (const [game, ai, score, actions] of [
          ["light-fingers", lightAI, light.scores, acts.light],
          ["fruit-duel", fruitAI, fruit.scores, acts.fruit],
          ["hammer-hit", hammerAI, hammer.scores[1], acts.hammer],
          ["lumberjack", lumberAI, lumber.totals, acts.lumber],
        ] as const)
          records.push({
            game,
            seed,
            difficulty,
            profile: ai.snapshot().profile,
            opening: actions.slice(0, 4),
            actions: actions.length,
            score,
            duration: finished[game],
            distribution: actions.reduce<Record<string, number>>((bins, v) => {
              const k =
                game === "lumberjack"
                  ? String(v)
                  : (Math.round(v * 20) / 20).toFixed(2);
              bins[k] = (bins[k] ?? 0) + 1;
              return bins;
            }, {}),
            cpuBatch: performance.now() - start,
          });
      }
      expect(reactions.size).toBeGreaterThan(90);
      if (difficulty === "medium") expect(scores.size).toBeGreaterThan(30);
      else if (difficulty === "hard") expect(scores.size).toBeGreaterThan(10);
    }, 60000);
    it("100 physics scenarios preserve speed/bounds and stable seeded trajectories", () => {
      const signatures = new Set<string>();
      for (let seed = 0; seed < 100; seed++) {
        const p = new PongWorld(),
          h = new HockeyWorld(),
          pa = new PongAI(difficulty, seed),
          ha = new AirHockeyAI(difficulty, seed),
          fps = [30, 60, 120][seed % 3],
          dt = 1 / fps;
        const begin = performance.now(),
          traceP: number[] = [],
          traceH: string[] = [];
        p.cooldown = h.cooldown = 0;
        Object.assign(p.ball, { x: 125, y: 440, vx: 130, vy: -320 });
        Object.assign(h.puck, { x: 165, y: 285, vx: 95, vy: 45 });
        for (let frame = 0; frame < fps * 2; frame++) {
          const x = pa.update(dt, p),
            v = ha.update(dt, h);
          expect(x).toBeGreaterThanOrEqual(68);
          expect(x).toBeLessThanOrEqual(352);
          expect(Math.abs(x - p.paddles[1].x)).toBeLessThanOrEqual(
            1750 * dt + 0.001,
          );
          expect(v.x).toBeGreaterThanOrEqual(53);
          expect(v.x).toBeLessThanOrEqual(367);
          expect(v.y).toBeGreaterThanOrEqual(141);
          expect(v.y).toBeLessThanOrEqual(352);
          expect(
            Math.hypot(v.x - h.mallets[1].x, v.y - h.mallets[1].y),
          ).toBeLessThanOrEqual(1450 * dt + 0.001);
          if (frame % Math.max(1, Math.floor(fps / 5)) === 0) {
            traceP.push(+x.toFixed(2));
            traceH.push(`${v.x.toFixed(2)},${v.y.toFixed(2)}`);
          }
          p.step(dt, [210, x]);
          h.step(dt, [h.mallets[0], v]);
        }
        signatures.add(
          `${p.paddles[1].x.toFixed(1)},${h.mallets[1].x.toFixed(1)}`,
        );
        expect(Number.isFinite(h.puck.x + p.ball.x)).toBe(true);
        for (const [game, ai, actions, score] of [
          ["pong", pa, traceP, p.scores],
          ["air-hockey", ha, traceH, h.scores],
        ] as const)
          records.push({
            game,
            kind: "scenario",
            seed,
            difficulty,
            profile: ai.snapshot().profile,
            opening: actions.slice(0, 2),
            actions,
            score,
            duration: 2,
            fps,
            cpuBatch: performance.now() - begin,
          });
        const id = pa.snapshot().profile;
        pa.reset();
        ha.reset();
        expect(pa.snapshot().profile).toBe(id);
      }
      expect(signatures.size).toBeGreaterThan(24);
    });
  });
it("Classic Impossible never loses against any legal human line across every personality", () => {
  const seen = new Set<number>();
  for (let seed = 0; seen.size < 24; seed++) {
    const ai = new ClassicAI("impossible", seed);
    if (seen.has(ai.personality.profile)) continue;
    seen.add(ai.personality.profile);
    const walk = (b: TicTacToeBoard, side: 1 | 2) => {
      if (b.winner) {
        expect(b.winner).not.toBe(side === 1 ? 2 : 1);
        return;
      }
      if (b.turn === side) {
        const n = TicTacToeBoard.restore(b.save());
        expect(n.play(ai.choose(b))).toBe(true);
        walk(n, side);
      } else
        for (let i = 0; i < 9; i++)
          if (!b.cells[i]) {
            const n = TicTacToeBoard.restore(b.save());
            n.play(i);
            walk(n, side);
          }
    };
    walk(new TicTacToeBoard(), 1);
    walk(new TicTacToeBoard(), 2);
  }
}, 30000);
it("seeded board search replays, restores inputs, and varies equal-score openings", () => {
  const openings = new Set<number>();
  for (let seed = 0; seed < 100; seed++) {
    const b = new DotsBoard(),
      r = chooseEdge(b, "medium", { seed, replay: true });
    openings.add(r.edge);
    expect(r.edge).toBeGreaterThanOrEqual(0);
    expect(chooseEdge(b, "medium", { seed, replay: true }).edge).toBe(r.edge);
  }
  expect(openings.size).toBeGreaterThan(8);
  for (const difficulty of levels) {
    const c = new ConnectFourBoard();
    [3, 2, 4, 3, 1, 5].forEach((x) => c.drop(x));
    const a = searchConnectFour(c, difficulty, undefined, {
        seed: 82,
        replay: true,
      }),
      b = searchConnectFour(c, difficulty, undefined, {
        seed: 82,
        replay: true,
      });
    expect(a.column).toBe(b.column);
    expect(a.nodes).toBe(b.nodes);
    expect(c.history).toEqual([3, 2, 4, 3, 1, 5]);
    const u = new UltimateBoard();
    [4, 36, 0].forEach((x) => u.play(x));
    const x = ultimateMove(u, difficulty, { seed: 82, replay: true }),
      y = ultimateMove(u, difficulty, { seed: 82, replay: true });
    expect(x).toEqual(y);
    expect(u.legalMoves()).toContain(x.move);
    const d = new DotsBoard();
    for (let i = 0; i < 30; i++) d.play(d.legal()[0]);
    const m = chooseEdge(d, difficulty, { seed: 82, replay: true }),
      n = chooseEdge(d, difficulty, { seed: 82, replay: true });
    expect(m.edge).toBe(n.edge);
    expect(m.nodes).toBe(n.nodes);
    expect(d.legal()).toContain(m.edge);
  }
}, 30000);
it("100 varied midgame strategy scenarios return legal actions within node budgets", () => {
  for (let seed = 0; seed < 100; seed++) {
    const random = new MatchRandom(seed),
      c = new ConnectFourBoard(),
      u = new UltimateBoard();
    for (let i = 0; i < 12; i++) {
      const legal = c.legal();
      if (legal.length) c.drop(legal[Math.floor(random.next() * legal.length)]);
      const moves = u.legalMoves();
      if (moves.length) u.play(moves[Math.floor(random.next() * moves.length)]);
    }
    const start = performance.now(),
      cf = searchConnectFour(c, "medium", undefined, { seed, replay: true }),
      ut = ultimateMove(u, "medium", { seed, replay: true });
    if (!c.winner) expect(c.legal()).toContain(cf.column);
    if (!u.winner) expect(u.legalMoves()).toContain(ut.move);
    expect(cf.nodes).toBeLessThanOrEqual(10064);
    expect(ut.nodes).toBeLessThanOrEqual(5001);
    records.push({
      game: "strategy-scenarios",
      seed,
      profile: random.profile,
      difficulty: "medium",
      opening: [cf.column, ut.move],
      nodes: [cf.nodes, ut.nodes],
      cpu: performance.now() - start,
    });
  }
}, 60000);
it("Golf seeded candidate simulations replay legal shots, without post-simulation errors", () => {
  for (const difficulty of levels) {
    const w = new GolfPhysics(courses[0], 0, 7),
      input = {
        state: w.exportState(),
        waypoint: 0,
        delay: 0.7,
        difficulty,
        seed: 19,
        replay: true,
      };
    const a = planShot(input),
      b = planShot(input);
    expect([a.vx, a.vy, a.wait, a.candidates]).toEqual([
      b.vx,
      b.vy,
      b.wait,
      b.candidates,
    ]);
    expect(Math.hypot(a.vx, a.vy)).toBeLessThanOrEqual(650.001);
    expect(w.strokes).toBe(0);
    expect(w.shoot(a.vx, a.vy)).toBe(true);
    records.push({
      game: "golf",
      seed: 19,
      difficulty,
      profile: new MatchRandom(19).profile,
      opening: [a.vx, a.vy],
      candidates: a.candidates,
      cpu: a.milliseconds,
    });
  }
}, 30000);

it("completed physics matches never advance AI decisions or move its controls", () => {
  const p = new PongWorld(),
    h = new HockeyWorld(),
    pa = new PongAI("impossible", 12),
    ha = new AirHockeyAI("impossible", 12);
  p.done = h.done = true;
  const before = [pa.snapshot(), ha.snapshot()];
  for (let i = 0; i < 100; i++) {
    expect(pa.update(1 / 60, p)).toBe(p.paddles[1].x);
    expect(ha.update(1 / 60, h)).toEqual({
      x: h.mallets[1].x,
      y: h.mallets[1].y,
    });
  }
  expect([pa.snapshot(), ha.snapshot()]).toEqual(before);
});
it("reaction and precision distributions separate the three difficulties", () => {
  const means = levels.map((difficulty) => {
    let reaction = 0,
      precision = 0;
    for (let seed = 0; seed < 100; seed++) {
      const a = new LightAI(difficulty, seed);
      a.update(new LightMatch(() => 0.5));
      reaction += a.snapshot().reaction;
      const m = new HammerMatch(),
        ai = new HammerAI(difficulty, seed);
      for (let frame = 0; frame < 1800; frame++) {
        m.update(1 / 120);
        if (ai.update(m)) m.hit(1);
      }
      precision += m.totals[1];
    }
    return { reaction: reaction / 100, precision: precision / 100 };
  });
  expect(means[0].reaction).toBeGreaterThan(means[1].reaction * 1.4);
  expect(means[1].reaction).toBeGreaterThan(means[2].reaction * 1.4);
  expect(means[1].precision).toBeGreaterThan(means[0].precision);
  expect(means[2].precision).toBeGreaterThan(means[1].precision);
});

it("100 complete Dots matches preserve extra turns and score only owned boxes", () => {
  for (let seed = 0; seed < 100; seed++) {
    const b = new DotsBoard(),
      rng = new MatchRandom(seed),
      actions: number[] = [],
      start = performance.now();
    while (!b.winner) {
      const legal = b.legal(),
        edge =
          b.turn === 2
            ? chooseEdge(b, "medium", { seed, replay: true }).edge
            : legal[Math.floor(rng.next() * legal.length)];
      expect(legal).toContain(edge);
      expect(b.play(edge)).toBeGreaterThanOrEqual(0);
      actions.push(edge);
    }
    expect(b.scores[0] + b.scores[1]).toBe(16);
    records.push({
      game: "dots-and-boxes",
      seed,
      difficulty: "medium",
      profile: rng.profile,
      opening: actions.slice(0, 4),
      actions,
      score: b.scores,
      duration: actions.length * 0.45,
      cpu: performance.now() - start,
    });
  }
});

it("Golf chooses varied comparably good simulated shots rather than post-simulation noise", () => {
  const choices = new Set<string>();
  for (let seed = 0; seed < 8; seed++) {
    const w = new GolfPhysics(courses[0], 0, 123);
    const plan = planShot({
      state: w.exportState(),
      waypoint: 0,
      delay: 0.65,
      difficulty: "hard",
      seed,
      replay: true,
    });
    choices.add([plan.vx.toFixed(4), plan.vy.toFixed(4), plan.wait].join(","));
    expect(Math.hypot(plan.vx, plan.vy)).toBeLessThanOrEqual(650.001);
    expect(w.shoot(plan.vx, plan.vy)).toBe(true);
  }
  expect(choices.size).toBeGreaterThan(1);
}, 15000);
