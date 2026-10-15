import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";

export default {
  id: "perfect-timer",
  name: "Perfect Timer",
  description: "Stop the hidden stopwatch on the target with 0.01s precision.",
  instructions:
    "Remember the target duration. When the countdown says GO, the stopwatch starts counting invisibly. Press STOP when you believe the exact target duration has elapsed. Centisecond precision (0.01s) decides the winner! Five rounds per match. Orange: Space/A. Blue: Enter/L.",
  color: "#fdebd0",
  accent: "#f5b041",
  preview,
  order: 15,
  tag: "TIME SENSE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
