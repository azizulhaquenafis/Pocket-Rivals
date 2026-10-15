import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";

export default {
  id: "water-guess",
  name: "Water Guess",
  description: "Estimate the water percentage with 0.01% precision.",
  instructions:
    "Observe the vertical water tube and enter your percentage guess with two decimal places (0.01% precision). The player whose guess is closest to the actual water level wins the round. Five rounds per match.",
  color: "#d9eaf7",
  accent: "#8bc2ea",
  preview,
  order: 14,
  tag: "PRECISION EYE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
