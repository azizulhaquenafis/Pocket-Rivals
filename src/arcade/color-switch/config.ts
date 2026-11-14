import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "color-switch",
    name: "Color Switch",
    description: "A colorful climb. A new shape around every corner.",
    instructions:
      "Tap or Space to hop through your matching color. Drag left/right while touching, or use A/D and arrow keys to steer inside the path. Rotating rings, triangles, squares and moving gates lead through five-stage chapters. Each cleared shape is a safe checkpoint. Three lives.",
    color: "#e2d8ec",
    accent: "#e2d8ec",
    order: 34,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
