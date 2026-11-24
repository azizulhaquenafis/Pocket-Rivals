export interface HandPose {
  reach: number;
  gray: number;
  grip: number;
  carrying: boolean;
  phase: "ready" | "grab" | "steal" | "recovery";
}
const ease = (t: number) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};
/** Presentation only. Model time keeps the return motion and input lock in sync. */
export class HandMotion {
  private mode: HandPose["phase"] = "ready";
  private start = 0;
  private end = 0;
  private from = 0;
  grab(now: number) {
    this.begin("grab", now, now + 0.75);
  }
  steal(now: number) {
    this.begin("steal", now, now + 0.85);
  }
  recover(now: number, until: number) {
    this.begin("recovery", now, until);
  }
  private begin(mode: HandPose["phase"], now: number, end: number) {
    this.from = this.pose(now).reach;
    this.start = now;
    this.end = end;
    this.mode = mode;
  }
  pose(now: number): HandPose {
    const duration = this.end - this.start;
    if (this.mode === "ready" || duration <= 0 || now >= this.end)
      return { reach: 0, gray: 0, grip: 0, carrying: false, phase: "ready" };
    const t = Math.max(0, (now - this.start) / duration);
    if (this.mode === "recovery") {
      const reach =
        t < 0.08
          ? this.from + (1 - this.from) * ease(t / 0.08)
          : t < 0.24
            ? 1 - 1.16 * ease((t - 0.08) / 0.16)
            : -0.16 * (1 - ease((t - 0.24) / 0.76));
      return {
        reach,
        gray: Math.min(1, t / 0.08) * (1 - ease((t - 0.24) / 0.76)),
        grip: 0,
        carrying: false,
        phase: "recovery",
      };
    }
    const reach =
      t < 0.2
        ? this.from + (1 - this.from) * ease(t / 0.2)
        : t < 0.32
          ? 1
          : 1 - ease((t - 0.32) / 0.68);
    return {
      reach,
      gray: 0,
      grip: this.mode === "steal" ? ease((t - 0.15) / 0.12) : 0,
      carrying: this.mode === "steal" && t >= 0.2,
      phase: this.mode,
    };
  }
}
