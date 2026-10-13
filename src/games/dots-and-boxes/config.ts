import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "dots-and-boxes",
  name: "Dots and Boxes",
  description: "Join the dots. Claim your corner.",
  instructions:
    "Tap between two neighboring dots to draw a line. Complete a box to claim it and play again. One line can claim two boxes. Most boxes wins. On desktop, use arrows and Enter to select a line.",
  color: "#e7ddef",
  accent: "#b6a2c5",
  preview,
  order: 8,
  tag: "CONNECT. COLLECT.",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
