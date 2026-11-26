import { it, expect } from "vitest";
import {
  ShooterWorld,
  type Enemy,
} from "../../src/arcade/space-shooter/ShooterWorld";
import {
  formation,
  waveSpeed,
  attackInterval,
} from "../../src/arcade/space-shooter/Waves";
import {
  canDropLife,
  pickRandomPowerup,
  type PowerupKind,
} from "../../src/arcade/space-shooter/Powerups";
import { MatchRandom } from "../../src/shared/ai/MatchRandom";
const guard = (): Enemy => ({ x: 90, y: 200, hp: 9999, kind: 0, alive: true });
function pickup(w: ShooterWorld, kind: PowerupKind) {
  Object.assign(w.pickups[0], {
    active: true,
    kind,
    x: w.player.x,
    y: w.player.y - 1,
    vx: 0,
    age: 0,
  });
  w.step(1 / 120, w.player.x, false);
}
function kill(w: ShooterWorld, e: Enemy) {
  w.enemies = [e, guard()];
  Object.assign(w.projectiles[0], {
    x: e.x,
    y: e.y + 30,
    vx: 0,
    vy: -490,
    enemy: false,
    active: true,
    damage: 99,
    pierce: 1,
  });
  w.projectiles[0].hits.length = 0;
  w.step(0.08, w.player.x, false);
}
it("levels introduce armor, aimed gunners, aces and random red-ringed carriers without overlapping silhouettes", () => {
  const markedSlots = new Set<string>();
  for (let level = 1; level <= 20; level++) {
    const rng = new MatchRandom(level * 97 + 13);
    const enemies = formation(level, rng.next);
    const marked = enemies.filter((e) => e.marked);
    if (level === 1) expect(marked.length).toBeGreaterThanOrEqual(1);
    expect(marked.length).toBeLessThanOrEqual(3);
    for (const m of marked) markedSlots.add(`${m.kind}:${Math.round(m.x)}:${Math.round(m.y)}`);
    expect(enemies.filter((e) => e.kind === 5)).toHaveLength(
      level % 4 === 0 ? 1 : 0,
    );
    if (level >= 3) expect(enemies.some((e) => e.kind === 3)).toBe(true);
    for (let i = 0; i < enemies.length; i++)
      for (let j = i + 1; j < enemies.length; j++) {
        const a = enemies[i],
          b = enemies[j];
        expect(
          Math.abs(a.x - b.x) >
            (a.kind === 5 ? 25 : 17) + (b.kind === 5 ? 25 : 17) ||
            Math.abs(a.y - b.y) >
              (a.kind === 5 ? 17 : 13) + (b.kind === 5 ? 17 : 13),
        ).toBe(true);
      }
  }
  expect(markedSlots.size).toBeGreaterThan(6);
  expect(waveSpeed(12)).toBeGreaterThan(waveSpeed(1));
  expect(attackInterval(12)).toBeLessThan(attackInterval(1));
  expect(formation(12).find((e) => e.kind === 5)!.hp).toBeGreaterThan(
    formation(4).find((e) => e.kind === 5)!.hp,
  );
});
it("drops fall naturally without homing toward the player, marked enemies drop reliably, and unmarked enemies drop randomly", () => {
  const w = new ShooterWorld(() => 0.5);
  kill(w, { x: 160, y: 460, hp: 1, kind: 0, alive: true, marked: true });
  const dropped = w.pickups.find((p) => p.active)!;
  expect(dropped).toBeDefined();
  const startX = dropped.x;
  dropped.vx = 0;
  // Move player 60px to the right: pickup must fall straight down, never curve toward player.
  w.player.x = startX + 60;
  for (let i = 0; i < 60; i++) w.step(1 / 120, startX + 60, false);
  expect(dropped.x).toBeCloseTo(startX, 5);
  expect(dropped.y).toBeGreaterThan(480);

  // Unmarked enemies trigger unpredictable surprise drops on random kills.
  const surprise = new ShooterWorld(() => 0.02);
  kill(surprise, { x: 210, y: 300, hp: 1, kind: 1, alive: true });
  expect(surprise.pickups.filter((p) => p.active)).toHaveLength(1);

  const quiet = new ShooterWorld(() => 0.95);
  kill(quiet, { x: 210, y: 300, hp: 1, kind: 1, alive: true });
  expect(quiet.pickups.filter((p) => p.active)).toHaveLength(0);
});
it("weighted random loot makes gun enhancements much more common than extra lives and enforces cooldown/cap", () => {
  expect(canDropLife(100, -Infinity, 3)).toBe(true);
  expect(canDropLife(120, 100, 2)).toBe(false);
  expect(canDropLife(145, 100, 2)).toBe(true);
  expect(canDropLife(100, -Infinity, 4)).toBe(false);

  const counts: Record<PowerupKind, number> = {
    spread: 0,
    rapid: 0,
    laser: 0,
    drone: 0,
    shield: 0,
    life: 0,
  };
  const rng = new MatchRandom(77);
  for (let i = 0; i < 2000; i++) counts[pickRandomPowerup(rng.next, true)]++;
  expect(counts.life).toBeGreaterThan(30);
  expect(counts.spread).toBeGreaterThan(counts.life * 4);
  expect(counts.rapid).toBeGreaterThan(counts.life * 2);

  // When extra life is disallowed, pool never returns life.
  for (let i = 0; i < 500; i++)
    expect(pickRandomPowerup(rng.next, false)).not.toBe("life");

  const max = new ShooterWorld();
  max.lives = 4;
  pickup(max, "life");
  expect(max.lives).toBe(4);
  expect(max.shield).toBe(true);
  expect(max.announcement.text).toBe("SHIELD READY");
});
it("caught upgrades add legal multi-shot cannons, faster firing and temporary wingmates", () => {
  for (const [level, shots] of [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 5],
  ]) {
    const w = new ShooterWorld();
    for (let i = 0; i < level; i++) pickup(w, "spread");
    w.step(1 / 120, w.player.x, true);
    expect(w.projectiles.filter((p) => p.active && !p.enemy)).toHaveLength(
      shots,
    );
  }
  const normal = new ShooterWorld(),
    rapid = new ShooterWorld();
  pickup(rapid, "rapid");
  pickup(rapid, "drone");
  for (let i = 0; i < 120; i++) {
    normal.step(1 / 120, 210, true);
    rapid.step(1 / 120, 210, true);
  }
  expect(rapid.shotSerial).toBeGreaterThan(normal.shotSerial * 1.7);
  expect(rapid.drone).toBeGreaterThan(16);
  expect(rapid.pickupSerial).toBe(2);
  for (let i = 0; i < 3000 && !rapid.dead; i++) rapid.step(1 / 120, 210, false);
  if (!rapid.dead) expect(rapid.rapid).toBe(0);
});
it("piercing lasers hit nearer ships first and cannot damage the same armor repeatedly", () => {
  const w = new ShooterWorld();
  const lower: Enemy = { x: 210, y: 420, hp: 1, kind: 0, alive: true },
    upper: Enemy = { x: 210, y: 390, hp: 4, kind: 2, alive: true };
  w.enemies = [upper, lower, guard()];
  Object.assign(w.projectiles[0], {
    x: 210,
    y: 450,
    vx: 0,
    vy: -490,
    enemy: false,
    active: true,
    damage: 2,
    pierce: 3,
    laser: true,
  });
  w.step(0.14, 210, false);
  expect(lower.alive).toBe(false);
  expect(upper.hp).toBe(2);
  w.step(1 / 120, 210, false);
  expect(upper.hp).toBe(2);
});
it("enemy attacks are warned before release and gunners aim within finite legal velocities", () => {
  const w = new ShooterWorld(() => 0.5),
    e: Enemy = { x: 210, y: 210, hp: 999, kind: 3, alive: true };
  w.enemies = [e];
  for (let i = 0; i < 135; i++) w.step(1 / 120, 100, false);
  expect(e.charge).toBeGreaterThan(0);
  expect(w.projectiles.some((p) => p.active && p.enemy)).toBe(false);
  for (let i = 0; i < 60; i++) w.step(1 / 120, 100, false);
  const p = w.projectiles.find((p) => p.active && p.enemy)!;
  expect(p).toBeDefined();
  expect(p.vx).toBeLessThan(0);
  expect(Math.hypot(p.vx, p.vy)).toBeLessThanOrEqual(340);
});
it("shield absorbs one hit; damage preserves immunity and removes only one cannon tier", () => {
  const w = new ShooterWorld();
  w.shield = true;
  w.weaponLevel = 3;
  w.invulnerable = 0;
  const hit = () => {
    Object.assign(w.projectiles[60], {
      x: w.player.x,
      y: w.player.y - 10,
      vx: 0,
      vy: 300,
      enemy: true,
      active: true,
    });
    w.step(0.04, w.player.x, false);
  };
  hit();
  expect(w.shield).toBe(false);
  expect(w.lives).toBe(3);
  expect(w.weaponLevel).toBe(3);
  expect(w.lifeLost.active).toBe(false);
  hit();
  expect(w.lives).toBe(3);
  w.invulnerable = 0;
  hit();
  expect(w.lives).toBe(2);
  expect(w.weaponLevel).toBe(2);
  expect(w.lifeLost.active).toBe(true);
  w.step(0.3, w.player.x, false);
  expect(w.lifeLost.active).toBe(true);
  expect(w.lifeLost.age).toBeGreaterThan(0.25);
  w.step(0.8, w.player.x, false);
  expect(w.lifeLost.active).toBe(false);
  pickup(w, "life");
  expect(w.lives).toBe(3);
});
it("new levels reset all gear and equipment capsules while preserving lives, score and life capsules", () => {
  const w = new ShooterWorld();
  w.weaponLevel = 3;
  w.rapid = w.laser = w.drone = 20;
  w.shield = true;
  w.lives = 4;
  w.score = 100;
  Object.assign(w.pickups[0], {
    active: true,
    kind: "rapid",
    x: 80,
    y: 300,
    vx: 0,
    age: 0,
  });
  Object.assign(w.pickups[1], {
    active: true,
    kind: "life",
    x: 80,
    y: 300,
    vx: 0,
    age: 0,
  });
  w.enemies = [];
  for (let i = 0; i < 150; i++) w.step(1 / 120, 210, false);
  expect(w.wave).toBe(2);
  expect(w.weaponLevel).toBe(0);
  expect([w.rapid, w.laser, w.drone]).toEqual([0, 0, 0]);
  expect(w.shield).toBe(false);
  expect(w.pickups[0].active).toBe(false);
  expect(w.pickups[1].active).toBe(true);
  expect(w.lives).toBe(4);
  expect(w.score).toBe(150);
  expect(w.announcement.remaining).toBe(0);
});
it("same-level formation retries preserve equipment and missed capsules expire", () => {
  const w = new ShooterWorld();
  w.weaponLevel = 2;
  w.shield = true;
  Object.assign(w.pickups[0], {
    active: true,
    kind: "rapid",
    x: 210,
    y: 350,
    vx: 0,
    age: 0,
  });
  w.spawnWave();
  expect(w.weaponLevel).toBe(2);
  expect(w.shield).toBe(true);
  expect(w.pickups[0].active).toBe(true);
  Object.assign(w.pickups[1], {
    active: true,
    x: 370,
    y: 639,
    vx: 0,
    age: 8.9,
  });
  w.step(0.05, 44, false);
  expect(w.pickups[1].active).toBe(false);
  expect(w.pickups[0].active).toBe(true);
});
it("one hundred seeded powered scenarios retain bounded pools and stop every action after death", () => {
  for (let seed = 0; seed < 100; seed++) {
    const random = new MatchRandom(seed),
      w = new ShooterWorld(random.next);
    w.wave = 1 + (seed % 12);
    w.spawnWave();
    w.weaponLevel = 3;
    w.rapid = 14;
    w.laser = 16;
    w.drone = 18;
    for (let i = 0; i < 1800 && !w.dead; i++) {
      w.step(1 / 120, 210 + Math.sin(i / 70) * 150, true);
      if (!Number.isFinite(w.player.x + w.score + w.lives))
        throw Error(`Nonfinite ${seed}`);
    }
    expect(w.projectiles).toHaveLength(80);
    expect(w.pickups).toHaveLength(8);
    expect(w.bursts.length).toBeLessThanOrEqual(24);
    expect(
      w.projectiles
        .filter((p) => p.active)
        .every(
          (p) =>
            Number.isFinite(p.x + p.y + p.vx + p.vy) &&
            p.y >= 116 &&
            p.y <= 646,
        ),
    ).toBe(true);
    w.dead = true;
    const snapshot = JSON.stringify(w);
    w.step(1, 210, true);
    expect(JSON.stringify(w)).toBe(snapshot);
  }
}, 120000);
