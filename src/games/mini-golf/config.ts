import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "mini-golf",
  name: "Ultimate Golf",
  description: "Four worlds. One little ball.",
  instructions:
    "Pull back anywhere and release to putt. Navigate themed hazards and sink the ball before running out of strokes.",
  desktopControls: {
    ai: [
      "← →|Aim shot",
      "Space|Hold & release power",
      "F / Z|Toggle focus",
      "R|Retry course",
    ],
    local: [
      "← →|Aim shot",
      "Space|Hold & release power",
      "F / Z|Toggle focus",
      "R|Forfeit attempt",
    ],
  },
  color: "#b8d998",
  accent: "#93c57f",
  preview,
  order: 5,
  tag: "A LITTLE ADVENTURE",
  category: "duel",
  tournament: false,
  presentation: "custom",
  responsive: true,
  supportedModes: ["single-player", "local-two-player"],
} satisfies GameMetadata;
