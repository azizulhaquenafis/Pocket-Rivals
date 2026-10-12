import type { Winner } from "../shared/contracts/GameModule";
import type { StorageManager } from "./StorageManager";
export class ScoreManager {
  private recorded = false;
  constructor(private storage: StorageManager) {}
  beginRound() {
    this.recorded = false;
  }
  record(winner: Winner) {
    if (this.recorded) return false;
    this.recorded = true;
    if (winner === "draw") this.storage.data.draws++;
    else this.storage.data.wins[winner - 1]++;
    this.storage.data.rounds++;
    this.storage.save();
    return true;
  }
}
