/** Isolated, lazy AI support. Contains no game rules and no Math Quiz imports. */
export type SeedInput = number | (() => number);
export function mixSeed(seed: number, salt: number) {
  let n = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
  n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
  return (n ^ (n >>> 15)) >>> 0;
}
export function freshSeed(): number {
  if (import.meta.env.DEV && typeof location !== "undefined") {
    const value = new URLSearchParams(location.search).get("aiSeed");
    if (value !== null && /^\d+$/.test(value)) return Number(value) >>> 0;
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues)
    return crypto.getRandomValues(new Uint32Array(1))[0];
  return (Math.random() * 4294967296) >>> 0;
}
export function replayMode() {
  return (
    import.meta.env.DEV &&
    typeof location !== "undefined" &&
    new URLSearchParams(location.search).has("aiReplay")
  );
}
export interface AIIdentity {
  seed: number;
  profile: number;
  role: number;
  tempo: number;
  side: -1 | 1;
}
export class MatchRandom {
  readonly seed: number;
  readonly profile: number;
  readonly role: number;
  readonly tempo: number;
  readonly side: -1 | 1;
  private state: number;
  constructor(input: SeedInput = freshSeed()) {
    this.seed =
      typeof input === "number" ? input >>> 0 : (input() * 4294967296) >>> 0;
    this.state = mixSeed(this.seed, 1);
    this.profile = mixSeed(this.seed, 0) % 24;
    this.role = Math.floor(this.profile / 6);
    this.tempo = Math.floor((this.profile % 6) / 2);
    this.side = this.profile % 2 ? 1 : -1;
  }
  next = () => {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** Bounded bell-shaped jitter, sampled at decisions, never in a render loop. */
  sample(mean: number, spread: number, min: number) {
    return Math.max(
      min,
      mean + (spread * (this.next() + this.next() + this.next() - 1.5)) / 1.5,
    );
  }
  rank(action: number, salt = 0) {
    return mixSeed(this.seed, action + salt * 97) / 4294967296;
  }
  turnSeed(turn: number) {
    return mixSeed(this.seed, turn + 101);
  }
  snapshot(): AIIdentity {
    return {
      seed: this.seed,
      profile: this.profile,
      role: this.role,
      tempo: this.tempo,
      side: this.side,
    };
  }
}
export function restoredAISeed(state: unknown): number | undefined {
  const value = (state as { ai?: { seed?: unknown } } | undefined)?.ai?.seed;
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 4294967295
    ? value
    : undefined;
}
