export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Course {
  id: string;
  name: string;
  par: number;
  start: { x: number; y: number };
  hole: { x: number; y: number };
  obstacles: Rect[];
}
export const COURSE_WIDTH = 340,
  COURSE_HEIGHT = 400;
export const courses: Course[] = [
  {
    id: "first-putt",
    name: "The first putt",
    par: 2,
    start: { x: 80, y: 340 },
    hole: { x: 260, y: 65 },
    obstacles: [{ x: 115, y: 175, w: 110, h: 28 }],
  },
  {
    id: "dogleg",
    name: "Around the bend",
    par: 3,
    start: { x: 65, y: 345 },
    hole: { x: 265, y: 65 },
    obstacles: [{ x: 130, y: 130, w: 28, h: 270 }],
  },
  {
    id: "zigzag",
    name: "A little zigzag",
    par: 4,
    start: { x: 55, y: 345 },
    hole: { x: 270, y: 45 },
    obstacles: [
      { x: 0, y: 235, w: 220, h: 24 },
      { x: 120, y: 125, w: 220, h: 24 },
    ],
  },
  {
    id: "islands",
    name: "Island hopping",
    par: 3,
    start: { x: 170, y: 350 },
    hole: { x: 170, y: 45 },
    obstacles: [
      { x: 55, y: 200, w: 80, h: 55 },
      { x: 205, y: 200, w: 80, h: 55 },
      { x: 130, y: 105, w: 80, h: 35 },
    ],
  },
  {
    id: "last-lap",
    name: "The last laugh",
    par: 4,
    start: { x: 50, y: 345 },
    hole: { x: 280, y: 65 },
    obstacles: [
      { x: 95, y: 85, w: 28, h: 245 },
      { x: 215, y: 165, w: 28, h: 235 },
    ],
  },
];
