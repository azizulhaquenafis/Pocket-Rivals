import type { GameManager } from "../core/GameManager";
import { tournamentGames, getGame } from "../core/GameRegistry";
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
            spec: {
              gameId: g.id,
              options: { mode, difficulty, variant: v.id },
            } as MatchSpec,
          })),
      );
    const render = () => {
      const pool = entries();
      const actions: Record<string, () => void> = {
        close: () => this.app.modal.close(),
        ai: () => {
          mode = "ai";
          render();
        },
        local: () => {
          mode = "local";
          render();
        },
        random: () => {
          manual = false;
          render();
        },
        manual: () => {
          manual = true;
          render();
        },
        start: () => {
          const chosen = pool.filter((e) => !manual || selected.has(e.key));
          if (!chosen.length) return;
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
          difficulty = d;
          render();
        };
      for (const e of pool)
        actions[`choose-${e.key}`] = () => {
          if (selected.has(e.key)) selected.delete(e.key);
          else selected.add(e.key);
          render();
        };
      const root = this.app.modal.show(
        `<div class="eyebrow">A PROPER LITTLE SHOWDOWN</div><h2 id="dialog-title">Make it a tournament.</h2><div class="segmented players"><button data-action="local" class="${mode === "local" ? "selected" : ""}">2 Players<small>local rivals</small></button><button data-action="ai" class="${mode === "ai" ? "selected" : ""}">1 Player<small>vs Blue AI</small></button></div>${mode === "ai" ? difficultyButtons(difficulty) : ""}<label class="round-control">Number of rounds <select aria-label="Number of rounds">${Array.from({ length: 15 }, (_, i) => `<option value="${i + 1}" ${rounds === i + 1 ? "selected" : ""}>${i + 1}</option>`).join("")}</select></label><div class="segmented"><button data-action="random" class="${!manual ? "selected" : ""}">All games</button><button data-action="manual" class="${manual ? "selected" : ""}">Choose games</button></div>${manual ? `<div class="game-picks">${pool.map((e) => `<button role="checkbox" aria-checked="${selected.has(e.key)}" data-action="choose-${e.key}" class="${selected.has(e.key) ? "selected" : ""}">${selected.has(e.key) ? "✓" : "○"} ${e.name}</button>`).join("")}</div>` : ""}<p class="setup-note">Shuffled rounds. One point per win.<br>Draws give ½ point to each rival.${this.app.tournament.state ? "<br>Starting a new tournament replaces the saved one." : ""}</p><button class="primary-button" data-action="start" ${manual && !pool.some((e) => selected.has(e.key)) ? "disabled" : ""}>Start tournament →</button><button class="text-button" data-action="close">Back</button>`,
        actions,
        "tournament-setup",
      );
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
    const complete = s.phase === "complete",
      blue = s.plan[0].options.mode === "ai" ? "BLUE AI" : "BLUE";
    const champion =
      s.points[0] === s.points[1]
        ? "Two worthy champions."
        : s.points[0] > s.points[1]
          ? "Orange is the champion!"
          : `${blue === "BLUE AI" ? "Blue AI" : "Blue"} is the champion!`;
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
      `<span class="tournament-cup">${icons.cup}</span><div class="eyebrow">${complete ? "THE FINAL SCORE" : `ROUND ${s.results.length + 1} OF ${s.plan.length}`}</div><h2 id="dialog-title">${complete ? champion : last ? (last.winner === "draw" ? "Half a point each." : `${last.winner === 1 ? "Orange" : blue === "BLUE AI" ? "Blue AI" : "Blue"} wins the round.`) : "Let the rivalry begin."}</h2><div class="tournament-score"><div><small>ORANGE</small><b>${s.points[0]}</b></div><span>—</span><div><small>${blue}</small><b>${s.points[1]}</b></div></div><div class="round-dots">${s.plan.map((_, i) => `<i class="${i < s.results.length ? "done" : i === s.results.length ? "current" : ""}"></i>`).join("")}</div>${complete ? "" : `<p>Up next: <b>${nextName}</b>${next?.options.variant ? ` · ${next.options.variant}` : ""}<br>${s.phase === "playing" ? "Your unfinished round is ready to resume." : "One game. One point. Make it count."}</p>`}${s.results.length ? `<div class="round-history">${s.results.map((r, i) => `<span>Round ${i + 1}<b>${r.winner === "draw" ? "Draw · ½ each" : r.winner === 1 ? "Orange +1" : blue + " +1"}</b></span>`).join("")}</div>` : ""}<button class="primary-button" data-action="${complete ? "rematch" : "play"}">${complete ? "Tournament rematch" : s.phase === "playing" ? "Resume round" : "Play next round"} →</button><button class="secondary-button" data-action="new">New tournament</button><button class="text-button" data-action="menu">${complete ? "Back to all games" : "Save & return to menu"}</button>`,
      actions,
      "tournament-results",
      () => this.app.goMenu(),
    );
  }
}
