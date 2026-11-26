import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "math-quiz",
  name: "Math Quiz",
  description: "Quick minds. Friendly competition.",
  instructions:
    "Answer faster than your rival. Correct answers score a point; wrong answers gift your rival a point. First to 10 wins.",
  desktopControls: {
    ai: ["← ↓ → / 1 2 3 / A S D|Choose answer"],
    local: ["p1|← ↓ → / 1 2 3|Choose answer", "p2|A S D / 7 8 9|Choose answer"],
  },
  color: "#dce7f2",
  accent: "#a4bad3",
  preview,
  order: 12,
  tag: "THINK FAST",
  variants: [
    { id: "basic", name: "Basic Arithmetic", description: "" },
    { id: "university", name: "University Challenge", description: "" },
  ],
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
