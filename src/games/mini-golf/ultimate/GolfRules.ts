import type { Course } from "./courses";
export type GolfDifficulty = 0 | 1 | 2;
export const difficulties = [
  { name: "Easy", factor: 1.5, speed: 0.7, preview: 0.6, rate: 10, bonus: 100 },
  { name: "Normal", factor: 1.1, speed: 1, preview: 0.3, rate: 25, bonus: 250 },
  { name: "Hard", factor: 0.75, speed: 1.3, preview: 0, rate: 50, bonus: 500 },
] as const;
export const strokeLimit = (course: Course, d: GolfDifficulty) =>
  Math.round(course.baseLimit * difficulties[d].factor);
export const scoreFor = (course: Course, strokes: number, d: GolfDifficulty) =>
  Math.max(0, strokeLimit(course, d) - strokes) * difficulties[d].rate +
  difficulties[d].bonus;
