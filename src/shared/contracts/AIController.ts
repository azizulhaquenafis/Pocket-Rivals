export type Difficulty = "medium" | "hard" | "impossible";
/** Per-game controllers consume observations and return legal input targets. */
export interface AIController<Observation, Action> {
  update(dt: number, observation: Observation): Action;
  reset(): void;
  dispose?(): void;
}
