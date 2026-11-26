import type { Difficulty } from "../../shared/contracts/AIController";
import {
  bindGuideRow,
  renderGuideRow,
  type GuideSwatchItem,
} from "../../shared/components/GuidePanel";
import config from "./config";
import { MAPS, mapPreview, type SnakeMap } from "./Maps";
import "./snake.css";

const SNAKE_GUIDE: readonly GuideSwatchItem[] = [
  {
    label: "Regular Apple (+10)",
    detail: "Eat to grow longer. Every 8 apples completes a +40 harvest bonus.",
    swatch: "#f49b58",
  },
  {
    label: "Special Golden Apple (+30)",
    detail:
      "Spawns every 4 apples with a shrinking timer ring—grab it before the ring fades!",
    swatch: "#f4cc60",
  },
  {
    label: "Walls & Islands",
    detail: "Avoid border walls, stone islands, and your own growing tail.",
    swatch: "#6a7b6e",
  },
];

/** Module-owned setup; no global modal or listener survives disposal. */
export class SnakeSetup {
  private root = document.createElement("div");
  private selected = "random";
  private difficulty: Difficulty = "medium";
  private cleanupGuide?: () => void;
  constructor(private start: (map: SnakeMap, difficulty: Difficulty) => void) {
    this.root.className = "snake-setup";
    document.querySelector("#game-stage")!.append(this.root);
    this.render();
  }
  private render() {
    this.cleanupGuide?.();
    const guideHtml = renderGuideRow({
      instructions: config.instructions,
      guide: SNAKE_GUIDE,
      controls: config.desktopControls?.ai,
    });
    this.root.innerHTML = `<section class="snake-setup-panel" aria-label="Snake setup"><h2>Pick your garden</h2><div class="snake-maps">${[{ id: "random", name: "Surprise me", art: mapPreview(MAPS[0]) }, ...MAPS.map((m) => ({ id: m.id, name: m.name, art: mapPreview(m) }))].map((m) => `<button data-map="${m.id}" aria-pressed="${this.selected === m.id}">${m.art}<b>${m.name}</b></button>`).join("")}</div><div class="snake-tiers" role="radiogroup" aria-label="Snake difficulty">${(["medium", "hard", "impossible"] as const).map((d) => `<button role="radio" aria-checked="${this.difficulty === d}" data-tier="${d}">${d[0].toUpperCase() + d.slice(1)}</button>`).join("")}</div><button class="primary-button" data-start>Play →</button>${guideHtml}</section>`;
    const stage = document.querySelector<HTMLElement>("#game-stage")!;
    this.cleanupGuide = bindGuideRow(this.root, stage);
    this.root.onclick = (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!b) return;
      if (b.dataset.map) {
        this.selected = b.dataset.map;
        this.render();
      } else if (b.dataset.tier) {
        this.difficulty = b.dataset.tier as Difficulty;
        this.render();
      } else if (b.hasAttribute("data-start")) {
        const map =
          this.selected === "random"
            ? MAPS[Math.floor(Math.random() * MAPS.length)]
            : MAPS.find((m) => m.id === this.selected)!;
        this.destroy();
        this.start(map, this.difficulty);
      }
    };
  }
  destroy() {
    this.cleanupGuide?.();
    this.cleanupGuide = undefined;
    this.root.onclick = null;
    this.root.remove();
  }
}
