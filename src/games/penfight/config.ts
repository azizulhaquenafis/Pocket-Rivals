import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "penfight",
  name: "Penfight",
  description: "One desk. Settle the score.",
  instructions:
    "Pull back on your pen and release to flick—center pushes, tips spin. Knock your rival off the shrinking desk. First to 3 wins.",
  desktopControls: {
    ai: ["Drag|Pull back on pen & release"],
    local: ["Drag|Pull back on active pen & release"],
  },
  color: "#e8ddc5",
  accent: "#c7b58f",
  order: 25,
  tag: "LAST PEN STANDING",
  preview,
  tournament: true,
  supportedModes: ["local-two-player", "single-player"],
} satisfies GameMetadata;
