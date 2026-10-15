import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "happy-birds",
  name: "Happy Birds",
  description: "Tiny wings. Perfect timing.",
  instructions:
    "Tap to flap upward. Glide between the spikes and columns. Both birds face the same course. Last survivor wins the round; simultaneous hits replay. First to 3 rounds wins. Five-minute cap uses round scores. Orange: Space/A. Blue: Enter/L.",
  color: "#c8e7eb",
  accent: "#9ebcc2",
  preview,
  order: 19,
  tag: "KEEP FLYING",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
