import type { StorageManager } from "./StorageManager";
export class ArcadeScoreManager {
  constructor(private storage: StorageManager) {}
  best(id: string) {
    const data = this.storage.readRecord("pocket-rivals.arcade.v1") as Record<
      string,
      number
    > | null;
    const n = data?.[id];
    return typeof n === "number" && Number.isFinite(n) && n >= 0
      ? Math.floor(n)
      : 0;
  }
  record(id: string, score: number) {
    const old = this.storage.readRecord("pocket-rivals.arcade.v1");
    const data =
      old && typeof old === "object" && !Array.isArray(old)
        ? ({ ...old } as Record<string, number>)
        : {};
    const best = Math.max(this.best(id), Math.max(0, Math.floor(score)));
    data[id] = best;
    this.storage.writeRecord("pocket-rivals.arcade.v1", data);
    return best;
  }
}
