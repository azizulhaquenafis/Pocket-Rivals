import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "fruit-duel",
  name: "Fruit Duel",
  description: "Spot the match. Beat the clock.",
  instructions:
    "The small fruit is your target. Tap your half when the large fruit matches it. A wrong or early tap gives your rival a point. Simultaneous taps replay. First to ten. Orange: Space. Blue: Enter.",
  color: "#f5dfcf",
  accent: "#d9b498",
  preview,
  order: 11,
  tag: "A FRUITY FACE-OFF",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
