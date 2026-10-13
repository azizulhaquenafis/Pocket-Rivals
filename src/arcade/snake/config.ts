import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "snake",
  name: "Classic Snake",
  description: "One more bite. One more turn.",
  instructions:
    "Use the direction pad, swipe the garden, or press arrows/WASD. Eat fruit, grow longer, and avoid the walls and your tail.",
  color: "#b8d998",
  accent: "#9ac480",
  preview,
  order: 10,
  tag: "CHASE YOUR PERSONAL BEST",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
} satisfies GameMetadata;
