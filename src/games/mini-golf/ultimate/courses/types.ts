export interface Point {
  x: number;
  y: number;
}
export interface Rect extends Point {
  w: number;
  h: number;
}
export interface Circle extends Point {
  r: number;
  bounce?: number;
}
export interface Mover {
  from: Point;
  to: Point;
  seconds: number;
  r?: number;
  w?: number;
  h?: number;
}
export interface Surface extends Rect {
  friction?: number;
  push?: Point;
  kind: "slick" | "sand" | "belt" | "ford" | "mud" | "quicksand" | "wind";
}
export interface Field extends Circle {
  strength: number;
  quadratic?: boolean;
  movingOnly?: boolean;
  core?: number;
}
export interface Fan extends Point {
  length: number;
  hub: number;
  spin: number;
}
export interface Portal {
  from: Point;
  to: Point;
  angle: number;
}
export interface UFOConfig {
  first: number;
  interval: number;
  warning: number;
  speed: number;
  duration: number;
  hover: number;
  carry: number;
  cooldown: number;
}
export interface Course {
  ufo?: UFOConfig;
  id: string;
  name: string;
  subtitle: string;
  tip: string;
  baseLimit: number;
  color: number;
  start: Point;
  hole: Point;
  walls: Rect[];
  ground?: Rect[];
  circles: Circle[];
  movers: Mover[];
  surfaces: Surface[];
  fields: Field[];
  fans: Fan[];
  lasers: (Rect & { phase: number })[];
  lava?: Circle[];
  diamond?: Circle;
  portals?: Portal[];
  bridges?: Rect[];
  river?: Rect;
  planks?: Rect[][];
  plates?: Point[];
  doors?: Rect[];
  piston?: Rect & { extension: number };
}
export const p = (x: number, y: number): Point => ({ x, y });
export const r = (x: number, y: number, w: number, h: number): Rect => ({
  x,
  y,
  w,
  h,
});
export const outer = () => [
  r(0, 70, 1920, 28),
  r(0, 1052, 1920, 28),
  r(0, 70, 28, 1010),
  r(1892, 70, 28, 1010),
];
