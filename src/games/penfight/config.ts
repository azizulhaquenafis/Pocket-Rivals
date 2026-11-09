import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "penfight",
  name: "Penfight",
  description: "One desk. Settle the score.",
  instructions:
    "Pull back on your pen and release to flick. Centre flicks travel farther; tip flicks trade distance for spin. Aim at the rival’s tip to rotate it or its centre to push it. Wait for both pens to stop. Centre off the desk loses; double-outs replay. First to 3 wins. The match is a draw after two minutes; pause stops the clock. 36 shots draw a round; 3 drawn rounds draw the match.",
  color: "#e8ddc5",
  accent: "#c7b58f",
  order: 25,
  tag: "LAST PEN STANDING",
  preview,
  tournament: true,
  supportedModes: ["local-two-player", "single-player"],
  difficultyLabels: ["Easy", "Medium", "Hard"],
} satisfies GameMetadata;
