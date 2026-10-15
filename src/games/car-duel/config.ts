import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "car-duel",
  name: "Car Duel",
  description: "Bump, balance, and protect your driver.",
  instructions:
    "Hold left/right to drive and rotate in the air. Hit the other driver while protecting your head. Head contact with terrain, walls or the rival car loses the round. Simultaneous hits replay. First to 5; four-minute cap uses scores. Orange controls left: A/D. Blue right: arrows.",
  color: "#cddfdb",
  accent: "#aab9a0",
  preview,
  order: 22,
  tag: "HEADS UP",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
