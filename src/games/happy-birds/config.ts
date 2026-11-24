import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "happy-birds",
  name: "Happy Birds",
  description: "Tiny wings. Fifteen golden stars.",
  instructions:
    "Tap to flap in the shared arena. Birds bounce off safe walls. Avoid spikes; outlined spikes warn before changes. Collect the golden stars: first to 15 wins. A spike hit costs no stars: your bird turns gray, glides back to the middle and regains its color over 3 seconds, then flies again. The other bird keeps playing. Orange: Space or arrow keys. Blue: WASD (Enter/L also work). Solo: Space, arrows or WASD.",
  color: "#c8e7eb",
  accent: "#9ebcc2",
  preview,
  order: 19,
  tag: "CHASE THE STARS",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
