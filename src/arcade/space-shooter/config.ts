import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "space-shooter",
  name: "Star Patrol",
  description: "Small ship. Endless courage.",
  instructions:
    "Drag to steer/fire; arrows/A/D + Space. Rare gear resets each level; extra lives carry over. Ace every 4 levels.",
  color: "#d8d4e6",
  accent: "#aaa3c6",
  preview,
  order: 11,
  tag: "A LITTLE SPACE ADVENTURE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
} satisfies GameMetadata;
