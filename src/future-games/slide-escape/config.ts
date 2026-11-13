import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "slide-escape",
    name: "Slide Escape",
    description: "Make a little room.",
    instructions:
      "Drag blocks lengthwise; free orange to the right. Arrows move, Space selects. Undo/retry below. Eight puzzles.",
    color: "#e5dfc8",
    accent: "#e5dfc8",
    order: 35,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
