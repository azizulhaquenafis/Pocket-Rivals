import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "lumberjack",
  name: "Lumberjack",
  description: "Chop quickly. Mind the branches.",
  instructions:
    "Tap left or right to chop away from falling branches. Hitting a branch stuns you for 3 seconds. First to 100 chops wins.",
  desktopControls: {
    ai: ["← → / A D|Chop left or right"],
    local: ["p1|← →|Chop left or right", "p2|A D|Chop left or right"],
  },
  color: "#dbe4c2",
  accent: "#a4b389",
  preview,
  order: 13,
  tag: "A CUT ABOVE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
