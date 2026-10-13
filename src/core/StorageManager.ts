export interface SavedData {
  version: 1;
  sound: boolean;
  music: boolean; // Legacy field retained for saved-data compatibility; no music is played.
  volume: number;
  wins: [number, number];
  draws: number;
  rounds: number;
}
const defaults = (): SavedData => ({
  version: 1,
  sound: true,
  music: false,
  volume: 0.75,
  wins: [0, 0],
  draws: 0,
  rounds: 0,
});
const count = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : 0;
export class StorageManager {
  static key = "pocket-rivals.v1";
  data: SavedData = defaults();
  persistent = true;
  private records = new Map<string, string>();
  constructor(
    private storage: Pick<Storage, "getItem" | "setItem"> | undefined,
  ) {
    this.persistent = !!storage;
    try {
      const raw = storage?.getItem(StorageManager.key);
      if (raw) {
        const d = JSON.parse(raw);
        if (d?.version === 1)
          this.data = {
            version: 1,
            sound: typeof d.sound === "boolean" ? d.sound : true,
            music: false,
            volume:
              typeof d.volume === "number" && Number.isFinite(d.volume)
                ? Math.max(0, Math.min(1, d.volume))
                : 0.75,
            wins: [count(d.wins?.[0]), count(d.wins?.[1])],
            draws: count(d.draws),
            rounds: count(d.rounds),
          };
      }
    } catch {
      this.persistent = false;
    }
  }
  save() {
    try {
      if (!this.storage) throw Error("Storage unavailable");
      this.storage.setItem(StorageManager.key, JSON.stringify(this.data));
    } catch {
      this.persistent = false;
    }
  }
  readRecord(key: string): unknown {
    try {
      const raw = this.records.get(key) ?? this.storage?.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  writeRecord(key: string, value: unknown) {
    this.records.set(key, JSON.stringify(value));
    try {
      if (!this.storage) throw Error("unavailable");
      this.storage.setItem(key, JSON.stringify(value));
    } catch {
      this.persistent = false;
    }
  }
  resetScores() {
    this.data.wins = [0, 0];
    this.data.draws = 0;
    this.data.rounds = 0;
    this.save();
  }
}
