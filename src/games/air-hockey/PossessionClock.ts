import type { Player } from "../../shared/contracts/GameResult";
export class PossessionClock {
  side: Player | null = null;
  elapsed = 0;
  reset() {
    this.side = null;
    this.elapsed = 0;
  }
  advance(dt: number, y: number): Player | null {
    const next = y > 384 ? 1 : y < 378 ? 2 : this.side;
    if (next !== this.side) {
      this.side = next;
      this.elapsed = 0;
    }
    if (this.side === null) return null;
    this.elapsed += dt;
    if (this.elapsed < 15) return null;
    const opponent = this.side === 1 ? 2 : 1;
    this.reset();
    return opponent;
  }
  get remaining() {
    return Math.max(0, 15 - this.elapsed);
  }
}
