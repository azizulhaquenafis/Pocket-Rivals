import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "light-fingers",
  name: "Light Fingers",
  description: "Hold your nerve. Grab the gem.",
  instructions:
    "Wait for the diamond to appear, then grab first. Early grabs trigger a brief cooldown. First to 5 steals wins.",
  desktopControls: {
    ai: ["Space / Arrows / W A S D|Grab gem"],
    local: ["p1|Space / Arrows|Grab gem", "p2|Enter / W A S D|Grab gem"],
  },
  color: "#d4e7d8",
  accent: "#9dbbaa",
  preview,
  order: 10,
  tag: "READY. STEADY…",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
