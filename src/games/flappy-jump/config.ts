import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "flappy-jump",
  name: "Flappy Jump",
  description: "Time the jump. Sink the shot.",
  instructions:
    "Your player runs back and forth. Tap to jump: the ball releases at the apex. The floor mark glows when your timing lines up a basket. Only downward passes through the hoop score. First to 10, four-minute cap uses baskets. Orange: Space/A. Blue: Enter/L.",
  color: "#f3bdab",
  accent: "#d69d89",
  preview,
  order: 21,
  tag: "JUMP SHOT",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
