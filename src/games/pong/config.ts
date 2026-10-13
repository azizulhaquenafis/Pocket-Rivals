import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "ping-pong",
  name: "Pong",
  description: "A little spin. A lot of rivalry.",
  instructions:
    "Drag anywhere on your half to move your paddle. Orange plays from the bottom, blue from the top. First to 5 or the lead after 2 minutes wins. A nonzero tie gets 1 minute of sudden death.",
  color: "#b8d998",
  accent: "#e5f1da",
  tag: "QUICK REFLEXES",
  order: 1,
  preview,
  supportedModes: ["local-two-player", "single-player"],
} satisfies GameMetadata;
