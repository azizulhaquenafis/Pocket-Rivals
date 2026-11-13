import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "ricochet",
    name: "Ricochet",
    description: "Find the perfect angle.",
    instructions:
      "Pull from the ball to shoot. Arrows aim; Space fires. Clear eight rooms, five shots each.",
    color: "#dce8cf",
    accent: "#dce8cf",
    order: 31,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
