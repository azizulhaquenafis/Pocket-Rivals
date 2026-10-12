import type { GameManager } from "../core/GameManager";
import { games } from "../core/GameRegistry";
import { icons } from "../shared/components/icons";
export class MainMenu {
  constructor(
    private app: GameManager,
    private root: HTMLElement,
  ) {}
  render() {
    const d = this.app.storage.data;
    this.root.innerHTML = `<div class="menu-scroll"><header class="toolbar"><div class="wordmark"><img src="./icon.svg" alt=""/><span>GOOD GAMES.<br>GREAT COMPANY.</span></div><div class="toolbar-actions"><button class="icon-button" data-action="sound" aria-label="${d.sound ? "Mute sound" : "Enable sound"}" aria-pressed="${d.sound}">${d.sound ? icons.sound : icons.muted}</button><button class="icon-button" data-action="settings" aria-label="Settings">${icons.settings}</button></div></header>
      <section class="hero"><span class="hero-spark spark-one">✳</span><span class="hero-spark spark-two">✦</span><div class="eyebrow">A LITTLE FRIENDLY COMPETITION</div><h1><span class="pocket">pocket</span><span class="rivals">rivals<span class="title-dot">.</span></span></h1><p>Little games. Big rivalries.</p><div class="hero-badges"><span>${icons.people} 2 players</span><i></i><span>${icons.hand} 1 screen</span><i></i><span>${icons.offline} All offline</span></div></section>
      <div class="collection-modes"><button class="selected" data-action="quick">Quick Play</button><button data-action="tournament">${icons.cup} Tournament</button></div>${this.app.tournament.state&&this.app.tournament.state.phase!=='complete'?`<button class="resume-banner" data-action="resume-tournament">Resume tournament <b>${this.app.tournament.state.results.length}/${this.app.tournament.state.plan.length} rounds →</b></button>`:''}${this.app.savedMatch()?'<button class="resume-banner" data-action="resume-match">Continue saved board <b>Resume →</b></button>':''}<section class="collection" aria-label="Choose a mini-game"><div class="section-label"><h2>Pick your play</h2><span>${games.length === 3 ? "THE ORIGINAL THREE" : `${games.length} LITTLE RIVALRIES`} <b>↓</b></span></div><div class="game-list">${games.map((g, i) => `<button class="game-card" data-game="${g.id}" style="--card:${g.color};--accent:${g.accent};--delay:${i * 60}ms" aria-label="Play ${g.name}"><span class="card-copy"><span class="card-tag"><span class="tiny-dot"></span>${g.tag}</span><strong>${g.name.split(/[ -]+/).join("<br>")}</strong><span class="card-description">${g.description}</span></span><span class="card-art">${g.preview}</span><span class="play-circle">${icons.arrow}</span><span class="card-number">0${i + 1}</span></button>`).join("")}</div></section>
      <p class="menu-note">Made for a little face-to-face time.<span>Pick a side. Pass the phone. Play.</span></p></div>
      <footer class="match-dock" aria-label="Overall match score"><div class="dock-caption"><span class="live-dot"></span>THE FRIENDLY SCOREBOARD<span class="match-count">${d.rounds} ${d.rounds === 1 ? "MATCH" : "MATCHES"}</span></div><div class="match-scores"><div class="player-block orange"><span class="avatar">×</span><div><strong>ORANGE</strong><span>Player 1</span></div><b data-testid="wins-one">${d.wins[0]}</b></div><span class="versus">VS</span><div class="player-block blue"><b data-testid="wins-two">${d.wins[1]}</b><div><strong>BLUE</strong><span>Player 2</span></div><span class="avatar">○</span></div></div></footer>`;
    const bind=(name:string,fn:()=>void)=>{const b=this.root.querySelector<HTMLButtonElement>(`[data-action="${name}"]`);if(b)b.onclick=fn;};
    bind('quick',()=>this.root.querySelector('.collection')?.scrollIntoView({behavior:'smooth'}));bind('tournament',()=>this.app.openTournament());bind('resume-tournament',()=>this.app.showTournament());bind('resume-match',()=>this.app.resumeSaved());
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-game]")
      .forEach((b) => (b.onclick = () => this.app.selectGame(b.dataset.game!)));
    this.root.querySelector<HTMLButtonElement>(
      '[data-action="settings"]',
    )!.onclick = () => this.app.settings();
    this.root.querySelector<HTMLButtonElement>(
      '[data-action="sound"]',
    )!.onclick = () => {
      this.app.toggleSound();
      this.render();
    };
  }
}
