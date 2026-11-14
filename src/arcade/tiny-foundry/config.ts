import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "tiny-foundry",
  name: "Tiny Foundry",
  description: "Every drop matters.",
  instructions:
    "Hold Space or touch above the Finish button to pour. Release early: drops take time to fall into the moving mold. Match its target line, then tap Finish or press Enter. Each cast has 22 seconds. Better nozzles unlock every two casts.",
  color: "#f0e1cf",
  accent: "#f0e1cf",
  order: 43,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
