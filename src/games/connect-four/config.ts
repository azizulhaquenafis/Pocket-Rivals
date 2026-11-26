import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "connect-four",
  name: "Connect Four",
  description: "Drop a piece. Spot a plan.",
  instructions:
    "Drop discs into any column to connect four horizontally, vertically, or diagonally.",
  desktopControls: {
    ai: ["1–7|Drop piece in column", "Click|Drop piece"],
    local: ["1–7|Drop piece in column", "Click|Drop piece"],
  },
  color: "#c8e7eb",
  accent: "#82b4c3",
  preview,
  order: 4,
  tag: "AHEAD OF THE CURVE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
