import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "spike-attacks",
  name: "Spike Attacks",
  description: "Read the warning. Find your cover.",
  instructions:
    "Drag your joystick: Orange below, Blue above. Hide behind blocks to avoid the spikes. Push your rival out of cover; move back against a push to resist. The flashing edge warns before a strike; spikes return to their sockets. Attacks get faster. Last survivor scores; simultaneous hits replay. First to 5 or the lead at 2:00; ties draw. Solo: WASD or arrows. Local: Orange WASD, Blue arrows. Gamepads: left stick or D-pad; first pad Orange, second Blue.",
  color: "#e5dcc5",
  accent: "#a3aaa2",
  preview,
  order: 20,
  tag: "TAKE COVER",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
