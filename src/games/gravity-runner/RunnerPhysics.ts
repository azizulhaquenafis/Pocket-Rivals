import { obstacleBounds, touchesTrap } from "./ObstacleGeometry";
export interface Gap {
  x: number;
  width: number;
  side: -1 | 1;
}
export interface Obstacle {
  x: number;
  width: number;
  side: -1 | 0 | 1;
  depth: number;
  kind:
    | "ledge"
    | "spikes"
    | "beam"
    | "bridge"
    | "platform"
    | "icicle"
    | "ice-block"
    | "root"
    | "bramble"
    | "jet"
    | "buoy"
    | "crystal"
    | "phase";
  phase?: number;
  period?: number;
}
export interface Runner {
  y: number;
  vy: number;
  gravity: -1 | 1;
  alive: boolean;
  cooldown: number;
}
export const RUNNER_REACH = 13;
/** Shared by gameplay and the AI forecast; all units remain independent of display scale. */
export function advanceRunner(
  p: Runner,
  distance: number,
  dt: number,
  gaps: readonly Gap[],
  obstacles: readonly Obstacle[],
  age = 0,
) {
  if (!p.alive) return;
  p.cooldown = Math.max(0, p.cooldown - dt);
  const previousY = p.y;
  p.vy += p.gravity * 900 * dt;
  p.y += p.vy * dt;
  const gap = (side: number) =>
    gaps.some(
      (g) =>
        g.side === side &&
        distance + RUNNER_REACH >= g.x &&
        distance - RUNNER_REACH <= g.x + g.width,
    );
  if (p.y >= 160 && !gap(1)) {
    if (previousY > 160.001) {
      p.alive = false;
      return;
    }
    p.y = 160;
    p.vy = Math.min(0, p.vy);
  }
  if (p.y <= 10 && !gap(-1)) {
    if (previousY < 9.999) {
      p.alive = false;
      return;
    }
    p.y = 10;
    p.vy = Math.max(0, p.vy);
  }
  for (const o of obstacles) {
    if (
      distance + RUNNER_REACH < o.x ||
      distance - RUNNER_REACH > o.x + o.width
    )
      continue;
    const { low, high, active } = obstacleBounds(o, age);
    if (!active) continue;
    if (o.kind === "platform") {
      // Swept face crossings stop gravity on either runnable side. Front/end
      // collisions remain lethal; a platform is never a teleport/recovery aid.
      if (previousY + 9 <= low + 0.001 && p.y + 9 >= low && p.vy >= 0) {
        p.y = low - 9;
        p.vy = 0;
        continue;
      }
      if (previousY - 9 >= high - 0.001 && p.y - 9 <= high && p.vy <= 0) {
        p.y = high + 9;
        p.vy = 0;
        continue;
      }
    }
    if (touchesTrap(o, distance, p.y, age)) {
      p.alive = false;
      break;
    }
  }
  if (p.y < -22 || p.y > 192) p.alive = false;
}
