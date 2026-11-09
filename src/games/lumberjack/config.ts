import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "lumberjack",
  name: "Lumberjack",
  description: "Chop quickly. Mind the branches.",
  instructions:
    "Tap left or right to chop from that side. Avoid branches at your feet and the next falling segment. First to 100 chops wins. Hitting a branch immediately gives the other player the win. There is no time limit. Orange: A/D. Blue: ←/→.",
  color: "#dbe4c2",
  accent: "#a4b389",
  preview,
  order: 13,
  tag: "A CUT ABOVE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
