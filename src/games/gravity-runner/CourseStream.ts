import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { Gap, Obstacle } from "./RunnerPhysics";
export type Pattern =
  | "single"
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
  patterns: Pattern[];
}
export const TRAPS: Record<string, Palette> = {
  ice: {
    side: ["icicle", "ice-block"],
    center: "ice-block",
    patterns: [
      "single",
      "switchback",
      "gaps",
      "gaps",
      "rail",
      "pinch",
      "islands",
    ],
  },
  green: {
    side: ["root", "bramble"],
    center: "bramble",
    patterns: [
      "cluster",
      "switchback",
      "cluster",
      "gaps",
      "rail",
      "pinch",
      "slalom",
    ],
  },
  blue: {
    side: ["jet"],
    center: "buoy",
    patterns: [
      "single",
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
    patterns: [
      "switchback",
      "cluster",
      "slalom",
      "slalom",
      "rail",
      "pinch",
      "gaps",
    ],
  },
};
/** A rolling weighted choice, not a repeating bag/linear five-pattern loop. */
export class CourseStream {
  next = 350;
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
      (p) => !this.history.slice(-2).includes(p),
    );
    let pattern = options[Math.floor(r.next() * options.length)];
    // Guarantee an early rail demonstration without fixing the later sequence.
    if (this.history.length === 2 && !this.history.includes("rail"))
      pattern = "rail";
    this.history.push(pattern);
    if (this.history.length > 16) this.history.shift();
    const x = this.next,
      side = r.next() < 0.5 ? 1 : -1;
    const intensity = Math.min(1, Math.max(0, (x - 1200) / 11000));
    const clearance = 245 + (1 - intensity) * 80 + r.next() * 55;
    const hazard = (at: number, s: -1 | 0 | 1, center = false): Obstacle => ({
      x: at,
      width: 42 + r.next() * 25,
      side: s,
      depth: center ? 32 + r.next() * 10 : 30 + r.next() * 17,
      kind: center
        ? palette.center
        : palette.side[Math.floor(r.next() * palette.side.length)],
      phase: r.next() * Math.PI * 2,
      period: 3.2 + r.next() * 1.6,
    });
    if (pattern === "rail" || pattern === "pinch") {
      const width =
        pattern === "rail" ? 540 + r.next() * 370 : 460 + r.next() * 140;
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
      else for (const s of [-1, 1] as const) obstacles.push(hazard(x + 200, s));
      this.next = x + width + clearance;
    } else if (pattern === "islands") {
      obstacles.push({
        x,
        width: 140 + r.next() * 90,
        side: 0,
        depth: 24,
        kind: "platform",
      });
      const second = x + obstacles.at(-1)!.width + 190 + r.next() * 70;
      obstacles.push({
        x: second,
        width: 140 + r.next() * 90,
        side: 0,
        depth: 24,
        kind: "platform",
      });
      this.next = second + obstacles.at(-1)!.width + clearance;
    } else {
      const count =
        pattern === "single"
          ? 1
          : pattern === "cluster"
            ? 2 + Math.floor(r.next() * 2)
            : 2;
      let at = x;
      for (let i = 0; i < count; i++) {
        if (pattern === "gaps") {
          const width = 90 + r.next() * 45;
          gaps.push({
            x: at,
            width,
            side: i % 2 ? (side === 1 ? -1 : 1) : side,
          });
          at += width + clearance;
        } else {
          const s =
            pattern === "slalom" && i === 0
              ? 0
              : pattern === "switchback" && i % 2
                ? side === 1
                  ? -1
                  : 1
                : side;
          const o = hazard(at, s, s === 0);
          obstacles.push(o);
          at += o.width + clearance;
        }
      }
      this.next = at;
    }
  }
}
