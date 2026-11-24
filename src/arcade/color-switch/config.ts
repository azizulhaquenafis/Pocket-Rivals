import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "color-switch",
    name: "Color Switch",
    description: "A colorful climb. A new shape around every corner.",
    instructions:
      "Tap the screen or press Space to hop. Drag or use the arrow keys to steer through matching colors. Keep bouncing inside shapes until your color comes around, then hop out. Cross the dashed line to switch colors. Three hearts.",
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
