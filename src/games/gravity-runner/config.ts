import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "gravity-runner",
  name: "Gravity Runner",
  description: "The ceiling is your escape route.",
  instructions:
    "Tap to reverse gravity. Pink gaps have no floor or ceiling. Both runners face the same course. Last survivor scores; simultaneous falls replay. First to 5 wins, five-minute cap uses round scores. Orange: Space/A. Blue: Enter/L.",
  color: "#d9d2e9",
  accent: "#8d86a1",
  preview,
  order: 18,
  tag: "FLIP THE WORLD",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
