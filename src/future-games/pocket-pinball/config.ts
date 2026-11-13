import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "pocket-pinball",
    name: "Pocket Pinball",
    description: "Keep the ball alive.",
    instructions:
      "Tap either side or hold A/D/arrows for flippers. Bottom/Space launches. Three balls; eight hits unlock multiball.",
    color: "#cbe8f6",
    accent: "#cbe8f6",
    order: 33,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
