import { HIT_RECOVERY, MISS_RECOVERY } from "./SwordMotion";
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
export const decoys = ["Gift", "Medal", "Flower"];
export const isFruit = (id: number) =>
  Number.isInteger(id) && id >= 0 && id < fruits.length;
export class FruitMatch {
  scores: [number, number] = [0, 0];
  target = 0;
  current = -1;
  phase: "preview" | "show" | "active" | "between" | "done" = "preview";
  time = 0;
  visibleAt = 0;
  version = 0;
  round = 0;
  message = "";
  winner: 1 | 2 | null = null;
  blockedUntil = [0, 0];
  attemptSerial = [0, 0];
  missed = [false, false];
  swingStartedAt = [-100, -100];
  recoveryDuration = [HIT_RECOVERY, HIT_RECOVERY];
  capturedBy: 0 | 1 | null = null;
  capturedKind = -1;
  private until = 0.7;
  private gap = 0;
  private queue = new FirstResponse<{ kind: number }>();
  constructor(private random = Math.random) {}
  canTap(p: 0 | 1) {
    return this.phase !== "done" && this.time >= this.blockedUntil[p];
  }
  tap(p: 0 | 1) {
    if (!this.canTap(p) || this.phase === "show") return false;
    this.attemptSerial[p]++;
    this.swingStartedAt[p] = this.time;
    const valid = this.phase === "active" && isFruit(this.current);
    this.missed[p] = !valid;
    if (!valid) {
      this.recoveryDuration[p] = MISS_RECOVERY;
      this.blockedUntil[p] = this.time + MISS_RECOVERY;
      return true;
    }
    // Capture the judgment now, before the next object can be revealed.
    this.recoveryDuration[p] = HIT_RECOVERY;
    this.blockedUntil[p] = this.time + HIT_RECOVERY;
    this.queue.add(p, { kind: this.current }, this.time);
    return true;
  }
  present() {
    if (this.phase === "show") {
      this.phase = "active";
      this.visibleAt = this.time;
      this.until = this.time + 0.85 + this.random() * 0.4;
    }
  }
  private reveal() {
    this.current =
      ++this.gap >= 3 || this.random() < 0.58
        ? Math.floor(this.random() * 7)
        : 7 + Math.floor(this.random() * 3);
    if (isFruit(this.current)) {
      this.gap = 0;
      this.target = this.current;
    }
    this.phase = "show";
    this.version++;
  }
  update(dt: number) {
    this.time += Math.max(0, dt);
    if (this.phase === "done") return;
    const response = this.queue.resolve(this.time);
    if (response) {
      if (response.tie) {
        // A simultaneous slice keeps each sword on its own visible return path.
        this.capturedBy = null;
      } else {
        const p = response.first.player;
        this.capturedBy = p;
        this.capturedKind = response.first.value.kind;
        this.scores[p]++;
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
      this.current = -1;
      this.capturedBy = null;
      this.phase = "preview";
      this.until = this.time + 0.55;
      this.queue.clear();
    } else if (
      (this.phase === "preview" || this.phase === "active") &&
      this.time >= this.until
    )
      this.reveal();
  }
}
