import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "pocket-drift",
  name: "Pocket Drift",
  description: "Find your racing line.",
  instructions:
    "Hold left/right or A/D to steer. Space brakes and slides. Touch either side to steer; drag lower to brake. Follow gold checkpoints for three laps. Grass and barriers cost lives.",
  color: "#dae6cf",
  accent: "#dae6cf",
  order: 40,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
