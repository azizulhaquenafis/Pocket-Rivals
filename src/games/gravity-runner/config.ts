import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "gravity-runner",
  name: "Gravity Runner",
  description: "The ceiling is your escape route.",
  instructions:
    "Tap your half to flip between the corridor walls: orange below, blue above. Avoid spikes and gaps. When both walls disappear, land on either face of the middle rail before the gap. A different random landscape is chosen each round. Watch sliding traps, cross-track movers and warning lights on retracting wall pistons. Each landscape has its own traps. After 8 seconds, speed rises in smooth stages every 20 seconds. Each round lasts up to 2 minutes. Last survivor scores; simultaneous falls or two survivors at the deadline replay without a point. First to 3. Orange: Space or arrow keys. Blue: WASD or Enter.",
  color: "#e3edc6",
  accent: "#92b875",
  preview,
  order: 18,
  tag: "FLIP THE WORLD",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
