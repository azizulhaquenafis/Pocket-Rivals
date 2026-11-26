import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "tower-stack",
    name: "Tower Stack",
    description: "One block higher.",
    instructions:
      "Tap to drop each sliding block cleanly on top. Overhang trims away; exact alignments glow and build combo bonuses.",
    desktopControls: {
      ai: ["Space / Enter|Drop block", "Click|Drop block"],
    },
    color: "#d8cde8",
    accent: "#d8cde8",
    order: 30,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
