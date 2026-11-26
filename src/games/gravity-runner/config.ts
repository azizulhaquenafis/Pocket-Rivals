import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "gravity-runner",
  name: "Gravity Runner",
  description: "The ceiling is your escape route.",
  instructions:
    "Tap your half to flip gravity and dodge spikes and gaps as speed climbs. Last survivor scores across 3 rounds; highest score wins.",
  desktopControls: {
    ai: ["Space / Arrows / W A S D|Flip gravity"],
    local: [
      "p1|Space / Arrows|Flip gravity",
      "p2|W A S D / Enter|Flip gravity",
    ],
  },
  color: "#e3edc6",
  accent: "#92b875",
  preview,
  order: 18,
  tag: "FLIP THE WORLD",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
