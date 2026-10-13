import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "space-shooter",
  name: "Star Patrol",
  description: "Small ship. Endless courage.",
  instructions:
    "Drag the lower field to steer and fire. On a keyboard use arrows or A/D and hold Space. Clear waves, protect your three lives, and beat your best.",
  color: "#d8d4e6",
  accent: "#aaa3c6",
  preview,
  order: 11,
  tag: "A LITTLE SPACE ADVENTURE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
} satisfies GameMetadata;
