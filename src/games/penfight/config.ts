import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "penfight",
  name: "Penfight",
  description: "One desk. Settle the score.",
  instructions:
    "Pull back on your pen and release. Centre flicks push; tip flicks spin. The dotted path previews the flick. Both opening flicks have a power cap. A pen’s centre crossing the desk edge is out. The edge moves inward after 6 and 12 flicks. At 18, the better attacker wins by how far they pushed their rival toward the edge. Ties replay. First to 3 wins, or lead when time runs out.",
  color: "#e8ddc5",
  accent: "#c7b58f",
  order: 25,
  tag: "LAST PEN STANDING",
  preview,
  tournament: true,
  supportedModes: ["local-two-player", "single-player"],
  difficultyLabels: ["Easy", "Medium", "Hard"],
} satisfies GameMetadata;
