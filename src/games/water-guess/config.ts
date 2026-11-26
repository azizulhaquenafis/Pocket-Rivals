import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;

export default {
  id: "water-guess",
  name: "Water Guess",
  description: "Trust your eye. Guess the water level.",
  instructions:
    "Estimate the water level from 0 to 100% without duplicating your rival’s guess. Closest guess wins each round across 5 rounds.",
  desktopControls: {
    ai: ["0–9|Type percentage", "Backspace|Delete", "Enter / Space|Confirm"],
    local: ["0–9|Type percentage", "Backspace|Delete", "Enter / Space|Confirm"],
  },
  color: "#d9eaf7",
  accent: "#8bc2ea",
  preview,
  order: 14,
  tag: "PRECISION EYE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
