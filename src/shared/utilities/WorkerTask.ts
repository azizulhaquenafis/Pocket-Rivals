/** One outstanding computation. Cancellation terminates CPU work, including on scene exit. */
export class WorkerTask<Input, Output> {
  private worker?: Worker;
  private resolve?: (value: Output | null) => void;
  private timeout?: ReturnType<typeof setTimeout>;
  constructor(
    private create: () => Worker,
    private report: (ms: number) => void = () => {},
  ) {}
  run(input: Input): Promise<Output | null> {
    this.cancel();
    const start = performance.now();
    return new Promise((resolve) => {
      this.resolve = resolve;
      const finish = (value: Output | null) => {
        const reported = (value as { milliseconds?: number } | null)
          ?.milliseconds;
        this.report(
          typeof reported === "number" ? reported : performance.now() - start,
        );
        this.cancel(value);
      };
      try {
        this.worker = this.create();
        this.worker.onmessage = (e) => finish(e.data as Output);
        this.worker.onerror = () => finish(null);
        this.worker.postMessage(input);
        this.timeout = setTimeout(() => finish(null), 2000);
      } catch {
        finish(null);
      }
    });
  }
  cancel(value: Output | null = null) {
    clearTimeout(this.timeout);
    this.worker?.terminate();
    this.worker = undefined;
    const resolve = this.resolve;
    this.resolve = undefined;
    resolve?.(value);
  }
}
