import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "paper-glider",
  name: "Paper Glider",
  description: "Catch a little breeze.",
  instructions:
    "Steer with arrows/A/D or drag. Hold Space/Down, or drag in the bottom strip, to slow descent. Watch the moving wind bar: steering with the wind glides faster, while fighting headwinds slows you down. Land smoothly on the green runway and avoid the red dotted line. Three hearts across endless narrowing levels.",
  color: "#d5e9ed",
  accent: "#d5e9ed",
  order: 42,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
