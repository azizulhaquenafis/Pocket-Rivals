import type { StorageManager } from "./StorageManager";
export type Sound =
  | "tap"
  | "hit"
  | "goal"
  | "win"
  | "draw"
  | "start"
  | "countdown"
  | "pause"
  | "resume"
  | "fail"
  | "soft"
  | "metal"
  | "wood"
  | "shoot"
  | "fall"
  | "slide"
  | "capture"
  | "perfect"
  | "slice"
  | "thud"
  | "clockTick"
  | "clockStop";
/** Original procedural one-shots: created on demand, no soundtrack or audio downloads. */
const effects: Record<
  Sound,
  { notes: number[]; wave?: OscillatorType; duration?: number; gain?: number }
> = {
  slice: {
    notes: [2400, 1100],
    wave: "sawtooth",
    duration: 0.045,
    gain: 0.035,
  },
  thud: { notes: [110, 65], wave: "triangle", duration: 0.075, gain: 0.13 },
  clockTick: { notes: [1550], wave: "triangle", duration: 0.018, gain: 0.045 },
  clockStop: {
    notes: [820, 520],
    wave: "triangle",
    duration: 0.04,
    gain: 0.09,
  },
  tap: { notes: [480], duration: 0.055 },
  hit: { notes: [260], duration: 0.055 },
  goal: { notes: [440, 660] },
  win: { notes: [392, 494, 587, 784] },
  draw: { notes: [392, 330] },
  start: { notes: [330, 660], duration: 0.09 },
  countdown: { notes: [620], duration: 0.05 },
  pause: { notes: [400, 300], duration: 0.045 },
  resume: { notes: [300, 400], duration: 0.045 },
  fail: { notes: [180, 110], wave: "triangle", duration: 0.12 },
  soft: { notes: [170], duration: 0.055, gain: 0.06 },
  metal: { notes: [890, 1270], wave: "triangle", duration: 0.07 },
  wood: { notes: [140, 90], wave: "triangle", duration: 0.045 },
  shoot: { notes: [720], wave: "triangle", duration: 0.06 },
  fall: { notes: [330], duration: 0.13 },
  slide: { notes: [140], duration: 0.08, gain: 0.035 },
  capture: { notes: [500, 750], duration: 0.065 },
  perfect: { notes: [660, 880, 1100], duration: 0.09 },
};
export class AudioManager {
  private ctx?: AudioContext;
  private master?: GainNode;
  private voices = new Set<OscillatorNode>();
  private last = new Map<Sound, number>();
  constructor(private storage: StorageManager) {}
  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
      }
      this.syncSettings();
      if (this.ctx.state === "suspended")
        void this.ctx.resume().catch(() => {});
    } catch {
      /* Optional audio must never block input. */
    }
  }
  syncSettings() {
    if (this.master && this.ctx)
      this.master.gain.setValueAtTime(
        this.storage.data.sound ? this.storage.data.volume : 0,
        this.ctx.currentTime,
      );
  }
  play(kind: Sound, strength = 1) {
    if (!this.storage.data.sound || this.storage.data.volume <= 0) return;
    this.unlock();
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.master) return;
    const t = ctx.currentTime;
    if (t - (this.last.get(kind) ?? -1) < (kind === "slide" ? 0.12 : 0.04))
      return;
    this.last.set(kind, t);
    const e = effects[kind];
    for (const [i, hz] of e.notes.entries()) {
      if (this.voices.size >= 10) break;
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        at = t + i * 0.065,
        duration = e.duration ?? 0.13;
      this.voices.add(oscillator);
      oscillator.type = e.wave ?? "sine";
      oscillator.frequency.setValueAtTime(hz, at);
      oscillator.frequency.exponentialRampToValueAtTime(
        hz * 0.72,
        at + duration,
      );
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(
        (e.gain ?? 0.1) * Math.max(0.15, Math.min(1, strength)),
        at + 0.004,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        this.voices.delete(oscillator);
      };
      oscillator.start(at);
      oscillator.stop(at + duration + 0.01);
    }
  }
  private stop() {
    this.voices.forEach((v) => {
      try {
        v.stop();
      } catch {}
    });
    this.voices.clear();
  }
  suspend() {
    this.stop();
    if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => {});
  }
  dispose() {
    this.stop();
    void this.ctx?.close().catch(() => {});
  }
  get activeVoices() {
    return this.voices.size;
  }
}
