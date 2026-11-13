import type { Difficulty } from "../contracts/AIController";
import "./arcade-setup.css";
export interface ArcadeChallenge {
  title: string;
  tiers: readonly [string, string, string];
}
/** Lazy, module-owned overlay. No physics or input starts behind the picker. */
export class ArcadeSetup {
  private root = document.createElement("div");
  constructor(info: ArcadeChallenge, start: (tier: Difficulty) => void) {
    this.root.className = "arcade-setup";
    const panel = document.createElement("section");
    panel.setAttribute("aria-label", `${info.title} difficulty`);
    const title = document.createElement("h2");
    title.textContent = "Pick your challenge";
    panel.append(title);
    for (const [i, tier] of (
      ["medium", "hard", "impossible"] as const
    ).entries()) {
      const button = document.createElement("button");
      button.className = "arcade-tier";
      button.setAttribute("aria-label", tier[0].toUpperCase() + tier.slice(1));
      const name = document.createElement("b");
      name.textContent = tier[0].toUpperCase() + tier.slice(1);
      const detail = document.createElement("span");
      detail.textContent = info.tiers[i];
      button.append(name, detail);
      button.onclick = () => {
        this.destroy();
        start(tier);
      };
      panel.append(button);
    }
    this.root.append(panel);
    document.querySelector("#game-stage")!.append(this.root);
  }
  setPaused(value: boolean) {
    this.root.hidden = value;
  }
  destroy() {
    this.root.querySelectorAll("button").forEach((b) => (b.onclick = null));
    this.root.remove();
  }
}
