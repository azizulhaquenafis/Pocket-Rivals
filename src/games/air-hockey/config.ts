import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "air-hockey",
  name: "Air Hockey",
  description: "Slide. Strike. Settle the score.",
  instructions:
    "Drag your mallet on your half to shoot the puck into the opposite goal. First to 5 or the lead after 2 minutes wins. Don’t stall: 15s on your side gives a rival point.",
  desktopControls: {
    ai: ["← → ↑ ↓ / W A S D|Move mallet"],
    local: ["p1|← → ↑ ↓|Move mallet", "p2|W A S D|Move mallet"],
  },
  color: "#a8d6e1",
  accent: "#e0f0f2",
  tag: "FAST & FURIOUS",
  order: 2,
  preview,
  supportedModes: ["local-two-player", "single-player"],
} satisfies GameMetadata;
