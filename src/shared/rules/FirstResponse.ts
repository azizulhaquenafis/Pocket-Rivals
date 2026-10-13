/** First response per player; input events in the same simulation frame tie fairly. */
export class FirstResponse<T> {
  private entries: { player: 0 | 1; value: T; time: number }[] = [];
  add(player: 0 | 1, value: T, time: number) {
    if (this.entries.some((e) => e.player === player)) return;
    this.entries.push({ player, value, time });
  }
  resolve(now: number) {
    const first = this.entries[0];
    if (!first || now - first.time < 0.009) return null;
    const other = this.entries[1],
      tie = !!other && Math.abs(other.time - first.time) <= 0.008;
    this.entries = [];
    return { first, tie };
  }
  clear() {
    this.entries = [];
  }
}
