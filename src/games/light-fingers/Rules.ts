import { FirstResponse } from "../../shared/rules/FirstResponse";
export class LightMatch {
  scores: [number, number] = [0, 0];
  phase: "waiting" | "signal" | "active" | "between" | "done" = "waiting";
  time = 0;
  signalAt = 0;
  blockedUntil = [0, 0];
  capturedBy: 0 | 1 | null = null;
  serial = 0;
  message = "WAIT FOR THE GEM";
  winner: 1 | 2 | null = null;
  private until: number;
  private attempted = [false, false];
  private input = new FirstResponse<boolean>();
  constructor(private random = Math.random) {
    this.until = 1.5 + random() * 3;
  }
  canTap(player: 0 | 1) {
    return this.time >= this.blockedUntil[player];
  }
  tap(player: 0 | 1) {
    if (
      this.phase === "done" ||
      this.phase === "signal" ||
      !this.canTap(player)
    )
      return false;
    if (this.phase !== "active") {
      this.blockedUntil[player] = this.time + 1.25;
      return false;
    }
    this.attempted[player] = true;
    this.input.add(player, true, this.time);
    return true;
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
      const attempted = this.attempted;
      this.attempted = [false, false];
      if (tie) {
        this.blockedUntil = [this.time + 1.25, this.time + 1.25];
        this.message = "";
        return;
      }
      const p = first.player;
      this.capturedBy = p;
      if (attempted[1 - p]) this.blockedUntil[1 - p] = this.time + 1.25;
      this.scores[p]++;
      this.message = "";
      if (this.scores[p] === 5) {
        this.winner = p === 0 ? 1 : 2;
        this.phase = "done";
        this.serial++;
        return;
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
      this.capturedBy = null;
      this.until = this.time + 1.5 + this.random() * 3;
      this.message = "WAIT FOR THE GEM";
      this.input.clear();
    }
  }
}
