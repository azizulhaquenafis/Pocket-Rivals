const STORAGE_KEY = 'pocket-rivals.math-history.v1';
const MAX_HISTORY = 150;

export class QuestionHistory {
  private memory = new Set<string>();

  constructor() {
    this.load();
  }

  private get storage(): Storage | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    } catch {
      // ignore
    }
    return null;
  }

  private load(): void {
    try {
      const store = this.storage;
      if (!store) return;
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        this.memory = new Set(arr.slice(-MAX_HISTORY));
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }

  private save(): void {
    try {
      const store = this.storage;
      if (!store) return;
      const arr = Array.from(this.memory).slice(-MAX_HISTORY);
      store.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // Storage quota or privacy restriction
    }
  }

  has(id: string): boolean {
    return this.memory.has(id);
  }

  record(id: string): void {
    if (this.memory.size >= MAX_HISTORY) {
      // Remove oldest entries to maintain ring buffer bound
      const first = this.memory.values().next().value;
      if (first !== undefined) this.memory.delete(first);
    }
    this.memory.add(id);
    this.save();
  }

  clear(): void {
    this.memory.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  size(): number {
    return this.memory.size;
  }
}

export const globalQuestionHistory = new QuestionHistory();
