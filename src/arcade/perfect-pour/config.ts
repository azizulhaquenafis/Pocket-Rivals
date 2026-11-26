import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "perfect-pour",
    name: "Perfect Pour",
    description: "Just enough.",
    instructions:
      "Hold to pour water and release right before the dashed target line—falling droplets still settle into the glass. Ten vessels, three misses.",
    desktopControls: {
      ai: ["Space / Enter / ↓ / S|Hold to pour, release to stop"],
    },
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
