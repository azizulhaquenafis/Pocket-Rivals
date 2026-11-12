import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "snake",
  name: "Classic Snake",
  description: "One more bite. One more turn.",
  instructions:
    "Use the direction pad, swipe the garden, or press arrows/WASD. Choose a garden and difficulty. Eat fruit, grow longer, and avoid the walls, islands and your tail. Catch golden fruit before its ring fades for 30 bonus points. Every 8 fruit completes a 40-point harvest challenge.",
  color: "#b8d998",
  accent: "#9ac480",
  preview,
  order: 10,
  tag: "CHASE YOUR PERSONAL BEST",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
} satisfies GameMetadata;
