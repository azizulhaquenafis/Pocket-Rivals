import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "perfect-pour",
    name: "Perfect Pour",
    description: "Just enough.",
    instructions:
      "Hold touch/Space to pour; release at the line. Drops keep falling briefly. Ten vessels, three misses.",
    color: "#cbe8f6",
    accent: "#cbe8f6",
    order: 36,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
