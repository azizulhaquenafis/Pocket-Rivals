import type { Enemy } from "./ShooterWorld";

export const waveSpeed = (wave: number, killed = 0) =>
  Math.min(130, 28 + wave * 6 + killed * 0.8);

export const attackInterval = (wave: number) =>
  Math.max(0.42, 1.4 - wave * 0.065);

export function formation(
  wave: number,
  random: () => number = Math.random,
): Enemy[] {
  const enemies: Enemy[] = [],
    rows = Math.min(5, 2 + Math.floor(wave / 2)),
    columns = wave % 4 === 0 ? 5 : 6;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++) {
      const kind =
        wave >= 3 && (r + c) % 5 === 0
          ? 3
          : wave >= 2 && (r + c) % 4 === 0
            ? 2
            : (r + c) % 2;
      const hp = kind === 2 ? Math.min(5, 2 + Math.floor(wave / 5)) : 1;
      enemies.push({
        x: columns === 5 ? 106 + c * 52 : 76 + c * 52,
        y: (wave % 4 === 0 ? 237 : 183) + r * 40,
        hp,
        maxHp: hp,
        kind,
        alive: true,
        phase: c * 0.9 + r * 0.5,
        charge: 0,
      });
    }
  if (wave % 4 === 0)
    enemies.push({
      x: 210,
      y: 190,
      hp: Math.min(22, 6 + wave * 2),
      maxHp: Math.min(22, 6 + wave * 2),
      kind: 5,
      alive: true,
      charge: 0,
      marked: true,
    });

  // Randomly mark 0–2 monsters anywhere in the wave with a glowing red ring (wave 1 always marks 1–2).
  const roll = random();
  const markCount =
    wave === 1
      ? roll < 0.7
        ? 1
        : 2
      : roll < 0.22
        ? 0
        : roll < 0.74
          ? 1
          : 2;
  const pool = enemies.filter((e) => !e.marked);
  for (let m = 0; m < markCount && pool.length > 0; m++) {
    const idx = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    pool[idx].marked = true;
    pool.splice(idx, 1);
  }
  return enemies;
}
