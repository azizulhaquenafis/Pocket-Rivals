import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "tic-tac-toe",
  name: "Tic-Tac-Toe",
  description: "The classic battle of wits.",
  instructions:
    "Take turns tapping an empty square (Orange is ×, Blue is ○). Make three in a row to win—or claim three mini-boards in a row in Ultimate.",
  desktopControls: {
    ai: ["Click|Place your mark"],
    local: ["Click|Take turns placing × and ○"],
  },
  color: "#f1b49f",
  accent: "#fae2d8",
  tag: "THINK AHEAD",
  order: 3,
  preview,
  variants: [
    {
      id: "classic",
      name: "Classic — 3×3",
      description: "The familiar little rivalry.",
    },
    {
      id: "ultimate",
      name: "Ultimate — 9×9",
      description: "Nine boards. One big strategy.",
      hasTutorial: true,
    },
  ],
  supportedModes: ["local-two-player", "single-player"],
} satisfies GameMetadata;
