import type { GameMetadata } from "../../shared/contracts/GameModule";
import { MAPS, mapPreview } from "./Maps";
import preview from "./assets/preview.svg?raw";
export default {
  id: "gravity-runner",
  name: "Gravity Runner",
  description: "The ceiling is your escape route.",
  instructions:
    "Tap your half to flip between the corridor walls: orange below, blue above. Avoid spikes and gaps. When both walls disappear, land on either face of the middle rail before the gap. Each landscape has its own traps. After 8 seconds, speed rises in smooth stages every 20 seconds. Runs continue until a collision. Last survivor scores; ties replay. First to 5. Orange: Space/A. Blue: Up arrow/Enter/L.",
  color: "#e3edc6",
  accent: "#92b875",
  preview,
  order: 18,
  tag: "FLIP THE WORLD",
  variants: [
    {
      id: "random",
      name: "Random map",
      description: "A new landscape each match.",
      preview: mapPreview(),
    },
    ...MAPS.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.traps,
      preview: mapPreview(m),
    })),
  ],
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
