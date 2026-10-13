import { FirstResponse } from "../../shared/rules/FirstResponse";
export class LightMatch {
  scores: [number, number] = [0, 0];
  phase: "waiting" | "signal" | "active" | "between" | "done" = "waiting";
  time = 0;
  signalAt = 0;
  serial = 0;
  message = "WAIT FOR THE GEM";
  winner: 1 | 2 | null = null;
  private until: number;
  private input = new FirstResponse<boolean>();
  constructor(private random = Math.random) {
    this.until = 1.5 + random() * 3;
  }
  tap(player: 0 | 1) {
    if (this.phase === "waiting" || this.phase === "active")
      this.input.add(player, this.phase === "active", this.time);
  }
  presentSignal() {
    if (this.phase === "signal") {
      this.phase = "active";
      this.signalAt = this.time;
    }
  }
  update(dt: number) {
    this.time += dt;
    if (this.phase === "done") return;
    const response = this.input.resolve(this.time);
    if (response) {
      const { first, tie } = response;
      if (tie) this.message = "SO CLOSE · TRY AGAIN";
      else {
        const p = first.value ? first.player : ((1 - first.player) as 0 | 1);
        this.scores[p]++;
        this.message = first.value
          ? `${p === 0 ? "ORANGE" : "BLUE"} GOT IT!`
          : "TOO SOON · POINT TO YOUR RIVAL";
        if (this.scores[p] === 5) {
          this.winner = p === 0 ? 1 : 2;
          this.phase = "done";
          this.serial++;
          return;
        }
      }
      this.phase = "between";
      this.until = this.time + 1.1;
      this.serial++;
      return;
    }
    if (this.phase === "waiting" && this.time >= this.until) {
      this.phase = "signal";
      this.message = "GRAB IT!";
    } else if (this.phase === "between" && this.time >= this.until) {
      this.phase = "waiting";
      this.until = this.time + 1.5 + this.random() * 3;
      this.message = "WAIT FOR THE GEM";
      this.input.clear();
    }
  }
}
