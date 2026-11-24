import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "pocket-climber",
    name: "Pocket Climber",
    description: "The next ledge awaits.",
    instructions:
      "Auto-bounce; drag or hold arrows/A/D to steer. Collect stars and avoid warned falling rocks. Do not fall behind.",
    color: "#dce8cf",
    accent: "#b5d19d",
    order: 37,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
