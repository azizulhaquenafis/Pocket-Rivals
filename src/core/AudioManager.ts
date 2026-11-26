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
  | "damage"
  | "clockTick"
  | "clockStop";

interface EffectSpec {
  notes: number[];
  wave?: OscillatorType;
  duration?: number;
  gain?: number;
  endScale?: number;
  step?: number;
  jitter?: number;
}

/** Tactile procedural sound effects (no music, no remote downloads). */
const effects: Record<Sound, EffectSpec> = {
  slice: {
    notes: [2300, 980],
    wave: "sawtooth",
    duration: 0.048,
    gain: 0.036,
    endScale: 0.45,
    step: 0.018,
    jitter: 0.04,
  },
  thud: {
    notes: [135, 68],
    wave: "triangle",
    duration: 0.08,
    gain: 0.14,
    endScale: 0.55,
    step: 0.02,
    jitter: 0.03,
  },
  damage: {
    notes: [340, 225, 130],
    wave: "sawtooth",
    duration: 0.11,
    gain: 0.095,
    endScale: 0.72,
    step: 0.048,
  },
  clockTick: {
    notes: [1620],
    wave: "triangle",
    duration: 0.02,
    gain: 0.048,
    endScale: 0.85,
  },
  clockStop: {
    notes: [880, 587],
    wave: "triangle",
    duration: 0.055,
    gain: 0.095,
    endScale: 0.94,
    step: 0.04,
  },
  tap: {
    notes: [510],
    wave: "triangle",
    duration: 0.05,
    gain: 0.085,
    endScale: 1.24,
    jitter: 0.035,
  },
  hit: {
    notes: [265],
    wave: "triangle",
    duration: 0.062,
    gain: 0.11,
    endScale: 1.18,
    jitter: 0.04,
  },
  goal: {
    notes: [523.25, 783.99],
    wave: "triangle",
    duration: 0.14,
    gain: 0.115,
    endScale: 1.04,
    step: 0.068,
  },
  win: {
    notes: [523.25, 659.25, 783.99, 1046.5],
    wave: "triangle",
    duration: 0.18,
    gain: 0.11,
    endScale: 1.02,
    step: 0.072,
  },
  draw: {
    notes: [440, 392],
    wave: "sine",
    duration: 0.16,
    gain: 0.095,
    endScale: 0.96,
    step: 0.09,
  },
  start: {
    notes: [392, 587.33],
    wave: "triangle",
    duration: 0.095,
    gain: 0.1,
    endScale: 1.09,
    step: 0.055,
  },
  countdown: {
    notes: [660],
    wave: "triangle",
    duration: 0.06,
    gain: 0.085,
    endScale: 1.06,
  },
  pause: {
    notes: [493.88, 369.99],
    wave: "sine",
    duration: 0.06,
    gain: 0.085,
    endScale: 0.94,
    step: 0.045,
  },
  resume: {
    notes: [369.99, 493.88],
    wave: "sine",
    duration: 0.06,
    gain: 0.085,
    endScale: 1.06,
    step: 0.045,
  },
  fail: {
    notes: [260, 175],
    wave: "triangle",
    duration: 0.125,
    gain: 0.105,
    endScale: 0.72,
    step: 0.065,
  },
  soft: {
    notes: [240],
    wave: "sine",
    duration: 0.055,
    gain: 0.065,
    endScale: 1.15,
    jitter: 0.03,
  },
  metal: {
    notes: [932.33, 1396.91],
    wave: "triangle",
    duration: 0.09,
    gain: 0.085,
    endScale: 1.02,
    step: 0.028,
    jitter: 0.025,
  },
  wood: {
    notes: [220, 145],
    wave: "triangle",
    duration: 0.05,
    gain: 0.1,
    endScale: 0.72,
    step: 0.018,
    jitter: 0.04,
  },
  shoot: {
    notes: [540],
    wave: "triangle",
    duration: 0.068,
    gain: 0.095,
    endScale: 1.38,
    jitter: 0.035,
  },
  fall: {
    notes: [360],
    wave: "sine",
    duration: 0.145,
    gain: 0.095,
    endScale: 0.56,
  },
  slide: {
    notes: [175],
    wave: "sine",
    duration: 0.08,
    gain: 0.038,
    endScale: 0.88,
  },
  capture: {
    notes: [587.33, 880],
    wave: "triangle",
    duration: 0.085,
    gain: 0.095,
    endScale: 1.06,
    step: 0.05,
  },
  perfect: {
    notes: [659.25, 880, 1174.66],
    wave: "triangle",
    duration: 0.12,
    gain: 0.105,
    endScale: 1.03,
    step: 0.055,
  },
};

export class AudioManager {
  private ctx?: AudioContext;
  private master?: GainNode;
  private sfxDest?: AudioNode;
  private voices = new Set<OscillatorNode>();
  private last = new Map<Sound, number>();
  constructor(private storage: StorageManager) {}

  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        if (typeof this.ctx.createBiquadFilter === "function") {
          const sfxTone = this.ctx.createBiquadFilter();
          sfxTone.type = "lowpass";
          sfxTone.frequency.setValueAtTime(5400, this.ctx.currentTime);
          sfxTone.connect(this.master);
          this.sfxDest = sfxTone;
        } else {
          this.sfxDest = this.master;
        }
        this.master.connect(this.ctx.destination);
      }
      this.syncSettings();
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    } catch {
      /* Optional audio must never block input. */
    }
  }

  syncSettings() {
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(
        this.storage.data.sound ? this.storage.data.volume : 0,
        this.ctx.currentTime,
      );
    }
  }

  play(kind: Sound, strength = 1) {
    if (!this.storage.data.sound || this.storage.data.volume <= 0) return;
    this.unlock();
    const ctx = this.ctx;
    const dest = this.sfxDest ?? this.master;
    if (!ctx || ctx.state !== "running" || !dest) return;
    const t = ctx.currentTime;
    if (t - (this.last.get(kind) ?? -1) < (kind === "slide" ? 0.12 : 0.04))
      return;
    this.last.set(kind, t);
    const e = effects[kind];
    const jitter = e.jitter
      ? 1 + (Math.random() * 2 - 1) * e.jitter
      : 1;
    const step = e.step ?? 0.065;
    const endScale = e.endScale ?? 0.78;
    for (const [i, baseHz] of e.notes.entries()) {
      if (this.voices.size >= 10) break;
      const hz = baseHz * jitter;
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain(),
        at = t + i * step,
        duration = e.duration ?? 0.13;
      this.voices.add(oscillator);
      oscillator.type = e.wave ?? "sine";
      oscillator.frequency.setValueAtTime(hz, at);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(25, hz * endScale),
        at + duration,
      );
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(
        (e.gain ?? 0.1) * Math.max(0.15, Math.min(1, strength)),
        at + 0.004,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
      oscillator.connect(gain);
      gain.connect(dest);
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

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  dispose() {
    this.stop();
    void this.ctx?.close().catch(() => {});
  }

  get activeVoices() {
    return this.voices.size;
  }
}
