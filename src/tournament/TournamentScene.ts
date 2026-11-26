import type { GameManager } from "../core/GameManager";
import { tournamentGames, getGame } from "../core/GameRegistry";
import { escapeHtml } from "../core/StorageManager";
import { shuffledSchedule } from "../core/TournamentManager";
import { difficultyButtons } from "../scenes/GameSetup";
import type { Difficulty } from "../shared/contracts/AIController";
import type { MatchSpec } from "../shared/contracts/GameModule";
import { icons } from "../shared/components/icons";
export class TournamentScene {
  constructor(private app: GameManager) {}
  setup() {
    let mode: "local" | "ai" = "local",
      difficulty: Difficulty = "medium",
      rounds = 3,
      manual = false;
    const selected = new Set<string>();
    const entries = () =>
      tournamentGames.flatMap((g) =>
        (g.variants ?? [{ id: undefined, name: g.name }])
          .filter(
            (v) =>
              mode === "local" ||
              (g.supportedModes.includes("single-player") &&
                (!("ai" in v) || v.ai !== false)),
          )
          .map((v) => ({
            key: g.id + ":" + (v.id ?? ""),
            name: g.name + (v.id ? " · " + v.name.split(" —")[0] : ""),
            preview: g.preview,
            color: g.color,
            spec: {
              gameId: g.id,
              options: { mode, difficulty, variant: v.id },
            } as MatchSpec,
          })),
      );
    const render = () => {
      const pool = entries();
      const actions: Record<string, () => void> = {
        close: () => {
          this.app.audio.play("tap", 0.65);
          this.app.modal.close();
        },
        ai: () => {
          this.app.audio.play("tap", 0.65);
          mode = "ai";
          render();
        },
        local: () => {
          this.app.audio.play("tap", 0.65);
          mode = "local";
          render();
        },
        random: () => {
          this.app.audio.play("tap", 0.65);
          manual = false;
          render();
        },
        manual: () => {
          this.app.audio.play("tap", 0.65);
          manual = true;
          render();
        },
        start: () => {
          const chosen = pool.filter((e) => !manual || selected.has(e.key));
          if (!chosen.length) return;
          this.app.audio.play("start", 0.75);
          this.app.tournament.create(
            shuffledSchedule(
              chosen.map((e) => e.spec),
              rounds,
            ),
          );
          this.app.showTournament();
        },
      };
      for (const d of ["medium", "hard", "impossible"] as const)
        actions[`difficulty-${d}`] = () => {
          this.app.audio.play("tap", 0.65);
          difficulty = d;
          render();
        };
      for (const e of pool)
        actions[`choose-${e.key}`] = () => {
          this.app.audio.play("tap", 0.55);
          if (selected.has(e.key)) selected.delete(e.key);
          else selected.add(e.key);
          render();
        };
      const pickScroll =
        document.querySelector(".game-picks")?.scrollTop ?? 0;
      const root = this.app.modal.show(
        `<div class="eyebrow">A PROPER LITTLE SHOWDOWN</div><h2 id="dialog-title">Make it a tournament.</h2><div class="segmented players"><button data-action="local" class="${mode === "local" ? "selected" : ""}">2 Players<small>local rivals</small></button><button data-action="ai" class="${mode === "ai" ? "selected" : ""}">1 Player<small>vs Blue AI</small></button></div>${mode === "ai" ? difficultyButtons(difficulty) : ""}<label class="round-control">Number of rounds <select aria-label="Number of rounds">${Array.from({ length: 15 }, (_, i) => `<option value="${i + 1}" ${rounds === i + 1 ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label><div class="segmented"><button data-action="random" class="${!manual ? "selected" : ""}">All games</button><button data-action="manual" class="${manual ? "selected" : ""}">Choose games</button></div>${manual ? `<div class="game-picks">${pool.map((e) => `<button role="checkbox" aria-checked="${selected.has(e.key)}" data-action="choose-${e.key}" class="${selected.has(e.key) ? "selected" : ""}"><span class="pick-label">${selected.has(e.key) ? "✓" : "○"} ${e.name}</span><span class="pick-icon" style="--card:${e.color}" aria-hidden="true">${e.preview}</span></button>`).join("")}</div>` : ""}${this.app.tournament.state ? '<p class="setup-note">Starting a new tournament replaces the saved one.</p>' : ""}<div class="tournament-actions"><button class="primary-button" data-action="start" ${manual && !pool.some((e) => selected.has(e.key)) ? "disabled" : ""}>Start tournament →</button><button class="text-button" data-action="close">Back</button></div>`,
        actions,
        "tournament-setup",
      );
      const picks = root.querySelector<HTMLElement>(".game-picks");
      if (picks) picks.scrollTop = pickScroll;
      root.querySelector("select")!.onchange = (e) => {
        rounds = Number((e.target as HTMLSelectElement).value);
      };
    };
    render();
  }
  show() {
    const s = this.app.tournament.state;
    if (!s) {
      this.setup();
      return;
    }
    const complete = s.phase === "complete";
    const isAi = s.plan[0].options.mode === "ai";
    const p1 = escapeHtml(this.app.storage.playerName(0));
    const p2 = escapeHtml(this.app.storage.playerName(1, isAi));
    const p1Upper = p1.toUpperCase();
    const p2Upper = p2.toUpperCase();
    const champion =
      s.points[0] === s.points[1]
        ? "Two worthy champions."
        : s.points[0] > s.points[1]
          ? `${p1} is the champion!`
          : `${p2} is the champion!`;
    const next = this.app.tournament.current();
    let nextName = "";
    try {
      if (next) nextName = getGame(next.gameId).name;
    } catch {
      nextName = "Unavailable game";
    }
    const last = s.results.at(-1);
    const actions = {
      play: () => this.app.startTournamentRound(),
      menu: () => this.app.goMenu(),
      rematch: () => {
        this.app.tournament.rematch();
        this.app.showTournament();
      },
      new: () => this.setup(),
    };
    this.app.modal.show(
      `<span class="tournament-cup">${icons.cup}</span><div class="eyebrow">${complete ? "THE FINAL SCORE" : `ROUND ${s.results.length + 1} OF ${s.plan.length}`}</div><h2 id="dialog-title">${complete ? champion : last ? (last.winner === "draw" ? "Half a point each." : `${last.winner === 1 ? p1 : p2} wins the round.`) : "Let the rivalry begin."}</h2><div class="tournament-score"><div><small>${p1Upper}</small><b>${s.points[0]}</b></div><span>—</span><div><small>${p2Upper}</small><b>${s.points[1]}</b></div></div><div class="round-dots">${s.plan.map((_, i) => `<i class="${i < s.results.length ? "done" : i === s.results.length ? "current" : ""}"></i>`).join("")}</div>${complete ? "" : `<p>Up next: <b>${nextName}</b>${next?.options.variant ? ` · ${next.options.variant}` : ""}<br>${s.phase === "playing" ? "Your unfinished round is ready to resume." : "One game. One point. Make it count."}</p>`}${s.results.length ? `<div class="round-history">${s.results.map((r, i) => `<span>Round ${i + 1}<b>${r.winner === "draw" ? "Draw · ½ each" : r.winner === 1 ? `${p1} +1` : `${p2} +1`}</b></span>`).join("")}</div>` : ""}<button class="primary-button" data-action="${complete ? "rematch" : "play"}">${complete ? "Tournament rematch" : s.phase === "playing" ? "Resume round" : "Play next round"} →</button><button class="secondary-button" data-action="new">New tournament</button><button class="text-button" data-action="menu">${complete ? "Back to all games" : "Save & return to menu"}</button>`,
      actions,
      "tournament-results",
      () => this.app.goMenu(),
    );
  }
}
