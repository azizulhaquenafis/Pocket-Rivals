import type { PongWorld } from "./PongPhysics";
import type { MatchClock } from "../../shared/rules/MatchClock";
export function savePong(w: PongWorld, clock: MatchClock) {
  return {
    version: 1,
    ball: { ...w.ball },
    paddles: w.paddles.map((p) => ({ ...p })),
    scores: [...w.scores],
    cooldown: w.cooldown,
    hits: w.hits,
    clock: { remaining: clock.remaining, overtime: clock.overtime },
  };
}
export function restorePong(w: PongWorld, clock: MatchClock, value: unknown) {
  const d = value as ReturnType<typeof savePong>;
  if (
    !d ||
    d.version !== 1 ||
    !d.ball ||
    !d.clock ||
    !Array.isArray(d.paddles) ||
    d.paddles.length !== 2 ||
    !Array.isArray(d.scores) ||
    d.scores.length !== 2
  )
    return false;
  if (
    !d.scores.every((n) => Number.isInteger(n) && n >= 0 && n < 5) ||
    !Number.isFinite(d.cooldown) ||
    d.cooldown < -0.02 ||
    d.cooldown > 1.35 ||
    !Number.isSafeInteger(d.hits) ||
    d.hits < 0
  )
    return false;
  if (
    typeof d.clock.overtime !== "boolean" ||
    !Number.isFinite(d.clock.remaining) ||
    d.clock.remaining <= 0 ||
    d.clock.remaining > (d.clock.overtime ? 60 : 120)
  )
    return false;
  const b = d.ball;
  if (
    !Number.isFinite(b.x + b.y + b.vx + b.vy) ||
    b.x < 33 ||
    b.x > 387 ||
    b.y < 93 ||
    b.y > 669 ||
    Math.hypot(b.vx, b.vy) > 1000
  )
    return false;
  if (
    !d.paddles.every(
      (p) =>
        p &&
        Number.isFinite(p.x + p.vx) &&
        p.x >= 68 &&
        p.x <= 352 &&
        Math.abs(p.vx) <= 1800.01,
    )
  )
    return false;
  Object.assign(w.ball, b, { r: 9 });
  w.paddles.forEach((p, i) =>
    Object.assign(p, { x: d.paddles[i].x, vx: d.paddles[i].vx }),
  );
  w.scores = [...d.scores] as [number, number];
  w.cooldown = d.cooldown;
  w.hits = d.hits;
  Object.assign(clock, d.clock);
  return true;
}
