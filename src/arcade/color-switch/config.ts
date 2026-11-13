import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "color-switch",
    name: "Color Switch",
    description: "Timing in every color.",
    instructions:
      "Tap/Space to hop through matching colors. Rest between rings. Three lives.",
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
