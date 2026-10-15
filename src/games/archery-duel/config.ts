import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "archery-duel",
  name: "Archery Duel",
  description: "Lock your aim. Let it fly.",
  instructions:
    "Three taps: start horizontal aiming, lock X, then lock Y and fire. Large target: 1 point. Small: 2. First to 10 wins. At three minutes, higher score wins; ties draw. Orange: Space/A. Blue: Enter/L.",
  color: "#dbe8cf",
  accent: "#a6b998",
  preview,
  order: 17,
  tag: "AIM TRUE",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
