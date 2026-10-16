import type { GameMetadata } from "../../shared/contracts/GameModule";
import { mapPreview } from "./MapPreview";
import { MAPS } from "./Maps";
import preview from "./assets/preview.svg?raw";
export default {
  id: "spike-attacks",
  name: "Spike Attacks",
  description: "Read the warning. Find your cover.",
  instructions:
    "Drag your joystick: Orange below, Blue above. Hide behind blocks to avoid the spikes. The flashing edge warns before a strike; spikes return to their sockets. Attacks get faster. Last survivor scores; simultaneous hits replay. First to 5 or the lead at 2:00; ties draw. Solo: WASD or arrows. Local: Orange WASD, Blue arrows. Gamepads: left stick or D-pad; first pad Orange, second Blue.",
  color: "#e5dcc5",
  accent: "#a3aaa2",
  preview,
  order: 20,
  tag: "TAKE COVER",
  variants: [
    {
      id: "random",
      name: "Random map",
      description: "A fresh arena each match.",
      preview: mapPreview(),
    },
    ...MAPS.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      preview: mapPreview(m),
    })),
  ],
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
