import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "fruit-duel",
  name: "Fruit Duel",
  description: "Slice the fruit. Dodge the decoys.",
  instructions:
    "Tap your half to slice real fruit. Gifts, medals, flowers and empty swings cause a 1.35s cooldown. Simultaneous slices replay. First to 10. Orange: Space; Blue: Enter.",
  color: "#d6bddb",
  accent: "#b693be",
  preview,
  order: 11,
  tag: "A FRUITY FACE-OFF",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
