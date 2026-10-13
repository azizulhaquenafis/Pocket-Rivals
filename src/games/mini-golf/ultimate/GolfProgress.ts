const KEY = "pocket-rivals.ultimate-golf.v1";
export class GolfProgress {
  best = [0, 0, 0, 0];
  constructor() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (
        data?.version === 1 &&
        Array.isArray(data.best) &&
        data.best.length === 4
      )
        this.best = data.best.map((n: unknown) =>
          typeof n === "number" &&
          Number.isSafeInteger(n) &&
          n >= 0 &&
          n <= 2500
            ? n
            : 0,
        );
    } catch {
      /* Optional storage: play remains available. */
    }
  }
  record(course: number, score: number) {
    this.best[course] = Math.max(this.best[course], score);
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ version: 1, best: this.best }),
      );
    } catch {
      /* Keep the session record. */
    }
  }
  get total() {
    return this.best.reduce((a, b) => a + b, 0);
  }
}
