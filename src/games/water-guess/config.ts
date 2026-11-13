import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;

export default {
  id: "water-guess",
  name: "Water Guess",
  description: "Trust your eye. Guess the water level.",
  instructions:
    "Observe the vertical water tube and enter a whole percentage from 0 to 100. You cannot choose a percentage already taken by your opponent. The colored reveal shows only the correct percentage; tap to continue. The player whose guess is closest to the actual water level wins the round. Five rounds per match.",
  color: "#d9eaf7",
  accent: "#8bc2ea",
  preview,
  order: 14,
  tag: "PRECISION EYE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
