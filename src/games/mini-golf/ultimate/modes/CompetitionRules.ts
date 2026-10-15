export interface Attempt {
  time: number;
  strokes: number;
  completed: boolean;
  reason?: "timeout" | "strokes" | "forfeit" | "opponent";
}
export interface Totals {
  time: number;
  strokes: number;
  completed: boolean;
}
export const FINISH_TOLERANCE = 0.1,
  COURSE_TIMEOUT = 180;
export function total(attempts: Attempt[], count: number): Totals {
  return {
    time: attempts.reduce((s, a) => s + a.time, 0),
    strokes: attempts.reduce((s, a) => s + a.strokes, 0),
    completed: attempts.length === count && attempts.every((a) => a.completed),
  };
}
export function winner(one: Totals, two: Totals): 1 | 2 | "draw" {
  if (one.completed !== two.completed) return one.completed ? 1 : 2;
  if (!one.completed) return "draw";
  if (one.strokes !== two.strokes) return one.strokes < two.strokes ? 1 : 2;
  if (Math.abs(one.time - two.time) > FINISH_TOLERANCE)
    return one.time < two.time ? 1 : 2;
  return "draw";
}
export function seedFor(seed: number, index: number) {
  let n = (seed ^ ((index + 1) * 0x9e3779b9)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
  return (n ^ (n >>> 15)) >>> 0;
}
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export const timeText = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
