import type { GameManager } from "../core/GameManager";
import { games } from "../core/GameRegistry";
import { escapeHtml } from "../core/StorageManager";
import { icons } from "../shared/components/icons";

export class MainMenu {
  private section: "duel" | "arcade" = "duel";
  private order: Record<"duel" | "arcade", string[]> = {
    duel: games.filter((g) => (g.category ?? "duel") === "duel").map((g) => g.id),
    arcade: games.filter((g) => g.category === "arcade").map((g) => g.id),
  };
  private catalogIndex = new Map<string, number>();
  private shuffled = false;

  constructor(
    private app: GameManager,
    private root: HTMLElement,
  ) {
    this.order.duel.forEach((id, idx) => this.catalogIndex.set(id, idx + 1));
    this.order.arcade.forEach((id, idx) => this.catalogIndex.set(id, idx + 1));
  }

  private shuffleCurrent() {
    const ids = [...this.order[this.section]];
    if (ids.length > 1) {
      const prev = ids.join(",");
      for (let attempt = 0; attempt < 6; attempt++) {
        for (let i = ids.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        if (ids.join(",") !== prev) break;
      }
      if (ids.join(",") === prev) ids.push(ids.shift()!);
    }
    this.order[this.section] = ids;
    this.shuffled = true;
    this.app.audio.play("capture", 0.78);
    this.render();
    this.shuffled = false;
  }

  render() {
    const scroll = this.root.querySelector(".menu-scroll")?.scrollTop ?? 0;
    const d = this.app.storage.data;
    const p1 = escapeHtml(this.app.storage.playerName(0));
    const p2 = escapeHtml(this.app.storage.playerName(1, false));
    const byId = new Map(games.map((g) => [g.id, g]));
    const available = this.order[this.section]
      .map((id) => byId.get(id))
      .filter((g): g is (typeof games)[number] => !!g);
    const listClass = this.shuffled ? "game-list shuffling" : "game-list";
    const shuffleBtnClass = this.shuffled
      ? "shuffle-button spun"
      : "shuffle-button";
    this.root.innerHTML = `<div class="menu-scroll"><header class="toolbar"><div class="wordmark"><img src="./icon.svg" alt=""/><span>GOOD GAMES.<br>GREAT COMPANY.</span></div><div class="toolbar-actions"><button class="icon-button" data-action="sound" aria-label="${d.sound ? "Mute sound" : "Enable sound"}" aria-pressed="${d.sound}">${d.sound ? icons.sound : icons.muted}</button><button class="icon-button" data-action="settings" aria-label="Settings">${icons.settings}</button></div></header>
      <section class="hero"><span class="hero-spark spark-one">✳</span><span class="hero-spark spark-two">✦</span><div class="eyebrow">A LITTLE FRIENDLY COMPETITION</div><h1><span class="pocket">pocket</span><span class="rivals">rivals<span class="title-dot">.</span></span></h1><p>Little games. Big rivalries.</p><div class="hero-badges"><span>${icons.people} 2 players</span><i></i><span>${icons.hand} 1 screen</span><i></i><span>${icons.offline} All offline</span></div></section>
      <div class="collection-modes"><button class="${this.section === "duel" ? "selected" : ""}" data-action="quick">2 Player Games</button><button class="${this.section === "arcade" ? "selected" : ""}" data-action="arcade">1 Player Arcade</button><button data-action="tournament">${icons.cup} Tournament</button></div>${this.app.tournament.state && this.app.tournament.state.phase !== "complete" ? `<button class="resume-banner" data-action="resume-tournament">Resume tournament <b>${this.app.tournament.state.results.length}/${this.app.tournament.state.plan.length} rounds →</b></button>` : ""}${this.app.savedMatch() ? '<button class="resume-banner" data-action="resume-match">Continue saved game <b>Resume →</b></button>' : ""}<section class="collection" aria-label="Choose a mini-game"><div class="section-label"><div class="section-title"><h2>${this.section === "arcade" ? "A little me time" : "Pick your play"}</h2><span class="section-count">${available.length}</span></div><button class="${shuffleBtnClass}" data-action="shuffle" aria-label="Shuffle game order">${icons.shuffle}<span>Shuffle</span></button></div><div class="${listClass}">${available.map((g, i) => {
      const num = String(this.catalogIndex.get(g.id) ?? i + 1).padStart(2, "0");
      return `<button class="game-card" data-game="${g.id}" style="--card:${g.color};--accent:${g.accent};--delay:${Math.min(i, 8) * 28}ms" aria-label="Play ${g.name}"><span class="card-copy"><span class="card-number">${num}</span><strong>${g.name}</strong><span class="card-description">${g.description}</span></span><span class="card-art">${g.preview}</span></button>`;
    }).join("")}</div></section>
      <p class="menu-note">Made for a little face-to-face time.<span>Pick a side. Pass the phone. Play.</span></p></div>
      ${this.section === "arcade" ? `<footer class="match-dock arcade-dock"><strong>Just you. A new best.</strong><small>Saved on this device.<br>No account needed.</small></footer>` : `<footer class="match-dock" aria-label="Overall match score"><div class="match-scores"><button class="player-block orange" data-action="edit-names" aria-label="Edit player names"><span class="avatar">×</span><span class="player-meta"><strong>${p1}</strong><span class="edit-hint">${icons.edit}</span></span><b data-testid="wins-one">${d.wins[0]}</b></button><div class="versus"><span>VS</span>${d.rounds > 0 ? `<small>${d.rounds}</small>` : ""}</div><button class="player-block blue" data-action="edit-names" aria-label="Edit player names"><b data-testid="wins-two">${d.wins[1]}</b><span class="player-meta"><span class="edit-hint">${icons.edit}</span><strong>${p2}</strong></span><span class="avatar">○</span></button></div></footer>`}`;
    this.root.querySelector(".menu-scroll")!.scrollTop = scroll;
    const bind = (name: string, fn: () => void) => {
      const b = this.root.querySelector<HTMLButtonElement>(
        `[data-action="${name}"]`,
      );
      if (b) b.onclick = fn;
    };
    const switchSection = (section: "duel" | "arcade") => {
      this.app.audio.play("tap", 0.7);
      this.section = section;
      this.render();
      this.root
        .querySelector(".collection-modes")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    bind("quick", () => switchSection("duel"));
    bind("arcade", () => switchSection("arcade"));
    bind("shuffle", () => this.shuffleCurrent());
    bind("tournament", () => {
      this.app.audio.play("tap");
      this.app.openTournament();
    });
    bind("resume-tournament", () => {
      this.app.audio.play("tap");
      this.app.showTournament();
    });
    bind("resume-match", () => this.app.resumeSaved());
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-action="edit-names"]')
      .forEach((b) => (b.onclick = () => this.app.editNames()));
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-game]")
      .forEach((b) => (b.onclick = () => this.app.selectGame(b.dataset.game!)));
    this.root.querySelector<HTMLButtonElement>(
      '[data-action="settings"]',
    )!.onclick = () => {
      this.app.audio.play("tap", 0.7);
      this.app.settings();
    };
    this.root.querySelector<HTMLButtonElement>(
      '[data-action="sound"]',
    )!.onclick = () => {
      this.app.toggleSound();
      this.render();
    };
  }
}
