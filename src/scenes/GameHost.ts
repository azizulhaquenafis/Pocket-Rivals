import Phaser from "phaser";
import type { GameManager } from "../core/GameManager";
import type { MiniGame, GameResult, MatchOptions } from "../shared/contracts/GameModule";
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
  private options!:MatchOptions;private restoredState?:unknown;private run=0;
  private texts: Phaser.GameObjects.Text[] = [];
  private hint!: Phaser.GameObjects.Text;
  constructor(private app: GameManager) {
    super({ key: "GameHost" });
  }
  init(data: { id: string; options:MatchOptions; restoredState?:unknown; run:number }) {
    this.id = data.id;this.options=data.options;this.restoredState=data.restoredState;this.run=data.run;
    this.paused = false;
    this.ready = false;
    this.ended = false;
    this.alive = true;
    this.generation++;
  }
  create() {
    const generation = this.generation;
    const meta = getGame(this.id);
    this.cameras.main
      .setBackgroundColor(theme.paper)
      .setOrigin(0, 0)
      .setZoom(this.app.renderScale)
      .setScroll(0, 0);
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
    label(this, 210, 51, this.options.variant ? this.options.variant.toUpperCase() : "POCKET RIVALS", 10, "#7d8583");
    this.add
      .zone(40, 35, 50, 48)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.app.pause("leave"));
    this.add
      .zone(380, 35, 50, 48)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.app.pause());
    rounded(g, 141, 70, 138, 32, 12, theme.blue, 2);
    rounded(g, 141, 674, 138, 32, 12, theme.orange, 2);
    this.texts = [
      label(this, 210, 690, "ORANGE   0", 18),
      label(this, 210, 86, this.options.mode==="ai"?"BLUE AI   0":"BLUE   0", 18).setRotation(this.options.mode==="ai"?0:Math.PI),
    ];
    this.hint = label(this, 210, 733, "", 11, "#697474");
    label(this, 210, 714, "PLAYER 1", 9, "#8a8d84");
    this.controls = new InputManager(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    void loadGame(this.id,this.options)
      .then((module) => {
        if (!this.alive || generation !== this.generation) {
          return;
        }
        this.module = module;
        module.initialize({
          scene: this, options:this.options,restoredState:this.restoredState,saveState:state=>this.app.checkpoint(this.run,state),
          input: this.controls!,
          audio: this.app.audio,
          setScore: (a, b) => this.setScore(a, b),
          setHint: (text) => this.hint.setText(text),
          finish: (result) => this.finish(result),
        });
        this.ready = true;
        if (this.paused) {
          this.controls!.pause();
          module.pause();
        }
        this.app.onReady();
      })
      .catch((error) => {
        if (this.alive && generation === this.generation)
          this.app.showError(error);
      });
  }
  private setScore(a: number, b: number) {
    [a, b].forEach((value, i) => {
      const text = this.texts[i];
      const next = `${i === 0 ? "ORANGE" : this.options.mode==="ai" ? "BLUE AI" : "BLUE"}   ${value}`;
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
    this.app.finish(result,this.run);
  }
  update(_time: number, delta: number) {
    if (this.ready && !this.paused)
      this.module?.update(Math.min(delta / 1000, 0.1));
  }
  pauseGame() {
    this.paused = true;
    this.controls?.pause();
    this.module?.pause();
  }
  resumeGame() {
    if (this.ended) return;
    this.paused = false;
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
      id: this.id,options:this.options,
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
