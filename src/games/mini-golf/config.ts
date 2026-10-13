import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "mini-golf",
  name: "Ultimate Golf",
  description: "Four worlds. One little ball.",
  instructions:
    "Choose a course and challenge. Pull back anywhere on the course and release to putt. Avoid hazards and reach the flag before running out of strokes. Focus enlarges the view.",
  color: "#b8d998",
  accent: "#93c57f",
  preview,
  order: 5,
  tag: "A LITTLE ADVENTURE",
  category: "arcade",
  tournament: false,
  presentation: "custom",
  responsive: true,
  supportedModes: ["single-player", "local-two-player"],
} satisfies GameMetadata;
