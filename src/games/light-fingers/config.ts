import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "light-fingers",
  name: "Light Fingers",
  description: "Hold your nerve. Grab the gem.",
  instructions:
    "Wait until the diamond appears, then tap your side. First response steals the gem. Early or unsuccessful grabs impose a short cooldown, never a score penalty. Simultaneous grabs leave the gem available after both cooldowns. First to five. Orange: Space. Blue: Enter.",
  color: "#d4e7d8",
  accent: "#9dbbaa",
  preview,
  order: 10,
  tag: "READY. STEADY…",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
