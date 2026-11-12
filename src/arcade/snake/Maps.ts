import type { Cell } from "./SnakeRules";
export interface SnakeMap {
  id: string;
  name: string;
  hint: string;
  background: number;
  floor: number;
  wall: number;
  snake: number;
  light: number;
  blocks: Cell[];
}
const line = (x: number, y: number, n: number, horizontal = true): Cell[] =>
  Array.from({ length: n }, (_, i) => ({
    x: x + (horizontal ? i : 0),
    y: y + (horizontal ? 0 : i),
  }));
export const MAPS: readonly SnakeMap[] = [
  {
    id: "meadow",
    name: "Sunlit Meadow",
    hint: "Open space. Chase your longest run.",
    background: 0xc5dcae,
    floor: 0xe8efd8,
    wall: 0x9eae80,
    snake: 0x528d69,
    light: 0x9ccc83,
    blocks: [],
  },
  {
    id: "ruins",
    name: "Violet Ruins",
    hint: "Weave between ancient pillars.",
    background: 0xd8cde8,
    floor: 0xeee7f4,
    wall: 0x9a8aa9,
    snake: 0x7863aa,
    light: 0xc4a7e0,
    blocks: [
      ...line(4, 4, 4, false),
      ...line(12, 4, 4, false),
      ...line(4, 14, 3, false),
      ...line(12, 14, 3, false),
    ],
  },
  {
    id: "lagoon",
    name: "Blue Lagoon",
    hint: "Navigate islands and narrow channels.",
    background: 0xbadce4,
    floor: 0xe1f0ef,
    wall: 0x83aaa3,
    snake: 0x318fa8,
    light: 0x80cfce,
    blocks: [
      ...line(3, 5, 3),
      ...line(3, 6, 3),
      ...line(11, 5, 3),
      ...line(11, 6, 3),
      ...line(7, 15, 3),
      ...line(7, 16, 3),
    ],
  },
];
export function mapPreview(map: SnakeMap) {
  const hex = (n: number) => "#" + n.toString(16).padStart(6, "0");
  return `<svg viewBox="0 0 170 200" aria-hidden="true"><rect width="170" height="200" rx="12" fill="${hex(map.floor)}"/>${map.blocks.map((c) => `<rect x="${c.x * 10}" y="${c.y * 10}" width="10" height="10" rx="2" fill="${hex(map.wall)}"/>`).join("")}<path d="M45 125h40v-30h30" stroke="#242b32" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M45 125h40v-30h30" stroke="${hex(map.snake)}" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="130" cy="70" r="7" fill="#f49b58" stroke="#242b32" stroke-width="2"/></svg>`;
}
