import type { GameMetadata } from "../../shared/contracts/GameModule";
import image from "./assets/preview.svg?url&no-inline";
const preview = `<img src="${image}" alt="" loading="lazy" decoding="async"/>`;
export default {
  ...{
    id: "orbit-hop",
    name: "Orbit Hop",
    description: "A small leap through space.",
    instructions:
      "Tap/Space to launch tangentially. Medium shows a smooth curved flight guide. 25 planet types vary in volume and density — high-volume giants offer huge targets and wide halos, while high-density cores pull much harder inside tighter rings. Enter a halo so gravity curves you onto the surface. Three hearts.",
    color: "#d8cde8",
    accent: "#d8cde8",
    order: 32,
    tag: "SOLO ARCADE",
    category: "arcade",
    tournament: false,
    supportedModes: ["single-player"],
  },
  preview,
} satisfies GameMetadata;
