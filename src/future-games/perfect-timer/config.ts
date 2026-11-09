import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";

export default {
  id: "perfect-timer",
  name: "Perfect Timer",
  description: "Stop the hidden stopwatch on the target with 0.01s precision.",
  instructions:
    "Remember the target. After GO, stop the hidden stopwatch at that duration. Closest, measured to 0.01s, wins the round. Five rounds. Orange: Space/A. Blue: Enter/L.",
  color: "#fdebd0",
  accent: "#f5b041",
  preview,
  order: 15,
  tag: "TIME SENSE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
