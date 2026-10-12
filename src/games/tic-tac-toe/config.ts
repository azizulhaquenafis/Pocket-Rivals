import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "tic-tac-toe",
  name: "Tic-Tac-Toe",
  description: "The classic battle of wits.",
  instructions:
    "Take turns tapping an empty square. Orange is × and goes first. Blue is ○. Make a row of three to win.",
  color: "#f1b49f",
  accent: "#fae2d8",
  tag: "THINK AHEAD",
  order: 3,
  preview,
  variants:[{id:'classic',name:'Classic — 3×3',description:'The familiar little rivalry.'},{id:'ultimate',name:'Ultimate — 9×9',description:'Nine boards. One big strategy.',hasTutorial:true}],
  supportedModes: ["local-two-player", "single-player"],
} satisfies GameMetadata;
