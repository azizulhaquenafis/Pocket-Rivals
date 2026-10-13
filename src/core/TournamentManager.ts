import type { GameResult, MatchSpec } from "../shared/contracts/GameModule";
import type { StorageManager } from "./StorageManager";
export interface TournamentState {
  version: 1;
  id: string;
  phase: "between" | "playing" | "complete";
  plan: MatchSpec[];
  results: GameResult[];
  points: [number, number];
  attempt: number;
  token: string | null;
  checkpoint?: unknown;
}
const KEY = "pocket-rivals.tournament.v1";
export function shuffledSchedule(
  choices: MatchSpec[],
  rounds: number,
  random = Math.random,
) {
  if (!choices.length || !Number.isInteger(rounds) || rounds < 1 || rounds > 25)
    throw Error("Choose games and 1–25 rounds.");
  const plan: MatchSpec[] = [];
  while (plan.length < rounds) {
    const bag = [...choices];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    plan.push(...bag.slice(0, rounds - plan.length));
  }
  return structuredClone(plan);
}
export class TournamentManager {
  state: TournamentState | null = null;
  constructor(private storage: StorageManager) {
    this.state = this.restore(storage.readRecord(KEY));
  }
  private restore(data: unknown): TournamentState | null {
    const d = data as TournamentState;
    if (
      !d ||
      d.version !== 1 ||
      typeof d.id !== "string" ||
      !Array.isArray(d.plan) ||
      d.plan.length < 1 ||
      d.plan.length > 25 ||
      !Array.isArray(d.results) ||
      d.results.length > d.plan.length ||
      !["between", "playing", "complete"].includes(d.phase) ||
      !Number.isSafeInteger(d.attempt) ||
      d.attempt < 0
    )
      return null;
    if (
      !d.plan.every(
        (m) =>
          typeof m?.gameId === "string" &&
          ["local", "ai"].includes(m.options?.mode) &&
          ["medium", "hard", "impossible"].includes(m.options?.difficulty),
      )
    )
      return null;
    if (
      !d.results.every(
        (r) =>
          [1, 2, "draw"].includes(r?.winner) &&
          Array.isArray(r.scores) &&
          r.scores.length === 2 &&
          r.scores.every((n) => Number.isFinite(n) && n >= 0),
      )
    )
      return null;
    if ((d.phase === "complete") !== (d.results.length === d.plan.length))
      return null;
    if (
      d.phase === "playing" &&
      d.token !== `${d.id}:${d.results.length}:${d.attempt}`
    )
      return null;
    d.points = [0, 0];
    for (const r of d.results) this.addPoints(d, r);
    return d;
  }
  private persist() {
    this.storage.writeRecord(KEY, this.state);
  }
  create(plan: MatchSpec[]) {
    if (!plan.length || plan.length > 25)
      throw Error("Invalid tournament length");
    this.state = {
      version: 1,
      id: crypto.randomUUID(),
      phase: "between",
      plan: structuredClone(plan),
      results: [],
      points: [0, 0],
      attempt: 0,
      token: null,
    };
    this.persist();
  }
  current() {
    const s = this.state;
    if (!s || s.phase === "complete") return null;
    return s.plan[s.results.length];
  }
  startRound() {
    const s = this.state;
    if (!s || s.phase === "complete") return null;
    if (s.phase === "between") {
      s.phase = "playing";
      s.token = `${s.id}:${s.results.length}:${s.attempt}`;
      this.persist();
    }
    return { spec: this.current()!, token: s.token!, checkpoint: s.checkpoint };
  }
  restartRound() {
    const s = this.state;
    if (!s || s.phase !== "playing") return null;
    s.attempt++;
    s.phase = "between";
    s.token = null;
    delete s.checkpoint;
    return this.startRound();
  }
  checkpoint(token: string, data: unknown) {
    const s = this.state;
    if (s?.phase !== "playing" || s.token !== token) return false;
    s.checkpoint = data;
    this.persist();
    return true;
  }
  finish(token: string, result: GameResult) {
    const s = this.state;
    if (!s || s.phase !== "playing" || s.token !== token) return false;
    s.results.push(structuredClone(result));
    this.addPoints(s, result);
    s.phase = s.results.length === s.plan.length ? "complete" : "between";
    s.token = null;
    delete s.checkpoint;
    this.persist();
    return true;
  }
  private addPoints(s: TournamentState, r: GameResult) {
    if (r.winner === "draw") {
      s.points[0] += 0.5;
      s.points[1] += 0.5;
    } else s.points[r.winner - 1]++;
  }
  rematch() {
    if (this.state) this.create(this.state.plan);
  }
  clear() {
    this.state = null;
    this.persist();
  }
}
