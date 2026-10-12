import type { GameMetadata } from "../../shared/interfaces/MiniGame";
import preview from "./assets/preview.svg?raw";
export default {
  id: "tap-duel",
  name: "Tap Duel",
  description: "First to ten taps wins.",
  instructions:
    "Orange taps the bottom half. Blue taps the top half. First to ten wins.",
  color: "#d5c2e9",
  accent: "#eadff6",
  preview,
  order: 4,
  tag: "QUICK FINGERS",
  supportedModes: ["local-two-player"],
} satisfies GameMetadata;
