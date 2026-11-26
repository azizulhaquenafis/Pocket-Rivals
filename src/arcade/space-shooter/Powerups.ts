export type PowerupKind =
  | "spread"
  | "rapid"
  | "laser"
  | "drone"
  | "shield"
  | "life";

export const POWERUPS: Record<
  PowerupKind,
  { name: string; color: number; duration: number }
> = {
  spread: { name: "CANNON UPGRADE", color: 0xf5ad69, duration: 0 },
  rapid: { name: "RAPID FIRE", color: 0xf2ce72, duration: 14 },
  laser: { name: "PIERCING LASER", color: 0x76c8db, duration: 16 },
  drone: { name: "WINGMATES", color: 0xb2a0d1, duration: 18 },
  shield: { name: "SHIELD READY", color: 0x81bdc1, duration: 0 },
  life: { name: "+1 LIFE", color: 0xe4a9b4, duration: 0 },
};

export interface Pickup {
  id: number;
  x: number;
  y: number;
  vx: number;
  kind: PowerupKind;
  active: boolean;
  age: number;
}

/** Weighted probabilities: gun enhancements are common, extra lives are genuinely rare. */
export const POWERUP_WEIGHTS: ReadonlyArray<readonly [PowerupKind, number]> = [
  ["spread", 30],
  ["rapid", 22],
  ["laser", 18],
  ["drone", 15],
  ["shield", 11],
  ["life", 4],
];

/** Any ordinary unmarked enemy has an unpredictable chance to drop a random power-up. */
export const UNMARKED_DROP_CHANCE = 0.09;

/** Extra lives stay rare: capped at 4 lives with a cooldown between drops. */
export function canDropLife(
  elapsed: number,
  lastDrop: number,
  lives: number,
) {
  return elapsed - lastDrop >= 45 && lives < 4;
}

export function pickRandomPowerup(
  random: () => number,
  allowLife: boolean,
): PowerupKind {
  const pool = allowLife
    ? POWERUP_WEIGHTS
    : POWERUP_WEIGHTS.filter(([kind]) => kind !== "life");
  let total = 0;
  for (const [, weight] of pool) total += weight;
  let roll = Math.max(0, Math.min(0.999999, random())) * total;
  for (const [kind, weight] of pool) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return pool[0][0];
}
