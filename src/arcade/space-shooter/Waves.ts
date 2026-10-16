import type { Enemy } from "./ShooterWorld";
import { hasSupplyShip, waveReward } from "./Powerups";
export const waveSpeed = (wave: number, killed = 0) =>
  Math.min(130, 28 + wave * 6 + killed * 0.8);
export const attackInterval = (wave: number) =>
  Math.max(0.42, 1.4 - wave * 0.065);
export function formation(wave: number): Enemy[] {
  const enemies: Enemy[] = [],
    rows = Math.min(5, 2 + Math.floor(wave / 2)),
    columns = wave % 4 === 0 ? 5 : 6;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < columns; c++) {
      const kind =
        hasSupplyShip(wave) && r === 0 && c === Math.floor(columns / 2)
          ? 4
          : wave >= 3 && (r + c) % 5 === 0
            ? 3
            : wave >= 2 && (r + c) % 4 === 0
              ? 2
              : (r + c) % 2;
      const hp =
        kind === 2
          ? Math.min(5, 2 + Math.floor(wave / 5))
          : kind === 4
            ? Math.min(4, 1 + Math.floor(wave / 4))
            : 1;
      enemies.push({
        x: columns === 5 ? 106 + c * 52 : 76 + c * 52,
        y: (wave % 4 === 0 ? 237 : 183) + r * 40,
        hp,
        maxHp: hp,
        kind,
        alive: true,
        phase: c * 0.9 + r * 0.5,
        charge: 0,
        drop: kind === 4 ? waveReward(wave) : undefined,
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
      drop: "laser",
    });
  return enemies;
}
