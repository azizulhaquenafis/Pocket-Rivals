import type { Block, Point } from "./ArenaPhysics";
export interface SpikeMap {
  id: string;
  name: string;
  description: string;
  blocks: readonly Block[];
  spawns: readonly [Point, Point];
  floor: readonly [number, number];
}
const spawns = [
  { x: 108, y: 208 },
  { x: 212, y: 208 },
] as const;
export const MAPS: readonly SpikeMap[] = [
  {
    id: "courtyard",
    name: "Courtyard",
    description: "Three staggered shelters.",
    floor: [0xf0c4a2, 0xe7af98],
    spawns,
    blocks: [
      { x: 0, y: 0, w: 72, h: 72 },
      { x: 160, y: 80, w: 72, h: 72 },
      { x: 240, y: 240, w: 80, h: 80 },
    ],
  },
  {
    id: "split-steps",
    name: "Split Steps",
    description: "A reversed diagonal escape.",
    floor: [0xd6e3c7, 0xbdd3b7],
    spawns,
    blocks: [
      { x: 0, y: 240, w: 72, h: 80 },
      { x: 80, y: 80, w: 72, h: 72 },
      { x: 240, y: 0, w: 80, h: 72 },
    ],
  },
  {
    id: "crosswind",
    name: "Crosswind",
    description: "Cover shifts across the arena.",
    floor: [0xd7d7ea, 0xbfc7df],
    spawns,
    blocks: [
      { x: 0, y: 80, w: 72, h: 72 },
      { x: 160, y: 0, w: 72, h: 72 },
      { x: 240, y: 240, w: 80, h: 80 },
    ],
  },
];
export function selectMap(id: string | undefined, seed: number): SpikeMap {
  if (id === "random") return MAPS[(seed >>> 0) % MAPS.length];
  return MAPS.find((map) => map.id === id) ?? MAPS[0];
}
