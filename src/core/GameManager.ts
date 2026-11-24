import { preloadGame } from "./GameLoader";
import { Diagnostics } from "./Diagnostics";
import { ArcadeScoreManager } from "./ArcadeScoreManager";
import Phaser from "phaser";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StorageManager } from "./StorageManager";
import { ScoreManager } from "./ScoreManager";
import { AudioManager } from "./AudioManager";
import { TournamentManager } from "./TournamentManager";
import { GameHost } from "../scenes/GameHost";
import { MainMenu } from "../scenes/MainMenu";
import { GameSetup } from "../scenes/GameSetup";
import { TournamentScene } from "../tournament/TournamentScene";
import { Modal } from "../shared/components/Modal";
import { resultsContent } from "../scenes/Results";
import { getGame } from "./GameRegistry";
import {
  defaultOptions,
  type MatchOptions,
  type MatchSpec,
  type GameResult,
} from "../shared/contracts/GameModule";
const MATCH_KEY = "pocket-rivals.match.v1";
export class GameManager {
  readonly diagnostics = new Diagnostics();
  readonly arcade: ArcadeScoreManager;
  readonly storage: StorageManager;
  readonly scores: ScoreManager;
  readonly audio: AudioManager;
  readonly tournament: TournamentManager;
  readonly modal = new Modal();
  readonly renderScale = Math.min(window.devicePixelRatio || 1, 2);
  readonly host: GameHost;
  readonly game: Phaser.Game;
  private markHostReady!: () => void;
  private hostReady = new Promise<void>((resolve) => {
    this.markHostReady = resolve;
  });
  private loadingTimer?: number;
  private transition = document.createElement("div");
  private menu: MainMenu;
  private tournamentView: TournamentScene;
  private active: MatchSpec | null = null;
  private token: string | null = null;
  private run = 0;
  private state: "menu" | "playing" | "paused" | "results" | "loading" = "menu";
  private helpOpen = false;
  private menuRoot = document.querySelector<HTMLElement>("#menu")!;
  private disposers: (() => void)[] = [];
  constructor() {
    let storage: Storage | undefined;
    try {
      storage = localStorage;
    } catch {}
    this.storage = new StorageManager(storage);
    this.scores = new ScoreManager(this.storage);
    this.arcade = new ArcadeScoreManager(this.storage);
    this.audio = new AudioManager(this.storage);
    this.tournament = new TournamentManager(this.storage);
    this.tournamentView = new TournamentScene(this);
    this.host = new GameHost(this);
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game-stage",
      width: 420 * this.renderScale,
      height: 760 * this.renderScale,
      backgroundColor: "#f8f5eb",
      antialias: true,
      roundPixels: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: false,
        resizeInterval: 50,
      },
      input: { activePointers: 4 },
      fps: { target: 60, smoothStep: true },
      render: { powerPreference: "high-performance" },
      callbacks: {
        postBoot: (game) => {
          game.scene.add("GameHost", this.host, false);
          this.markHostReady();
          // postBoot precedes loop.start: sleeping here would be undone by Phaser.
          game.events.once(Phaser.Core.Events.POST_RENDER, () => {
            if (this.state === "menu") game.loop.sleep();
          });
        },
      },
    });
    const resize = new ResizeObserver(() => {
      if (this.game.isBooted) {
        this.resizeGame();
        this.host.controls?.clear();
      }
    });
    resize.observe(document.querySelector("#game-stage")!);
    this.disposers.push(() => resize.disconnect());
    this.transition.className = "game-transition";
    this.transition.innerHTML =
      '<span class="transition-mark">p<span>r.</span></span><b>One little moment…</b><button class="text-button">Back to games</button>';
    this.transition.querySelector("button")!.onclick = () => this.goMenu();
    this.transition.hidden = true;
    document.querySelector("#app")!.append(this.transition);
    this.menu = new MainMenu(this, this.menuRoot);
    this.menu.render();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.back();
      } else if (
        !e.repeat &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        (e.code === "KeyH" || e.key.toLowerCase() === "h")
      ) {
        const target = e.target as HTMLElement | null;
        const editing =
          !!target &&
          (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
        if (!editing) this.handleHelpKey(e);
      }
      this.modal.trapFocus(e);
    };
    const visibility = () => {
      if (document.hidden) this.background();
    };
    const blur = () => this.background();
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    this.disposers.push(
      () => window.removeEventListener("keydown", key),
      () => document.removeEventListener("visibilitychange", visibility),
      () => window.removeEventListener("blur", blur),
    );
    if (Capacitor.isNativePlatform()) void this.nativeLifecycle();
  }
  private async nativeLifecycle() {
    const back = await App.addListener("backButton", () => {
      if (this.state === "menu" && !this.modal.isOpen)
        this.modal.show(
          '<h2 id="dialog-title">Calling it a day?</h2><p>Your progress is saved.</p><button class="primary-button" data-action="stay">Keep playing</button><button class="text-button" data-action="exit">Close Pocket Rivals</button>',
          { stay: () => this.modal.close(), exit: () => void App.exitApp() },
        );
      else this.back();
    });
    const state = await App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) this.background();
    });
    this.disposers.push(
      () => void back.remove(),
      () => void state.remove(),
    );
    await SplashScreen.hide();
  }
  selectGame(id: string) {
    if (
      getGame(id).category === "arcade" ||
      getGame(id).presentation === "custom"
    ) {
      void this.play(id);
      return;
    }
    void preloadGame(id).catch(() => {});
    this.audio.play("tap");
    new GameSetup(this.modal, (options) => void this.play(id, options)).open(
      getGame(id),
    );
  }
  async play(
    id: string,
    options: MatchOptions = defaultOptions(),
    restoredState?: unknown,
    token: string | null = null,
  ) {
    const meta = getGame(id);
    if (options.mode === "ai" && !meta.supportedModes.includes("single-player"))
      throw Error("AI is unavailable for this game");
    this.audio.play("tap");
    this.modal.close();
    this.active = { gameId: id, options: structuredClone(options) };
    this.token = token;
    this.helpOpen = false;
    this.state = "loading";
    this.scores.beginRound();
    const run = ++this.run;
    if (!token && !restoredState) this.storage.writeRecord(MATCH_KEY, null);
    this.transition.hidden = false;
    this.watchLoading();
    // Fetch while the renderer boots, but never start an unregistered scene.
    void preloadGame(id).catch(() => {});
    await this.hostReady;
    if (run !== this.run) return;
    this.game.loop.wake();
    this.resizeGame();
    if (this.game.scene.isActive("GameHost")) this.game.scene.stop("GameHost");
    this.game.scene.start("GameHost", {
      id,
      options,
      restoredState,
      run: this.run,
    });
    // The user may have paused while renderer boot was pending.
    if (this.state !== "loading") this.host.pauseGame();
  }
  private clearLoading() {
    window.clearTimeout(this.loadingTimer);
    this.loadingTimer = undefined;
  }
  private watchLoading() {
    this.clearLoading();
    const run = this.run;
    this.loadingTimer = window.setTimeout(() => {
      if (run === this.run && this.state === "loading" && !document.hidden)
        this.showError(
          new Error("The game download did not finish. Please retry."),
        );
    }, 12000);
  }
  private resizeGame() {
    const responsive = this.active && getGame(this.active.gameId).responsive;
    const rect = document.querySelector("#game-stage")!.getBoundingClientRect();
    const width = responsive ? Math.max(1, rect.width) : 420;
    const height = responsive ? Math.max(1, rect.height) : 760;
    this.game.scale.setGameSize(
      width * this.renderScale,
      height * this.renderScale,
    );
    this.game.scale.getParentBounds();
    this.game.scale.refresh();
    this.host.module?.resize?.(width, height);
  }
  onReady(run: number) {
    if (run !== this.run) return;
    this.clearLoading();
    this.menuRoot.hidden = true;
    document.querySelector("#app")!.classList.add("in-game");
    this.transition.hidden = true;
    if (this.state === "loading") {
      this.state = "playing";
      if (document.hidden) this.background();
    }
  }
  checkpoint(run: number, data: unknown) {
    if (
      run !== this.run ||
      !this.active ||
      !["playing", "loading"].includes(this.state)
    )
      return;
    if (this.token) this.tournament.checkpoint(this.token, data);
    else
      this.storage.writeRecord(MATCH_KEY, {
        version: 1,
        spec: this.active,
        state: data,
      });
  }
  savedMatch() {
    const d = this.storage.readRecord(MATCH_KEY) as {
      version: number;
      spec: MatchSpec;
      state: unknown;
    } | null;
    try {
      if (
        d?.version !== 1 ||
        !d.spec ||
        !["local", "ai"].includes(d.spec.options.mode) ||
        !["medium", "hard", "impossible"].includes(d.spec.options.difficulty)
      )
        return null;
      if (getGame(d.spec.gameId).category === "arcade") return null;
      return d;
    } catch {
      return null;
    }
  }
  resumeSaved() {
    const d = this.savedMatch();
    if (d) void this.play(d.spec.gameId, d.spec.options, d.state);
  }
  finish(result: GameResult, run: number) {
    if (
      run !== this.run ||
      this.state === "results" ||
      !this.active ||
      getGame(this.active.gameId).category === "arcade"
    )
      return;
    if (this.token && !this.tournament.finish(this.token, result)) return;
    if (!this.scores.record(result.winner)) return;
    if (!this.token) this.storage.writeRecord(MATCH_KEY, null);
    this.helpOpen = false;
    this.state = "results";
    this.audio.play(result.winner === "draw" ? "draw" : "win");
    if (this.token) {
      this.tournamentView.show();
      return;
    }
    this.modal.show(
      resultsContent(result, this.active!.options),
      {
        rematch: () =>
          void this.play(this.active!.gameId, this.active!.options),
        menu: () => this.goMenu(),
      },
      "result-modal",
      () => this.goMenu(),
    );
  }
  finishArcade(score: number, detail: string, run: number) {
    if (
      run !== this.run ||
      this.state === "results" ||
      (getGame(this.active!.gameId).category !== "arcade" &&
        getGame(this.active!.gameId).presentation !== "custom")
    )
      return;
    this.helpOpen = false;
    this.state = "results";
    const best = this.arcade.record(this.active!.gameId, score);
    this.audio.play("win");
    this.modal.show(
      `<div class="eyebrow">ONE MORE GO?</div><h2 id="dialog-title">${getGame(this.active!.gameId).name}</h2><div class="arcade-result-score">${score}</div><p>${detail}<br>Personal best <b>${best}</b></p><button class="primary-button" data-action="rematch">Play again →</button><button class="text-button" data-action="menu">${getGame(this.active!.gameId).category === "arcade" ? "Back to Arcade" : "Back to all games"}</button>`,
      {
        rematch: () => void this.play(this.active!.gameId),
        menu: () => this.goMenu(),
      },
      "result-modal",
      () => this.goMenu(),
    );
  }
  private handleHelpKey(e: KeyboardEvent) {
    if (!this.active || this.state === "results") return;
    if (this.helpOpen) {
      e.preventDefault();
      this.resume();
      return;
    }
    if (this.state !== "playing") return;
    e.preventDefault();
    if (this.host.module?.toggleHelp?.()) return;
    this.showHelp();
  }
  showHelp() {
    if (this.state !== "playing" || !this.active) return;
    const meta = getGame(this.active.gameId);
    this.clearLoading();
    this.host.pauseGame();
    this.state = "paused";
    this.helpOpen = true;
    this.audio.play("tap");
    this.modal.show(
      `<div class="eyebrow">HOW TO PLAY</div><h2 id="dialog-title">${meta.name}</h2><p>${meta.instructions}</p><button class="primary-button" data-action="resume">Back to game →</button>`,
      { resume: () => this.resume() },
      "help-modal",
      () => this.resume(),
    );
  }
  pause(reason = "pause") {
    if (this.state !== "playing" && this.state !== "loading") return;
    this.clearLoading();
    this.host.pauseGame();
    this.helpOpen = false;
    this.state = "paused";
    this.audio.play("tap");
    this.modal.show(
      `<div class="pause-symbol">Ⅱ</div><div class="eyebrow">TAKE YOUR TIME</div><h2 id="dialog-title">${reason === "leave" ? "A little timeout?" : "Rivalry on hold."}</h2><p>${getGame(this.active!.gameId).instructions}</p><button class="primary-button" data-action="resume">Keep playing →</button><button class="secondary-button" data-action="restart">Start a fresh match</button><button class="text-button" data-action="menu">${this.token ? "Save & return to menu" : "Back to all games"}</button>`,
      {
        resume: () => this.resume(),
        restart: () => this.restart(),
        menu: () => this.goMenu(),
      },
      "",
      () => this.resume(),
    );
  }
  private restart() {
    if (this.token) {
      const round = this.tournament.restartRound();
      if (round)
        void this.play(
          round.spec.gameId,
          round.spec.options,
          undefined,
          round.token,
        );
    } else if (this.active)
      void this.play(this.active.gameId, this.active.options);
  }
  private resume() {
    this.helpOpen = false;
    this.modal.close();
    this.audio.unlock();
    this.state = this.host.ready ? "playing" : "loading";
    if (this.state === "loading") this.watchLoading();
    this.host.resumeGame();
  }
  private background() {
    if (this.state === "playing" || this.state === "loading") this.pause();
    this.audio.suspend();
    this.host.controls?.clear();
  }
  back() {
    if (this.state === "playing" || this.state === "loading")
      this.pause("leave");
    else if (this.modal.isOpen) this.modal.back();
    else this.goMenu();
  }
  goMenu() {
    this.clearLoading();
    this.run++;
    this.transition.hidden = true;
    this.modal.close();
    this.game.scene.stop("GameHost");
    this.game.loop.sleep();
    this.active = null;
    this.token = null;
    this.helpOpen = false;
    this.state = "menu";
    document.querySelector("#app")!.classList.remove("in-game");
    this.menuRoot.hidden = false;
    this.menu.render();
  }
  refreshMenu() {
    this.menu.render();
  }
  openTournament() {
    if (this.tournament.state) this.showTournament();
    else this.tournamentView.setup();
  }
  newTournament() {
    this.tournamentView.setup();
  }
  showTournament() {
    this.goMenu();
    this.tournamentView.show();
  }
  startTournamentRound() {
    const round = this.tournament.startRound();
    if (!round) return;
    try {
      const meta = getGame(round.spec.gameId);
      if (meta.category === "arcade" || meta.tournament === false)
        throw Error("This game is unavailable in tournaments");
      void this.play(
        round.spec.gameId,
        round.spec.options,
        round.checkpoint,
        round.token,
      );
    } catch (error) {
      this.showError(error);
    }
  }
  toggleSound() {
    this.storage.data.sound = !this.storage.data.sound;
    this.audio.syncSettings();
    this.storage.save();
    this.audio.play("tap");
  }
  settings() {
    const run = this.run;
    void import("../scenes/Settings")
      .then(({ Settings }) => {
        if (run === this.run && this.state === "menu" && !this.modal.isOpen)
          new Settings(this).show();
      })
      .catch((error) => {
        if (run === this.run) this.showError(error);
      });
  }
  showError(error: unknown) {
    this.clearLoading();
    this.run++;
    this.helpOpen = false;
    this.state = "paused";
    this.transition.hidden = true;
    this.game.scene.stop("GameHost");
    console.error(error);
    this.host.pauseGame();
    this.modal.show(
      '<h2 id="dialog-title">That game took a break.</h2><p>Return to the collection, or reload to retry the download.</p><button class="primary-button" data-action="menu">Back to games</button><button class="text-button" data-action="reload">Reload games</button>',
      { menu: () => this.goMenu(), reload: () => location.reload() },
      "",
      () => this.goMenu(),
    );
  }
  snapshot() {
    return {
      state: this.state,
      diagnostics: this.diagnostics.snapshot(),
      saved: structuredClone(this.storage.data),
      tournament: structuredClone(this.tournament.state),
      scene: this.host.snapshot(),
    };
  }
  dispose() {
    this.clearLoading();
    this.run++;
    this.disposers.forEach((fn) => fn());
    this.audio.dispose();
    this.diagnostics.dispose();
    this.transition.remove();
    this.game.destroy(true);
    this.game.loop.wake();
  }
}
