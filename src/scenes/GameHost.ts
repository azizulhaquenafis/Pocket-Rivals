import Phaser from "phaser";
import type { GameManager } from "../core/GameManager";
import type {
  MiniGame,
  GameResult,
  MatchOptions,
} from "../shared/contracts/GameModule";
import { getGame } from "../core/GameRegistry";
import { loadGame } from "../core/GameLoader";
import { InputManager } from "../core/InputManager";
import { theme } from "../core/ThemeManager";
import { rounded, label } from "../shared/components/drawing";
export class GameHost extends Phaser.Scene {
  module?: MiniGame;
  controls?: InputManager;
  paused = false;
  ready = false;
  private ended = false;
  private alive = false;
  private generation = 0;
  private id = "";
  private options!: MatchOptions;
  private restoredState?: unknown;
  private run = 0;
  private texts: Phaser.GameObjects.Text[] = [];
  private lastTime = 0;
  private clockText!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  constructor(private app: GameManager) {
    super({ key: "GameHost" });
  }
  init(data: {
    id: string;
    options: MatchOptions;
    restoredState?: unknown;
    run: number;
  }) {
    this.id = data.id;
    this.options = data.options;
    this.restoredState = data.restoredState;
    this.run = data.run;
    this.paused = false;
    this.ready = false;
    this.ended = false;
    this.alive = true;
    this.texts = [];
    this.generation++;
  }
  create() {
    const generation = this.generation;
    const started = performance.now();
    const meta = getGame(this.id);
    this.cameras.main
      .setBackgroundColor(theme.paper)
      .setOrigin(0, 0)
      .setZoom(this.app.renderScale)
      .setScroll(0, 0);
    if (meta.presentation !== "custom") {
      const g = this.add.graphics();
      rounded(g, 18, 14, 44, 42, 13, theme.white, 2);
      rounded(g, 358, 14, 44, 42, 13, theme.white, 2);
      g.lineStyle(3, theme.ink)
        .lineBetween(44, 27, 35, 35)
        .lineBetween(35, 35, 44, 43)
        .lineBetween(35, 35, 49, 35);
      g.fillStyle(theme.ink)
        .fillRoundedRect(373, 27, 4, 16, 2)
        .fillRoundedRect(382, 27, 4, 16, 2);
      label(this, 210, 28, meta.name, 24);
      label(
        this,
        210,
        51,
        this.options.variant
          ? this.options.variant.toUpperCase()
          : "POCKET RIVALS",
        10,
        "#7d8583",
      );
      this.add
        .zone(40, 35, 50, 48)
        .setInteractive({ useHandCursor: true })
        .on("pointerup", () => this.app.pause("leave"));
      this.add
        .zone(380, 35, 50, 48)
        .setInteractive({ useHandCursor: true })
        .on("pointerup", () => this.app.pause());
      if (meta.category !== "arcade") {
        rounded(g, 141, 70, 138, 32, 12, theme.blue, 2);
        rounded(g, 141, 674, 138, 32, 12, theme.orange, 2);
        this.texts = [
          label(this, 210, 690, "ORANGE   0", 18),
          label(
            this,
            210,
            86,
            this.options.mode === "ai" ? "BLUE AI   0" : "BLUE   0",
            18,
          ).setRotation(this.options.mode === "ai" ? 0 : Math.PI),
        ];
      } else {
        rounded(g, 80, 70, 260, 32, 12, theme.blue, 2);
        this.texts = [
          label(this, 210, 86, "SCORE  0", 18),
          label(this, 210, 690, "", 15),
        ];
      }
      this.clockText = label(this, 73, 86, "", 18);
      this.hint = label(this, 210, 733, "", 11, "#697474");
      if (meta.category !== "arcade")
        label(this, 210, 714, "PLAYER 1", 9, "#8a8d84");
    }
    this.controls = new InputManager(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    void loadGame(this.id, this.options)
      .then((module) => {
        if (!this.alive || generation !== this.generation) {
          return;
        }
        this.module = module;
        module.initialize({
          reportAI: (ms) => this.app.diagnostics.computation(ms),
          bestScore: this.app.arcade.best(this.id),
          setArcadeHUD: (score, detail) => {
            this.texts[0]?.setText(
              `SCORE  ${score}    BEST  ${Math.max(score, this.app.arcade.best(this.id))}`,
            );
            this.texts[1]?.setText(detail);
          },
          finishArcade: (score, detail) => {
            if (this.ended) return;
            this.ended = true;
            this.pauseGame();
            this.app.finishArcade(score, detail, this.run);
          },
          scene: this,
          navigation: {
            pause: () => this.app.pause(),
            exit: () => this.app.pause("leave"),
          },
          options: this.options,
          restoredState: this.restoredState,
          saveState: (state) => this.app.checkpoint(this.run, state),
          input: this.controls!,
          audio: this.app.audio,
          setClock: (text, urgent) =>
            this.clockText
              ?.setText(text)
              .setColor(urgent ? "#b2462c" : "#697474"),
          setScore: (a, b) => this.setScore(a, b),
          setHint: (text) => this.hint?.setText(text),
          finish: (result) => this.finish(result),
        });
        this.ready = true;
        this.app.diagnostics.loaded(this.id);
        this.app.diagnostics.initialized(this.id, performance.now() - started);
        if (this.paused) {
          this.controls!.pause();
          module.pause();
        }
        this.lastTime = performance.now();
        this.game.events.once(Phaser.Core.Events.POST_RENDER, () => {
          if (this.alive && generation === this.generation)
            this.app.onReady(this.run);
        });
      })
      .catch((error) => {
        if (this.alive && generation === this.generation)
          this.app.showError(error);
      });
  }
  private setScore(a: number, b: number) {
    [a, b].forEach((value, i) => {
      const text = this.texts[i];
      const next = `${i === 0 ? "ORANGE" : this.options.mode === "ai" ? "BLUE AI" : "BLUE"}   ${value}`;
      if (text.text !== next) {
        text.setText(next);
        this.tweens.add({
          targets: text,
          scaleX: 1.16,
          scaleY: 1.16,
          duration: 100,
          yoyo: true,
        });
      }
    });
  }
  private finish(result: GameResult) {
    if (this.ended) return;
    this.ended = true;
    this.pauseGame();
    this.app.finish(result, this.run);
  }
  update() {
    const now = performance.now(),
      dt = this.lastTime ? (now - this.lastTime) / 1000 : 0;
    this.lastTime = now;
    if (this.ready && !this.paused) this.module?.update(dt);
    this.app.diagnostics.frame(
      dt,
      this.game.scene.getScenes(true).length,
      this.textures.getTextureKeys().length,
    );
  }
  pauseGame() {
    this.paused = true;
    this.controls?.pause();
    this.module?.pause();
  }
  resumeGame() {
    if (this.ended) return;
    this.paused = false;
    this.lastTime = performance.now();
    this.controls?.resume();
    this.module?.resume();
  }
  private cleanup() {
    this.alive = false;
    this.ready = false;
    this.module?.dispose();
    this.module = undefined;
    this.controls?.dispose();
    this.controls = undefined;
    this.texts = [];
  }
  snapshot() {
    return {
      id: this.id,
      options: this.options,
      ready: this.ready,
      paused: this.paused,
      ended: this.ended,
      inputListeners: this.controls?.listenerCount ?? 0,
      pointers: this.controls?.players.map((p) => ({ ...p })),
      game: this.module?.snapshot?.(),
      children: this.children.length,
    };
  }
}
