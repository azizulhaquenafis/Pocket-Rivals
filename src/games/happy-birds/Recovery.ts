import type { Bird } from "./ArenaPhysics";
export const RECOVERY_SECONDS = 3;
export const home = (player: 0 | 1) => ({
  x: player === 0 ? 140 : 180,
  y: 230,
});
export function beginRecovery(p: Bird) {
  p.alive = false;
  p.recovery = RECOVERY_SECONDS;
  p.hitX = p.x;
  p.hitY = p.y;
  p.vy = 0;
  p.cooldown = 0;
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function recoveryPose(remaining: number) {
  const progress = clamp(1 - remaining / RECOVERY_SECONDS);
  const t = clamp((progress - 0.12) / 0.68);
  const travel = t * t * (3 - 2 * t);
  const tint = clamp((progress - 0.45) / 0.55);
  return { progress, travel, tint: tint * tint * (3 - 2 * tint) };
}
export function advanceRecovery(p: Bird, player: 0 | 1, dt: number) {
  p.recovery = Math.max(0, p.recovery - dt);
  const { travel } = recoveryPose(p.recovery),
    target = home(player);
  p.x = p.hitX + (target.x - p.hitX) * travel;
  p.y = p.hitY + (target.y - p.hitY) * travel - Math.sin(travel * Math.PI) * 22;
  if (p.recovery < 1e-8) {
    p.recovery = 0;
    p.alive = true;
    p.x = target.x;
    p.y = target.y;
    p.direction = player === 0 ? 1 : -1;
    p.vy = -125;
  }
}
/** All colored parts fade together; no numeric cooldown UI is needed. */
export function recoveryColor(color: number, t: number) {
  const gray = 0xa8afb1;
  const channel = (shift: number) =>
    Math.round(
      ((gray >> shift) & 255) * (1 - t) + ((color >> shift) & 255) * t,
    );
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}
