import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "spike-attacks",
  name: "Spike Attacks",
  description: "Read the warning. Find your cover.",
  instructions:
    "Drag or tap a destination in your arena. Hide behind stones opposite the incoming arrows. Stones absorb spikes. Last survivor scores; simultaneous hits replay. First to 5 wins. Four-minute cap uses round scores. Orange: WASD. Blue: arrows.",
  color: "#e5dcc5",
  accent: "#a3aaa2",
  preview,
  order: 20,
  tag: "TAKE COVER",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
