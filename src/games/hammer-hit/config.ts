import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "hammer-hit",
  name: "Hammer Hit",
  description: "Three swings. Find your rhythm.",
  instructions:
    "Take turns striking when the swinging needle hits the center. Three strikes each; highest average score wins.",
  desktopControls: {
    ai: ["Space / Arrows / W A S D|Strike"],
    local: ["p1|Space / Arrows|Strike", "p2|Enter / W A S D|Strike"],
  },
  color: "#f7d6ad",
  accent: "#d9a975",
  preview,
  order: 9,
  tag: "MAKE IT COUNT",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
