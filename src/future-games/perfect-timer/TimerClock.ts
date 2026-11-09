/** Foreground monotonic time, also used by pointer events between render frames. */
export class TimerClock {
  private started = 0;
  private carried = 0;
  private running = false;
  start(now = performance.now()) {
    this.started = now;
    this.carried = 0;
    this.running = true;
  }
  elapsed(now = performance.now()) {
    return this.carried + (this.running ? Math.max(0, now - this.started) : 0);
  }
  pause(now = performance.now()) {
    this.carried = this.elapsed(now);
    this.running = false;
  }
  resume(now = performance.now()) {
    if (!this.running) {
      this.started = now;
      this.running = true;
    }
  }
}
