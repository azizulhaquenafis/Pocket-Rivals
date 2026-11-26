import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "happy-birds",
  name: "Happy Birds",
  description: "Tiny wings. Fifteen golden stars.",
  instructions:
    "Tap to flap, bounce off safe walls, dodge shifting spikes, and grab golden stars. Spike hits pause you for 3s without losing stars. First to 15 wins.",
  desktopControls: {
    ai: ["Space / Arrows / W A S D|Flap"],
    local: ["p1|Space / Arrows|Flap", "p2|W A S D / Enter|Flap"],
  },
  color: "#c8e7eb",
  accent: "#9ebcc2",
  preview,
  order: 19,
  tag: "CHASE THE STARS",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
