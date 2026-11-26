import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "spike-attacks",
  name: "Spike Attacks",
  description: "Read the warning. Find your cover.",
  instructions:
    "Move behind blocks before the warned edge strikes with spikes, and shove your rival out of cover. First to 5 or the lead at 2:00 wins.",
  desktopControls: {
    ai: ["← → ↑ ↓ / W A S D|Move"],
    local: ["p1|← → ↑ ↓|Move", "p2|W A S D|Move"],
  },
  color: "#e5dcc5",
  accent: "#a3aaa2",
  preview,
  order: 20,
  tag: "TAKE COVER",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
