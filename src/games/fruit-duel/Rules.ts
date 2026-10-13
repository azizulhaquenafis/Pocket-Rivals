import { FirstResponse } from "../../shared/rules/FirstResponse";
export const fruits = [
  "Apple",
  "Orange",
  "Watermelon",
  "Banana",
  "Pomegranate",
  "Pineapple",
  "Strawberry",
];
export class FruitMatch {
  scores: [number, number] = [0, 0];
  target = 0;
  current = -1;
  phase: "preview" | "show" | "active" | "between" | "done" = "preview";
  time = 0;
  visibleAt = 0;
  version = 0;
  round = 0;
  message = "REMEMBER THE TARGET";
  winner: 1 | 2 | null = null;
  private until = 0.9;
  private gap = 0;
  private queue = new FirstResponse<boolean>();
  constructor(private random = Math.random) {
    this.target = Math.floor(random() * 7);
  }
  tap(p: 0 | 1) {
    if (this.phase === "preview" || this.phase === "active")
      this.queue.add(
        p,
        this.phase === "active" && this.current === this.target,
        this.time,
      );
  }
  present() {
    if (this.phase === "show") {
      this.phase = "active";
      this.visibleAt = this.time;
      this.until = this.time + 0.65 + this.random() * 0.4;
    }
  }
  private reveal() {
    this.current =
      ++this.gap >= 3 ? this.target : Math.floor(this.random() * 7);
    if (this.current === this.target) this.gap = 0;
    this.phase = "show";
    this.version++;
    this.message = "MATCH? TAP!";
  }
  update(dt: number) {
    this.time += dt;
    if (this.phase === "done") return;
    const response = this.queue.resolve(this.time);
    if (response) {
      if (response.tie) this.message = "SAME INSTANT · REPLAY";
      else {
        const p = response.first.value
          ? response.first.player
          : ((1 - response.first.player) as 0 | 1);
        this.scores[p]++;
        this.message = response.first.value
          ? "SWEET MATCH!"
          : "WRONG FRUIT · RIVAL SCORES";
        if (this.scores[p] >= 10) {
          this.winner = p === 0 ? 1 : 2;
          this.phase = "done";
          this.round++;
          return;
        }
      }
      this.phase = "between";
      this.round++;
      this.until = this.time + 0.9;
      return;
    }
    if (this.phase === "between" && this.time >= this.until) {
      const old = this.target;
      this.target = (old + 1 + Math.floor(this.random() * 6)) % 7;
      this.current = -1;
      this.phase = "preview";
      this.until = this.time + 0.9;
      this.message = "REMEMBER THE TARGET";
      this.gap = 0;
    } else if (
      (this.phase === "preview" || this.phase === "active") &&
      this.time >= this.until
    )
      this.reveal();
  }
}
