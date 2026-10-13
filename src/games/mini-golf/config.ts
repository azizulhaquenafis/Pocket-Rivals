import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";
export default {
  id: "mini-golf",
  name: "Mini Golf",
  description: "A small course. A big finish.",
  instructions:
    "Drag back from your ball and release. Take turns; each rival plays their own ball. Lowest total strokes wins. After 12 strokes, pick up for 13.",
  color: "#b8d998",
  accent: "#93c57f",
  preview,
  order: 5,
  tag: "TAKE YOUR BEST SHOT",
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
  variants: [
    {
      id: "five",
      name: "Full tour — 5 holes",
      description: "All five little courses",
    },
    {
      id: "three",
      name: "Short tour — 3 holes",
      description: "A quick round together",
    },
    {
      id: "one",
      name: "Quick putt — 1 hole",
      description: "One course. Every stroke counts.",
    },
  ],
} satisfies GameMetadata;
