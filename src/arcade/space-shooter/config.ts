import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "space-shooter",
  name: "Star Patrol",
  description: "Small ship. Endless courage.",
  instructions:
    "Steer and fire to clear alien waves while dodging enemy shots. Red-ringed ships guarantee a random power-up drop, and any alien may surprise you—weapon upgrades are common while extra lives are rare.",
  desktopControls: {
    ai: ["← → / A D|Move ship", "Space|Fire cannons"],
  },
  color: "#d8d4e6",
  accent: "#aaa3c6",
  preview,
  order: 11,
  tag: "A LITTLE SPACE ADVENTURE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
} satisfies GameMetadata;
