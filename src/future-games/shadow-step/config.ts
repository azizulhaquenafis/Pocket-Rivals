import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "shadow-step",
  name: "Shadow Step",
  description: "Stay out of the spotlight.",
  instructions:
    "Tap a floor tile to walk there, or use arrows/WASD. Collect gold, then reach the exit. Walls block searchlights; leave a beam before the red ring fills. Escape five rooms with three lives.",
  color: "#d8d4e8",
  accent: "#d8d4e8",
  order: 44,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
