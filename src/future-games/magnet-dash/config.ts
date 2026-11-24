import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "magnet-dash",
  name: "Magnet Dash",
  description: "Opposites attract.",
  instructions:
    "Tap or press Space to reverse polarity. Ride between the two magnetic rails, avoid barriers and collect gold charges. Three collisions end the run.",
  color: "#d8e8ec",
  accent: "#d8e8ec",
  order: 41,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
