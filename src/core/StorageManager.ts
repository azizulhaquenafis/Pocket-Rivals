export interface SavedData {
  version: 1;
  sound: boolean;
  music: false;
  volume: number;
  names: [string, string];
  wins: [number, number];
  draws: number;
  rounds: number;
}
const DEFAULT_NAMES: readonly [string, string] = ["Orange", "Blue"];
export function sanitizeName(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
  return cleaned || fallback;
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );
}
const defaults = (): SavedData => ({
  version: 1,
  sound: true,
  music: false,
  volume: 0.75,
  names: [DEFAULT_NAMES[0], DEFAULT_NAMES[1]],
  wins: [0, 0],
  draws: 0,
  rounds: 0,
});
const count = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : 0;
const unit = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(1, v))
    : fallback;
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
        if (d?.version === 1) {
          this.data = {
            version: 1,
            sound: typeof d.sound === "boolean" ? d.sound : true,
            music: false,
            volume: unit(d.volume, 0.75),
            names: [
              sanitizeName(d.names?.[0], DEFAULT_NAMES[0]),
              sanitizeName(d.names?.[1], DEFAULT_NAMES[1]),
            ],
            wins: [count(d.wins?.[0]), count(d.wins?.[1])],
            draws: count(d.draws),
            rounds: count(d.rounds),
          };
        }
      }
    } catch {
      this.persistent = false;
    }
  }
  playerName(player: 0 | 1, ai = false) {
    if (player === 1 && ai) return "Blue AI";
    return sanitizeName(this.data.names[player], DEFAULT_NAMES[player]);
  }
  setPlayerNames(one: string, two: string) {
    this.data.names = [
      sanitizeName(one, DEFAULT_NAMES[0]),
      sanitizeName(two, DEFAULT_NAMES[1]),
    ];
    this.save();
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
