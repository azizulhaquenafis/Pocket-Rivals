import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "paper-glider",
  name: "Paper Glider",
  description: "Catch a little breeze.",
  instructions:
    "Steer with the moving wind through narrowing gates, collect golden rings, and land inside the green runway while avoiding the red dotted line. Three hearts.",
  desktopControls: {
    ai: ["← → / A D|Steer glide", "Space / ↓|Hold air brake"],
  },
  color: "#d5e9ed",
  accent: "#d5e9ed",
  order: 42,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
