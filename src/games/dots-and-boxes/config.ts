import type { GameMetadata } from "../../shared/contracts/GameModule";
import preview from "./assets/preview.svg?raw";

const preview4x4 = `<svg width="34" height="34" viewBox="0 0 34 34" fill="none"><rect x="11" y="11" width="6" height="6" rx="1.2" fill="#f49b58"/><rect x="17" y="17" width="6" height="6" rx="1.2" fill="#58addb"/><path d="M11 11h12M11 17h12M17 23h6M11 11v12M17 11v12M23 11v12" stroke="#242b32" stroke-width="1.5" stroke-linecap="round"/><path d="M5 5h24M5 11h24M5 17h24M5 23h24M5 29h24" stroke="#242b32" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="0 6"/></svg>`;

const preview5x5 = `<svg width="34" height="34" viewBox="0 0 34 34" fill="none"><rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="#f49b58"/><rect x="19.5" y="14.5" width="5" height="5" rx="1" fill="#58addb"/><path d="M9.5 9.5h5M9.5 14.5h5M9.5 9.5v5M14.5 9.5v5M19.5 14.5h5M19.5 19.5h5M19.5 14.5v5M24.5 14.5v5" stroke="#242b32" stroke-width="1.3" stroke-linecap="round"/><path d="M4.5 4.5h25M4.5 9.5h25M4.5 14.5h25M4.5 19.5h25M4.5 24.5h25M4.5 29.5h25" stroke="#242b32" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="0 5"/></svg>`;

const preview6x6 = `<svg width="34" height="34" viewBox="0 0 34 34" fill="none"><rect x="8" y="12" width="4" height="4" rx="0.8" fill="#f49b58"/><rect x="16" y="16" width="4" height="4" rx="0.8" fill="#58addb"/><path d="M8 12h4M8 16h4M8 12v4M12 12v4M16 16h4M16 20h4M16 16v4M20 16v4" stroke="#242b32" stroke-width="1.2" stroke-linecap="round"/><path d="M4 4h24M4 8h24M4 12h24M4 16h24M4 20h24M4 24h24M4 28h24" stroke="#242b32" stroke-width="2" stroke-linecap="round" stroke-dasharray="0 4"/></svg>`;

export default {
  id: "dots-and-boxes",
  name: "Dots and Boxes",
  description: "Join the dots. Claim your corner.",
  instructions:
    "Tap between two neighboring dots to draw a line. Complete a box to claim it and play again. One line can claim two boxes. Most boxes wins. On desktop, use arrows and Enter to select a line.",
  color: "#e7ddef",
  accent: "#b6a2c5",
  preview,
  order: 8,
  tag: "CONNECT. COLLECT.",
  variants: [
    {
      id: "4x4",
      name: "4×4",
      description: "16 boxes · Fast",
      preview: preview4x4,
    },
    {
      id: "5x5",
      name: "5×5",
      description: "25 boxes · Classic",
      preview: preview5x5,
    },
    {
      id: "6x6",
      name: "6×6",
      description: "36 boxes · Epic",
      preview: preview6x6,
    },
  ],
  supportedModes: ["local-two-player", "single-player"],
  tournament: true,
} satisfies GameMetadata;
