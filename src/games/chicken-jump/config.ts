import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "chicken-jump",
  name: "Chicken Jump",
  description: "One tap. One block. A taller tower.",
  instructions:
    "Tap when the sliding block is under your chicken. Land to stack a point; a miss retries that height. First to 10 wins. Three-minute cap: highest stack wins, equal stacks draw. Orange: Space/A. Blue: Enter/L.",
  color: "#f6e6b8",
  accent: "#c6ad85",
  preview,
  order: 16,
  tag: "STACK & HOP",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
