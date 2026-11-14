import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "paper-glider",
  name: "Paper Glider",
  description: "Catch a little breeze.",
  instructions:
    "Steer with arrows/A/D or drag. Hold Space/Down, or drag in the bottom strip, to slow descent. Pass two or more rings and land centered with low sideways speed. Complete three flights.",
  color: "#d5e9ed",
  accent: "#d5e9ed",
  order: 42,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
