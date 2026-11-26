import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "snake",
  name: "Classic Snake",
  description: "One more bite. One more turn.",
  instructions:
    "Swipe anywhere on screen to steer, eat apples to grow, and avoid walls, islands, and your tail. Every 4 apples spawns a Special Golden Apple (+30) with a shrinking timer ring!",
  desktopControls: {
    ai: ["← → ↑ ↓ / W A S D|Steer snake", "Drag|Swipe anywhere to steer"],
  },
  color: "#b8d998",
  accent: "#9ac480",
  preview,
  order: 10,
  tag: "CHASE YOUR PERSONAL BEST",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
} satisfies GameMetadata;
