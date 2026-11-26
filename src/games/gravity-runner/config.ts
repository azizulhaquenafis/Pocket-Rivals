import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  id: "gravity-runner",
  name: "Gravity Runner",
  description: "The ceiling is your escape route.",
  instructions:
    "Tap your half to flip between the corridor walls: orange below, blue above. Avoid spikes and gaps. When both walls disappear, land on either face of the middle rail before the gap. A different random landscape is chosen each round. Speed climbs steeply over time. Three rounds total, up to 2 minutes each. Last survivor scores; simultaneous falls or two survivors at the deadline draw that round with no replacement round. Highest score after 3 rounds wins. Orange: Space or arrow keys. Blue: WASD or Enter.",
  color: "#e3edc6",
  accent: "#92b875",
  preview,
  order: 18,
  tag: "FLIP THE WORLD",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
