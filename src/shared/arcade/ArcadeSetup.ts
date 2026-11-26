import type { Difficulty } from "../contracts/AIController";
import { bindGuideRow, renderGuideRow } from "../components/GuidePanel";
import "./arcade-setup.css";

export interface ArcadeGuideItem {
  label: string;
  detail: string;
  swatch?: string;
}

export interface ArcadeChallenge {
  title: string;
  instructions?: string;
  guideTitle?: string;
  guide?: readonly ArcadeGuideItem[];
  desktopControls?: readonly string[];
  tiers: readonly [string, string, string];
}

/** Lazy, module-owned overlay. No physics or input starts behind the picker. */
export class ArcadeSetup {
  private root = document.createElement("div");
  private cleanupGuide?: () => void;
  constructor(info: ArcadeChallenge, start: (tier: Difficulty) => void) {
    this.root.className = "arcade-setup";
    const panel = document.createElement("section");
    panel.setAttribute("aria-label", `${info.title} difficulty`);
    const title = document.createElement("h2");
    title.textContent = "Pick your challenge";
    panel.append(title);

    const guideHtml = renderGuideRow({
      instructions: info.instructions,
      guideTitle: info.guideTitle ?? "How to play",
      guide: info.guide,
      controls: info.desktopControls,
    });
    if (guideHtml) {
      const holder = document.createElement("div");
      holder.innerHTML = guideHtml;
      panel.append(holder.firstElementChild!);
    }

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
    const stage = document.querySelector<HTMLElement>("#game-stage")!;
    stage.append(this.root);
    this.cleanupGuide = bindGuideRow(panel, stage);
  }
  setPaused(value: boolean) {
    if (value) this.cleanupGuide?.();
    this.root.hidden = value;
  }
  destroy() {
    this.cleanupGuide?.();
    this.cleanupGuide = undefined;
    this.root.querySelectorAll("button").forEach((b) => (b.onclick = null));
    this.root.remove();
  }
}
