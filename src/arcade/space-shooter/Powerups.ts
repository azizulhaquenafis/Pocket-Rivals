export type PowerupKind =
  "spread" | "rapid" | "laser" | "drone" | "shield" | "life";
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
  kind: PowerupKind;
  active: boolean;
  age: number;
}
export const ORDINARY_LOOT_INTERVAL = 32;
export const hasSupplyShip = (wave: number) => wave % 2 === 1 || wave % 6 === 0;
export function waveReward(wave: number): PowerupKind {
  return (["spread", "rapid", "drone", "laser", "shield"] as const)[
    (wave - 1) % 5
  ];
}
/** Extra lives are exclusive to six-level milestones, never ordinary random loot. */
export function canDropLife(
  wave: number,
  elapsed: number,
  lastDrop: number,
  lives: number,
) {
  return wave % 6 === 0 && elapsed - lastDrop >= 90 && lives < 4;
}
