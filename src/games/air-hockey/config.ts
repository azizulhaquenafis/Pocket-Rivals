import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "air-hockey",
  name: "Air Hockey",
  description: "Slide. Strike. Settle the score.",
  instructions:
    "Drag your half to move your mallet. Stay on your side and shoot the puck into the opposite goal. First to 5 wins.",
  color: "#a8d6e1",
  accent: "#e0f0f2",
  tag: "FAST & FURIOUS",
  order: 2,
  preview,
  supportedModes: ["local-two-player", "single-player"],
} satisfies GameMetadata;
