import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "orbit-hop",
    name: "Orbit Hop",
    description: "A small leap through space.",
    instructions:
      "Tap to launch tangentially from orbit into the next planet’s gravity halo. Larger planets are wider targets; denser cores pull harder. Three hearts.",
    desktopControls: {
      ai: ["Space / Enter|Launch from orbit", "Click|Launch from orbit"],
    },
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
