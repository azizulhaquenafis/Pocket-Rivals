import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Gap, Obstacle } from "./RunnerPhysics";
export type Pattern =
  | "movers"
  | "gauntlet"
  | "needle"
  | "crushers"
  | "switchback"
  | "cluster"
  | "gaps"
  | "slalom"
  | "rail"
  | "pinch"
  | "islands";
interface Palette {
  side: Obstacle["kind"][];
  center: Obstacle["kind"];
  roamer: Obstacle["kind"];
  patterns: Pattern[];
}
export const TRAPS: Record<string, Palette> = {
  ice: {
    side: ["icicle", "ice-block"],
    center: "ice-block",
    roamer: "snowball",
    patterns: [
      "movers",
      "gauntlet",
      "needle",
      "crushers",
      "switchback",
      "gaps",
      "rail",
      "pinch",
      "islands",
    ],
  },
  green: {
    side: ["root", "bramble"],
    center: "bramble",
    roamer: "spore",
    patterns: [
      "movers",
      "gauntlet",
      "needle",
      "crushers",
      "cluster",
      "switchback",
      "gaps",
      "rail",
      "pinch",
      "slalom",
    ],
  },
  blue: {
    side: ["jet"],
    center: "buoy",
    roamer: "jelly",
    patterns: [
      "movers",
      "gauntlet",
      "needle",
      "crushers",
      "switchback",
      "cluster",
      "slalom",
      "rail",
      "pinch",
      "islands",
    ],
  },
  purple: {
    side: ["crystal"],
    center: "phase",
    roamer: "orb",
    patterns: [
      "movers",
      "gauntlet",
      "needle",
      "crushers",
      "switchback",
      "cluster",
      "slalom",
      "rail",
      "pinch",
      "gaps",
    ],
  },
};
/** A rolling weighted choice, not a repeating bag/linear five-pattern loop. */
export class CourseStream {
  next = 280;
  readonly history: Pattern[] = [];
  private random: MatchRandom;
  constructor(
    seed: number,
    readonly map: string,
  ) {
    this.random = new MatchRandom(seed);
  }
  append(gaps: Gap[], obstacles: Obstacle[]) {
    const r = this.random,
      palette = TRAPS[this.map] ?? TRAPS.green;
    const options = palette.patterns.filter(
      (p) =>
        !this.history.slice(-2).includes(p) &&
        (this.history.length >= 2 || (p !== "needle" && p !== "crushers")),
    );
    let pattern = options[Math.floor(r.next() * options.length)];
    // Guarantee an early rail demonstration without fixing the later sequence.
    if (this.history.length === 2 && !this.history.includes("rail"))
      pattern = "rail";
    this.history.push(pattern);
    if (this.history.length > 16) this.history.shift();
    const x = this.next,
      side: -1 | 1 = r.next() < 0.5 ? 1 : -1,
      other: -1 | 1 = side === 1 ? -1 : 1;
    const intensity = Math.min(1, Math.max(0, (x - 400) / 6800));
    const clearance = 186 + (1 - intensity) * 58 + r.next() * 18;
    const tightClearance = 180 + (1 - intensity) * 34 + r.next() * 12;
    const hazard = (
      at: number,
      s: -1 | 0 | 1,
      center = false,
      extraDepth = 0,
    ): Obstacle => ({
      x: at,
      width: 42 + r.next() * 24,
      side: s,
      depth: (center ? 32 + r.next() * 10 : 40 + r.next() * 18) + extraDepth,
      kind: center
        ? palette.center
        : palette.side[Math.floor(r.next() * palette.side.length)],
      phase: r.next() * Math.PI * 2,
      period: 2.8 + r.next() * 1.4 - intensity * 0.45,
    });
    const roamer = (at: number, s: -1 | 0 | 1 = 0): Obstacle => {
      const rx = 20 + Math.floor(r.next() * 10);
      const bodyW = 34 + r.next() * 10;
      return {
        x: at,
        width: bodyW + 2 * rx,
        side: s,
        depth: 32 + r.next() * 8,
        kind: palette.roamer,
        motion: "orbit",
        range: rx,
        crossRange: 40 + r.next() * 12,
        phase: r.next() * Math.PI * 2,
        period: 2.4 + r.next() * 1.1 - intensity * 0.35,
      };
    };
    if (pattern === "movers") {
      let at = x;
      for (const [i, motion] of (
        ["along", "orbit", "piston"] as const
      ).entries()) {
        if (motion === "orbit") {
          const o = roamer(at, 0);
          obstacles.push(o);
          at += o.width + clearance;
          continue;
        }
        const s = i === 0 ? side : other;
        const o = hazard(at, s, false);
        o.motion = motion;
        o.period = 2.9 + r.next() * 1.1 - intensity * 0.4;
        o.range = 22;
        if (motion === "along") o.width += 44;
        if (motion === "piston") o.depth = 62 + r.next() * 12;
        obstacles.push(o);
        at += o.width + clearance;
      }
      this.next = at;
    } else if (pattern === "gauntlet") {
      // Rapid alternating flip-flop with deep hazards demanding sharp timing.
      let at = x;
      for (let i = 0; i < 3; i++) {
        const s = i % 2 ? other : side;
        const o = hazard(at, s, false, 8 + intensity * 8);
        if (i === 2 && intensity > 0.25 && r.next() < 0.55) {
          o.motion = "piston";
          o.depth = 64 + r.next() * 10;
          o.period = 2.4 + r.next() * 0.9;
        }
        obstacles.push(o);
        at += o.width + tightClearance;
      }
      this.next = at + (clearance - tightClearance);
    } else if (pattern === "needle") {
      // Thread-the-needle: deep wall squeeze, orbiting roamer, opposing deep wall.
      let at = x;
      const first = hazard(at, side, false, 12 + intensity * 8);
      obstacles.push(first);
      at += first.width + tightClearance;
      const mid = roamer(at, 0);
      obstacles.push(mid);
      at += mid.width + tightClearance;
      const last = hazard(at, other, false, 12 + intensity * 8);
      obstacles.push(last);
      at += last.width + clearance;
      this.next = at;
    } else if (pattern === "crushers") {
      // Alternating retracting side pistons framing a fast across-sweeping center trap.
      let at = x;
      for (let i = 0; i < 3; i++) {
        if (i === 1) {
          const o = hazard(at, 0, true);
          o.motion = "across";
          o.range = 38 + r.next() * 10;
          o.period = 2.4 + r.next() * 0.9 - intensity * 0.3;
          obstacles.push(o);
          at += o.width + tightClearance;
        } else {
          const o = hazard(at, i === 0 ? side : other, false);
          o.motion = "piston";
          o.depth = 66 + r.next() * 12;
          o.period = 2.3 + r.next() * 0.9;
          obstacles.push(o);
          at += o.width + tightClearance;
        }
      }
      this.next = at + (clearance - tightClearance);
    } else if (pattern === "rail" || pattern === "pinch") {
      const width =
        pattern === "rail" ? 520 + r.next() * 170 : 460 + r.next() * 140;
      obstacles.push({
        x,
        width,
        side: 0,
        depth: 22 + r.next() * 4,
        kind: "platform",
      });
      if (pattern === "rail")
        gaps.push(
          { x: x + 180, width: width - 360, side: -1 },
          { x: x + 180, width: width - 360, side: 1 },
        );
      else {
        const pistonSide = intensity > 0.25 && r.next() < 0.65 ? side : 0;
        for (const s of [-1, 1] as const) {
          const o = hazard(x + 200, s, false);
          // Cap depth <= 44 so both middle-rail faces stay tightly passable while outer walls remain lethal.
          o.depth = 34 + r.next() * 10;
          if (s === pistonSide) {
            o.motion = "piston";
            o.depth = 44;
            o.period = 2.5 + r.next() * 0.9;
          }
          obstacles.push(o);
        }
      }
      this.next = x + width + clearance;
    } else if (pattern === "islands") {
      // Mid-air refuge islands separated by a sweeping orbiting roamer.
      const w1 = 150 + r.next() * 80;
      obstacles.push({
        x,
        width: w1,
        side: 0,
        depth: 24,
        kind: "platform",
      });
      const midAt = x + w1 + tightClearance;
      const orb = roamer(midAt, 0);
      obstacles.push(orb);
      const second = midAt + orb.width + tightClearance;
      const w2 = 150 + r.next() * 80;
      obstacles.push({
        x: second,
        width: w2,
        side: 0,
        depth: 24,
        kind: "platform",
      });
      this.next = second + w2 + clearance;
    } else {
      const count =
        pattern === "cluster"
          ? 3 + Math.floor(r.next() * 2)
          : pattern === "switchback" || pattern === "slalom"
            ? 3
            : 2;
      let at = x;
      for (let i = 0; i < count; i++) {
        if (pattern === "gaps") {
          const width = 100 + r.next() * 55;
          gaps.push({
            x: at,
            width,
            side: i % 2 ? other : side,
          });
          at += width + tightClearance;
        } else {
          const s =
            pattern === "slalom" && i === 0
              ? 0
              : (pattern === "switchback" && i % 2) ||
                  (pattern === "cluster" && i >= 2)
                ? other
                : side;
          const o = hazard(at, s, s === 0, s === 0 ? 0 : intensity * 8);
          if (s === 0 && r.next() < 0.5) {
            o.motion = "across";
            o.range = 36 + r.next() * 10;
            o.period = 2.6 + r.next() * 1.0;
          }
          obstacles.push(o);
          at += o.width + (pattern === "switchback" ? tightClearance : clearance);
        }
      }
      this.next = at;
    }
  }
}
