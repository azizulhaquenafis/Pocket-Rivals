import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "pocket-climber",
    name: "Pocket Climber",
    description: "The next ledge awaits.",
    instructions:
      "Auto-bounce upward while steering onto ledges, collecting stars, and dodging warned rocks. Save your 3 rescue springs to jump 2 ledges high off crumbling steps.",
    desktopControls: {
      ai: ["← → / A D|Steer mid-air", "Space / ↑ / W|Use rescue spring"],
    },
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
