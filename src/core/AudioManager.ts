import type { StorageManager } from "./StorageManager";
type Sound = "tap" | "hit" | "goal" | "win" | "draw";
export class AudioManager {
  private ctx?: AudioContext;
  private lastHit = 0;
  constructor(private storage: StorageManager) {}
  unlock() {
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === "suspended")
        void this.ctx.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  play(kind: Sound) {
    if (!this.storage.data.sound) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    if (kind === "hit" && t - this.lastHit < 0.045) return;
    if (kind === "hit") this.lastHit = t;
    const notes: Record<Sound, number[]> = {
      tap: [480],
      hit: [260],
      goal: [440, 660],
      win: [392, 494, 587, 784],
      draw: [392, 330],
    };
    notes[kind].forEach((hz, i) => {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      const at = t + i * 0.075,
        duration = kind === "hit" ? 0.055 : 0.13;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(hz, at);
      oscillator.frequency.exponentialRampToValueAtTime(
        hz * 0.75,
        at + duration,
      );
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.12, at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.01);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }
  suspend() {
    if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => {});
  }
  dispose() {
    void this.ctx?.close().catch(() => {});
  }
}
