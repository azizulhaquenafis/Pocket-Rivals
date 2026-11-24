import type { Difficulty } from "../../shared/contracts/AIController";
import { MAPS, mapPreview, type SnakeMap } from "./Maps";
import "./snake.css";
/** Module-owned setup; no global modal or listener survives disposal. */
export class SnakeSetup {
  private root = document.createElement("div");
  private selected = "random";
  private difficulty: Difficulty = "medium";
  constructor(private start: (map: SnakeMap, difficulty: Difficulty) => void) {
    this.root.className = "snake-setup";
    document.querySelector("#game-stage")!.append(this.root);
    this.render();
  }
  private render() {
    this.root.innerHTML = `<section class="snake-setup-panel" aria-label="Snake setup"><h2>Pick your garden</h2><div class="snake-maps">${[{ id: "random", name: "Surprise me", art: mapPreview(MAPS[0]) }, ...MAPS.map((m) => ({ id: m.id, name: m.name, art: mapPreview(m) }))].map((m) => `<button data-map="${m.id}" aria-pressed="${this.selected === m.id}">${m.art}<b>${m.name}</b></button>`).join("")}</div><div class="snake-tiers" role="radiogroup" aria-label="Snake difficulty">${(["medium", "hard", "impossible"] as const).map((d) => `<button role="radio" aria-checked="${this.difficulty === d}" data-tier="${d}">${d[0].toUpperCase() + d.slice(1)}</button>`).join("")}</div><button class="primary-button" data-start>Play →</button><details><summary>How to play</summary><p>Arrows or WASD, swipe, or use the pad. Avoid your tail, walls and islands. Harvest 8 fruit for a 40-point bonus; catch golden fruit for 30.</p></details></section>`;
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
    this.root.onclick = null;
    this.root.remove();
  }
}
