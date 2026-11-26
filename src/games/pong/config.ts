import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "ping-pong",
  name: "Pong",
  description: "A little spin. A lot of rivalry.",
  instructions:
    "Slide your paddle on your half to rally the ball past your rival. First to 5 or the lead after 2 minutes wins; a nonzero tie goes to sudden death.",
  desktopControls: {
    ai: ["← → / A D|Move paddle"],
    local: ["p1|← →|Move paddle", "p2|A D|Move paddle"],
  },
  color: "#b8d998",
  accent: "#e5f1da",
  tag: "QUICK REFLEXES",
  order: 1,
  preview,
  supportedModes: ["local-two-player", "single-player"],
} satisfies GameMetadata;
