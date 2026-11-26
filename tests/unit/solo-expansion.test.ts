import { it, expect } from "vitest";
import { TowerWorld } from "../../src/arcade/tower-stack/Rules";
import { RicochetWorld, ROOMS } from "../../src/future-games/ricochet/Rules";
import { OrbitWorld } from "../../src/arcade/orbit-hop/Rules";
import {
  PinballWorld,
  BUMPERS,
} from "../../src/future-games/pocket-pinball/Rules";
import { ColorWorld } from "../../src/arcade/color-switch/Rules";
import {
  SlideWorld,
  puzzle,
  canMove,
  apply,
} from "../../src/future-games/slide-escape/Rules";
import { PourWorld } from "../../src/arcade/perfect-pour/Rules";
import { ClimberWorld } from "../../src/arcade/pocket-climber/Rules";
const rng = (seed: number) => () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
it("Tower trims real overlap, rewards accuracy, bounds history and ends on a miss", () => {
  const w = new TowerWorld();
  for (let i = 0; i < 100; i++) {
    w.moving.x = w.top.x;
    expect(w.drop()).toBe(true);
    w.step(0.01);
  }
  expect(w.blocks.length).toBeLessThanOrEqual(22);
  expect(w.combo).toBe(100);
  const width = w.top.width;
  w.moving.x = w.top.x + 12;
  w.drop();
  expect(w.top.width).toBe(width - 12);
  expect(w.combo).toBe(0);
  w.moving.x = -500;
  w.drop();
  expect(w.done).toBe(true);
  const score = w.score;
  w.drop();
  expect(w.score).toBe(score);
});
it("all eight Ricochet rooms can be cleared within their legal shot budget", () => {
  const report = [];
  for (let level = 0; level < ROOMS.length; level++) {
    const w = new RicochetWorld();
    w.level = level;
    w.targets = ROOMS[level].targets.map((t) => ({ ...t, alive: true }));
    while (!w.transition && !w.done) {
      let best = -1,
        angle = 0;
      for (let i = 0; i < 144; i++) {
        const c = new RicochetWorld();
        c.level = level;
        c.targets = w.targets.map((t) => ({ ...t }));
        const a = (i * Math.PI * 2) / 144;
        c.fire(Math.cos(a) * 460, Math.sin(a) * 460);
        for (let t = 0; t < 845 && c.moving; t++) c.step(1 / 120);
        const hits = c.targets.filter((t) => !t.alive).length;
        if (hits > best) {
          best = hits;
          angle = a;
        }
      }
      w.fire(Math.cos(angle) * 460, Math.sin(angle) * 460);
      for (let t = 0; t < 845 && w.moving; t++) w.step(1 / 120);
    }
    expect(w.transition, `room ${level + 1}`).toBeGreaterThan(0);
    report.push(5 - w.shots);
  }
  console.log("Ricochet legal shots per room:", report);
}, 30000);
it("Orbit trajectories reach successive generated planets through legal launches", () => {
  for (let seed = 0; seed < 6; seed++) {
    let w = new OrbitWorld(rng(seed));
    for (let planet = 0; planet < 5; planet++) {
      let landed: OrbitWorld | undefined;
      for (let i = 0; i < 120 && !landed; i++) {
        const c = new OrbitWorld(() => 0.5);
        Object.assign(
          c,
          structuredClone({
            planets: w.planets,
            current: w.current,
            highest: w.highest,
            score: w.score,
            camera: w.camera,
            ball: w.ball,
          }),
        );
        c.angle = (i * Math.PI * 2) / 120;
        c.step(0);
        c.launch();
        for (let t = 0; t < 840 && !c.orbit && !c.done; t++) c.step(1 / 120);
        if (c.highest > w.highest && c.orbit && c.lives === 3) landed = c;
      }
      expect(landed, `seed ${seed}, planet ${planet}`).toBeDefined();
      w = landed!;
    }
  }
}, 30000);
it("Pinball rebounds, flipper impulses, multiball and loss use actual balls", () => {
  const w = new PinballWorld();
  expect(w.launch()).toBe(true);
  expect(w.launch()).toBe(false);
  w.balls = [
    { x: BUMPERS[0].x, y: BUMPERS[0].y - 32, vx: 0, vy: 150, cooldown: 0 },
  ];
  w.hits = 7;
  for (let i = 0; i < 10; i++) w.step(1 / 120, true, true);
  expect(w.score).toBeGreaterThan(0);
  expect(w.balls.length).toBe(2);
  expect(w.left).toBeLessThan(0);
  for (let life = 0; life < 3; life++) {
    w.balls = [{ x: 210, y: 665, vx: 0, vy: 200, cooldown: 0 }];
    w.step(1 / 120, false, false);
  }
  expect(w.done).toBe(true);
  expect(w.lives).toBe(0);
});
it("Color rings cost a life on visible wrong-color contact and end after three hits", () => {
  const w = new ColorWorld("impossible");
  for (let lives = 3; lives > 0; lives--) {
    for (let i = 0; i < 90; i++) w.step(1 / 120);
    const obstacle = w.obstacle();
    const side = obstacle.phase >= 0 ? 1 : -1;
    w.x = 210 + side * (w.settings.lane / 2);
    w.y = obstacle.center + Math.sqrt(obstacle.extent ** 2 - (w.x - 210) ** 2);
    w.hop();
    w.step(1 / 120);
    expect(w.lives).toBe(lives - 1);
    expect(w.score).toBe(0);
  }
  expect(w.done).toBe(true);
});

it("all eight Slide Escape layouts have a verified legal solution, undo and replay", () => {
  const starts = new Set<string>();
  for (let level = 0; level < 8; level++) {
    const { pieces, solution } = puzzle(level);
    starts.add(JSON.stringify(pieces));
    expect(pieces[0].x, `level ${level}`).toBeLessThan(4);
    expect(solution.length).toBeGreaterThan(0);
    for (const m of solution) {
      expect(canMove(pieces, m.piece, m.delta)).toBe(true);
      apply(pieces, m.piece, m.delta);
    }
    expect(pieces[0].x).toBe(4);
  }
  expect(starts.size).toBe(8);
  const w = new SlideWorld(),
    before = structuredClone(w.pieces);
  outer: for (let i = 0; i < w.pieces.length; i++)
    for (const d of [-1, 1])
      if (w.move(i, d)) {
        w.undo();
        break outer;
      }
  expect(w.pieces).toEqual(before);
});
it("all ten vessels reward accurate timed pours including residual drops", () => {
  const w = new PourWorld();
  for (let round = 1; round <= 10; round++) {
    expect(w.round).toBe(round);
    const target = w.capacity * w.target;
    w.hold(true);
    for (let i = 0; i < 1000 && w.volume + w.pending < target; i++)
      w.step(1 / 120);
    w.hold(false);
    for (let i = 0; i < 75; i++) w.step(1 / 120);
    expect(w.rating).toBeGreaterThanOrEqual(98);
    while (w.between) w.step(1 / 120);
  }
  expect(w.done).toBe(true);
  expect(w.score).toBeGreaterThanOrEqual(980);
  expect(w.lives).toBe(3);
  const spill = new PourWorld();
  spill.hold(true);
  for (let i = 0; i < 1000 && !spill.between; i++) spill.step(1 / 120);
  expect(spill.rating).toBe(0);
  expect(spill.spilled).toBe(true);
  expect(spill.lives).toBe(2);
  // Single-commit pour: releasing after meaningful flow locks the valve during settle
  const commit = new PourWorld();
  commit.hold(true);
  for (let i = 0; i < 60; i++) commit.step(1 / 120);
  commit.hold(false);
  expect(commit.locked).toBe(true);
  commit.hold(true);
  expect(commit.holding).toBe(false);
});
it("Climber generated ledges are physically reachable and data stays bounded", () => {
  for (let seed = 0; seed < 20; seed++) {
    const w = new ClimberWorld(rng(seed));
    for (let i = 0; i < 120 * 40 && !w.done && w.highest < 20; i++) {
      // Follow the next ledge with the same bounded steering as touch input.
      const p =
        w.platforms.find((p) => p.id === w.highest + 1) ?? w.platforms.at(-1)!;
      const target = w.left(p) + p.width / 2;
      w.step(1 / 120, Math.max(-1, Math.min(1, (target - w.x) / 30)));
      // Rock avoidance is tested separately; geometry reachability ignores random rocks.
      w.rocks = [];
    }
    expect(w.highest, `seed ${seed}`).toBeGreaterThanOrEqual(20);
    expect(w.platforms.length).toBeLessThan(15);
  }
  // 3-use rescue spring boosts ~2 ledges in height (usable while falling from a crumbling ledge)
  const rescue = new ClimberWorld(rng(1), "hard");
  expect(rescue.springs).toBe(3);
  rescue.platforms = [
    { id: 0, x: -500, y: -500, width: 10, motion: 0, phase: 0, star: false },
  ]; // Open sky so we measure pure spring rise height
  rescue.y = 500;
  rescue.vy = 260; // Falling downward
  expect(rescue.spring()).toBe(true);
  expect(rescue.springs).toBe(2);
  expect(rescue.spring()).toBe(false); // Cooldown prevents accidental double-spend
  let minY = rescue.y;
  for (let i = 0; i < 120; i++) {
    rescue.step(1 / 120, 0);
    minY = Math.min(minY, rescue.y);
  }
  const rise = 500 - minY;
  expect(rise).toBeGreaterThanOrEqual(180);
  expect(rise).toBeLessThanOrEqual(205);
  // Remaining 2 uses work after cooldown; 4th attempt fails
  expect(rescue.spring()).toBe(true);
  for (let i = 0; i < 40; i++) rescue.step(1 / 120, 0);
  expect(rescue.spring()).toBe(true);
  for (let i = 0; i < 40; i++) rescue.step(1 / 120, 0);
  expect(rescue.springs).toBe(0);
  expect(rescue.spring()).toBe(false);
});
it("continuous physics behaves consistently at 30/60/144 render Hz using fixed steps", () => {
  for (const create of [
    () => new OrbitWorld(rng(1)),
    () => new ColorWorld(),
    () => new PourWorld(),
  ]) {
    const states = [];
    for (const hz of [30, 60, 144]) {
      const w = create();
      let acc = 0;
      for (let i = 0; i < hz * 2; i++) {
        acc += 1 / hz;
        while (acc + 1e-10 >= 1 / 120) {
          w.step(1 / 120);
          acc -= 1 / 120;
        }
      }
      states.push(JSON.stringify(w));
    }
    expect(states[0]).toBe(states[1]);
    expect(states[1]).toBe(states[2]);
  }
});
