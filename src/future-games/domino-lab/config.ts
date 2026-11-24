import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
export default {
  id: "domino-lab",
  name: "Domino Lab",
  description: "One push. A perfect chain.",
  instructions:
    "Tap to place dominoes in order from the blue starter to the gold finish. Keep them within reach and avoid blocks. Topple to test. Undo/Clear adjust your plan. Arrows move the cursor, Space places, Enter topples, Backspace undoes. Six puzzles.",
  color: "#e5e5cf",
  accent: "#e5e5cf",
  order: 45,
  tag: "SOLO ARCADE",
  category: "arcade",
  tournament: false,
  supportedModes: ["single-player"],
  preview: `<img src="${image}" alt="" loading="lazy" decoding="async"/>`,
} satisfies GameMetadata;
