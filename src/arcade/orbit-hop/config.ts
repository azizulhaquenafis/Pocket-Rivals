import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "orbit-hop",
    name: "Orbit Hop",
    description: "A small leap through space.",
    instructions:
      "Tap/Space to launch along the arrow. Gravity bends flight. Land on higher planets. Three lives.",
    color: "#d8cde8",
    accent: "#d8cde8",
    order: 32,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
