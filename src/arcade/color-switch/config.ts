import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "color-switch",
    name: "Color Switch",
    description: "A colorful climb. A new shape around every corner.",
    instructions:
      "Tap to hop and drag sideways to pass only through bands matching your ball’s color. Cross each dashed line to switch colors. Three hearts.",
    desktopControls: {
      ai: ["Space / ↑ / W|Hop up", "← → / A D|Steer sideways"],
    },
    color: "#e2d8ec",
    accent: "#e2d8ec",
    order: 34,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
