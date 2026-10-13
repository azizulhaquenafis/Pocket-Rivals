import type { HockeyWorld } from "./AirHockeyPhysics";
import type { MatchClock } from "../../shared/rules/MatchClock";
import type { PossessionClock } from "./PossessionClock";
import { validPuckPosition } from "./rink";
export function saveHockey(
  w: HockeyWorld,
  clock: MatchClock,
  poss: PossessionClock,
) {
  return {
    version: 1,
    puck: { ...w.puck },
    mallets: w.mallets.map((m) => ({ ...m })),
    scores: [...w.scores],
    cooldown: w.cooldown,
    clock: { remaining: clock.remaining, overtime: clock.overtime },
    possession: { side: poss.side, elapsed: poss.elapsed },
  };
}
export function restoreHockey(
  w: HockeyWorld,
  clock: MatchClock,
  poss: PossessionClock,
  value: unknown,
) {
  const d = value as ReturnType<typeof saveHockey>;
  if (
    !d ||
    d.version !== 1 ||
    !d.puck ||
    !d.clock ||
    !d.possession ||
    !Array.isArray(d.mallets) ||
    d.mallets.length !== 2 ||
    !Array.isArray(d.scores) ||
    d.scores.length !== 2
  )
    return false;
  if (
    !d.scores.every((n) => Number.isInteger(n) && n >= 0 && n < 5) ||
    !Number.isFinite(d.cooldown) ||
    d.cooldown < 0 ||
    d.cooldown > 1.35
  )
    return false;
  if (
    typeof d.clock.overtime !== "boolean" ||
    !Number.isFinite(d.clock.remaining) ||
    d.clock.remaining <= 0 ||
    d.clock.remaining > (d.clock.overtime ? 60 : 120)
  )
    return false;
  if (
    ![null, 1, 2].includes(d.possession.side) ||
    !Number.isFinite(d.possession.elapsed) ||
    d.possession.elapsed < 0 ||
    d.possession.elapsed >= 15
  )
    return false;
  const p = d.puck;
  if (
    !Number.isFinite(p.x + p.y + p.vx + p.vy) ||
    !validPuckPosition(p.x, p.y, 11) ||
    Math.hypot(p.vx, p.vy) > 1100.01
  )
    return false;
  if (
    !d.mallets.every(
      (m, i) =>
        m &&
        Number.isFinite(m.x + m.y) &&
        m.x >= 53 &&
        m.x <= 367 &&
        m.y >= (i === 0 ? 410 : 141) &&
        m.y <= (i === 0 ? 621 : 352),
    )
  )
    return false;
  Object.assign(w.puck, p, { r: 11 });
  w.mallets.forEach((m, i) =>
    Object.assign(m, { x: d.mallets[i].x, y: d.mallets[i].y, vx: 0, vy: 0 }),
  );
  w.scores = [...d.scores] as [number, number];
  w.cooldown = d.cooldown;
  Object.assign(clock, d.clock);
  Object.assign(poss, d.possession);
  return true;
}
