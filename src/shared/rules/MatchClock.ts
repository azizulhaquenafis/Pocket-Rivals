import type { Winner } from "../contracts/GameResult";
/** Feed foreground monotonic elapsed seconds, independently of the physics catch-up cap. */
export class MatchClock {
  remaining = 120;
  overtime = false;
  winner: Winner | null = null;
  score(scores: readonly number[]) {
    if (this.winner !== null) return this.winner;
    if (scores[0] >= 5 || scores[1] >= 5)
      this.winner = scores[0] > scores[1] ? 1 : 2;
    else if (this.overtime && scores[0] !== scores[1])
      this.winner = scores[0] > scores[1] ? 1 : 2;
    return this.winner;
  }
  advance(dt: number, scores: readonly number[]) {
    if (this.score(scores) !== null) return this.winner;
    this.remaining -= Math.max(0, dt);
    if (this.remaining <= 0) {
      if (scores[0] !== scores[1]) this.winner = scores[0] > scores[1] ? 1 : 2;
      else if (!this.overtime && scores[0] > 0) {
        this.overtime = true;
        this.remaining += 60;
        if (this.remaining <= 0) this.winner = "draw";
      } else this.winner = "draw";
    }
    if (this.winner !== null) this.remaining = Math.max(0, this.remaining);
    return this.winner;
  }
  get text() {
    const t = Math.max(0, Math.ceil(this.remaining));
    return `${this.overtime ? "OT " : ""}${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  }
}
