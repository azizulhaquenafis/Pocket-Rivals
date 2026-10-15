import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "hammer-hit",
  name: "Hammer Hit",
  description: "Three swings. Find your rhythm.",
  instructions:
    "Take turns tapping when the needle reaches the center. The playfield faces the active local player. Each player gets exactly three strikes. The arithmetic average of all three scores decides the winner. Orange: Space. Blue: Enter.",
  color: "#f7d6ad",
  accent: "#d9a975",
  preview,
  order: 9,
  tag: "MAKE IT COUNT",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
