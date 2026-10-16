import { selectMap, type SpikeMap } from "./Maps";
import { MatchRandom } from "../../shared/ai/MatchRandom";
import { attackDepth, movePlayer, pistonHits, type Side } from "./ArenaPhysics";
export type Phase = "warning" | "extend" | "hold" | "retract" | "recover";
export interface Survivor {
  x: number;
  y: number;
  tx: number;
  ty: number;
  alive: boolean;
}
export class SpikeMatch {
  readonly map: SpikeMap;
  players: [Survivor, Survivor];
  scores: [number, number] = [0, 0];
  winner: 1 | 2 | "draw" | null = null;
  wave = 1;
  round = 1;
  direction: Side = 0;
  phase: Phase = "warning";
  phaseAge = 0;
  warning = 1.85;
  between = 0;
  elapsed = 0;
  total = 0;
  readonly lengths = [0, 0, 0, 0];
  private rng: MatchRandom;
  constructor(
    readonly seed: number,
    mapId?: string,
  ) {
    this.map = selectMap(mapId, seed);
    this.players = [this.player(0), this.player(1)];
    this.rng = new MatchRandom(seed);
    this.direction = Math.floor(this.rng.next() * 4) as Side;
  }
  private player(i: number): Survivor {
    return {
      ...this.map.spawns[i],
      tx: this.map.spawns[i].x,
      ty: this.map.spawns[i].y,
      alive: true,
    };
  }
  warningDuration() {
    return Math.max(1.05, 1.85 - (this.wave - 1) * 0.045);
  }
  extensionSpeed() {
    return Math.min(940, 620 + (this.wave - 1) * 18);
  }
  get remaining() {
    return Math.max(0, 120 - this.elapsed);
  }
  advanceClock(dt: number) {
    if (this.winner) return;
    this.elapsed = Math.min(120, this.elapsed + Math.max(0, dt));
    if (this.elapsed >= 120)
      this.winner =
        this.scores[0] === this.scores[1]
          ? "draw"
          : this.scores[0] > this.scores[1]
            ? 1
            : 2;
  }
  target(i: 0 | 1, x: number, y: number) {
    if (
      this.winner ||
      this.between ||
      !this.players[i].alive ||
      !Number.isFinite(x + y)
    )
      return;
    this.players[i].tx = Math.max(9, Math.min(311, x));
    this.players[i].ty = Math.max(9, Math.min(311, y));
  }
  stop(i: 0 | 1) {
    this.players[i].tx = this.players[i].x;
    this.players[i].ty = this.players[i].y;
  }
  private nextWave() {
    this.wave++;
    // A repeated side would reward camping. Changes are seeded and fully telegraphed.
    this.direction = ((this.direction + 1 + Math.floor(this.rng.next() * 3)) %
      4) as Side;
    this.phase = "warning";
    this.phaseAge = 0;
    this.warning = this.warningDuration();
    this.lengths.fill(0);
  }
  step(dt: number) {
    // Keep all collision/phase checks bounded, including direct simulation callers.
    for (
      let left = Math.max(0, Math.min(dt, 0.1));
      left > 1e-9;
      left -= 1 / 120
    )
      this.tick(Math.min(left, 1 / 120));
  }
  private tick(dt: number) {
    if (this.winner) return;
    this.total += dt;
    if (this.between) {
      this.between = Math.max(0, this.between - dt);
      if (this.between < 1e-8) {
        this.between = 0;
        this.round++;
        this.players = [this.player(0), this.player(1)];
        this.nextWave();
      }
      return;
    }
    const old = this.lengths.slice();
    this.phaseAge += dt;
    if (this.phase === "warning") {
      this.warning = Math.max(0, this.warningDuration() - this.phaseAge);
      if (this.warning < 1e-8) {
        this.phase = "extend";
        this.phaseAge = 0;
        this.warning = 0;
      }
    } else if (this.phase === "extend") {
      for (let i = 0; i < 4; i++)
        this.lengths[i] = Math.min(
          attackDepth(this.direction, i, this.map.blocks),
          this.phaseAge * this.extensionSpeed(),
        );
      if (this.phaseAge >= 320 / this.extensionSpeed()) {
        this.phase = "hold";
        this.phaseAge = 0;
      }
    } else if (this.phase === "hold") {
      if (this.phaseAge >= 0.32 + Math.min(0.18, this.wave * 0.008)) {
        this.phase = "retract";
        this.phaseAge = 0;
      }
    } else if (this.phase === "retract") {
      const t = Math.min(1, this.phaseAge / 0.64),
        ease = t * t * (3 - 2 * t);
      for (let i = 0; i < 4; i++)
        this.lengths[i] =
          attackDepth(this.direction, i, this.map.blocks) * (1 - ease);
      if (t === 1) {
        this.lengths.fill(0);
        this.phase = "recover";
        this.phaseAge = 0;
      }
    } else if (this.phaseAge >= 0.18) this.nextWave();
    for (const p of this.players) {
      movePlayer(p, p.tx - p.x, p.ty - p.y, dt, this.map.blocks);
      for (let lane = 0; lane < 4; lane++)
        if (
          pistonHits(
            p,
            this.direction,
            lane,
            Math.max(old[lane], this.lengths[lane]),
          )
        )
          p.alive = false;
    }
    if (this.players.some((p) => !p.alive)) {
      if (this.players[0].alive !== this.players[1].alive)
        this.scores[this.players[0].alive ? 0 : 1]++;
      this.between = 1.15;
      if (this.scores.some((s) => s >= 5))
        this.winner = this.scores[0] >= 5 ? 1 : 2;
    }
  }
}
