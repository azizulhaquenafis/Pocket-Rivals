import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "light-fingers",
  name: "Light Fingers",
  description: "Hold your nerve. Grab the gem.",
  instructions:
    "Wait until the diamond appears, then tap your side. First response wins; an early tap gives your opponent a point. Simultaneous taps replay the round. First to five. Orange: Space. Blue: Enter.",
  color: "#d4e7d8",
  accent: "#9dbbaa",
  preview,
  order: 10,
  tag: "READY. STEADY…",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
