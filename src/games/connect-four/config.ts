import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "connect-four",
  name: "Connect Four",
  description: "Drop a piece. Spot a plan.",
  instructions:
    "Tap a column to drop your piece. Connect four horizontally, vertically or diagonally.",
  color: "#c8e7eb",
  accent: "#82b4c3",
  preview,
  order: 4,
  tag: "AHEAD OF THE CURVE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
