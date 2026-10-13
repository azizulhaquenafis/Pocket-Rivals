/** Development-only observer; no timers, extra animation loop, or production telemetry. */
export class Diagnostics {
  private panel?: HTMLElement;
  private frames = 0;
  private seconds = 0;
  private frameMs = 0;
  private fps = 0;
  private initializations: Record<string, number> = {};
  private modules = new Set<string>();
  private ai = 0;
  private aiMax = 0;
  constructor() {
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has("diagnostics")
    ) {
      this.panel = document.createElement("pre");
      this.panel.className = "diagnostics";
      document.body.append(this.panel);
    }
  }
  loaded(id: string) {
    this.modules.add(id);
  }
  initialized(id: string, ms: number) {
    this.initializations[id] = ms;
  }
  computation(ms: number) {
    this.ai = ms;
    this.aiMax = Math.max(ms, this.aiMax);
  }
  frame(dt: number, scenes: number, assets: number) {
    if (!this.panel) return;
    this.frames++;
    this.seconds += dt;
    this.frameMs = this.frameMs * 0.9 + dt * 100;
    if (this.seconds < 0.5) return;
    this.fps = this.frames / this.seconds;
    const memory = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory;
    this.panel.textContent = `${Math.round(this.frames / this.seconds)} FPS · ${this.frameMs.toFixed(1)} ms\nScenes ${scenes} · textures ${assets}\nHeap ${memory ? (memory.usedJSHeapSize / 1048576).toFixed(1) + " MB" : "unavailable"}\nAI ${this.ai.toFixed(1)} ms · max ${this.aiMax.toFixed(1)}\nLoaded: ${[...this.modules].join(", ")}\nInit: ${Object.entries(
      this.initializations,
    )
      .map(([id, t]) => id + " " + t.toFixed(0) + "ms")
      .join(", ")}`;
    this.frames = 0;
    this.seconds = 0;
  }
  snapshot() {
    return {
      fps: this.fps,
      frameMs: this.frameMs,
      modules: [...this.modules],
      initializations: { ...this.initializations },
      aiMs: this.ai,
      aiMaxMs: this.aiMax,
    };
  }
  dispose() {
    this.panel?.remove();
  }
}
