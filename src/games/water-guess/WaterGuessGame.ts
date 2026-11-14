import Phaser from "phaser";
import { TurnView, turnBackground } from "../../shared/components/TurnView";
import { MatchRandom } from "../../shared/ai/MatchRandom";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import {
  WaterGuessMatch,
  formatPercent,
  parsePercentInput,
  type WaterRoundResult,
} from "./WaterGuessRules";
import { WaterGuessAI } from "./WaterGuessAI";
import { WaterRenderer } from "./WaterRenderer";

interface KeyButton {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  action: () => void;
}

export class WaterGuessGame implements MiniGame {
  private ctx!: GameContext;
  private view!: TurnView;
  private aiWait = 0;
  private random = new MatchRandom();
  private match = new WaterGuessMatch(this.random.next);
  private ai?: WaterGuessAI;
  private renderer!: WaterRenderer;

  private g!: Phaser.GameObjects.Graphics;
  private uiTexts: Phaser.GameObjects.Text[] = [];
  private buttonTexts: Phaser.GameObjects.Text[] = [];

  private bannerTitle!: Phaser.GameObjects.Text;
  private inputBufferText!: Phaser.GameObjects.Text;
  private revealText!: Phaser.GameObjects.Text;

  private buttons: KeyButton[] = [];
  private inputBuffer = "";
  private activeGuesser: 0 | 1 = 0; // In 2P, who is typing now

  private state: "FILLING" | "GUESSING" | "REVEAL" = "FILLING";
  private fillAnimProgress = 0; // 0..1
  private animTime = 0;
  private revealAge = 0;
  private paused = false;
  private reported = false;
  private roundResult?: WaterRoundResult;

  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.renderer = new WaterRenderer(ctx.scene);
    this.g = ctx.scene.add.graphics();

    if (ctx.options.mode === "ai") {
      this.ai = new WaterGuessAI(ctx.options.difficulty, this.random.seed);
    }

    this.bannerTitle = label(ctx.scene, 210, 129, "1 / 5", 11);
    this.inputBufferText = label(ctx.scene, 210, 502, "— %", 18);
    this.revealText = label(ctx.scene, 210, 381, "", 54);
    this.revealText.setAlpha(0);
    this.uiTexts.push(this.bannerTitle, this.inputBufferText, this.revealText);

    this.setupKeypad();
    this.view = new TurnView(ctx.scene, [this.g, ...this.uiTexts]);
    this.setupInputs();

    this.startRound();
    this.ctx.setScore(0, 0);
  }

  private setupKeypad() {
    this.buttons = [];
    const addKey = (
      lbl: string,
      x: number,
      y: number,
      w: number,
      h: number,
      action: () => void,
    ) => {
      this.buttons.push({ label: lbl, x, y, w, h, action });
    };

    // Row 1: 1, 2, 3, 4, 5
    const r1 = ["1", "2", "3", "4", "5"];
    for (let i = 0; i < 5; i++) {
      addKey(r1[i], 28 + i * 72, 524, 64, 34, () => this.appendDigit(r1[i]));
    }

    // Row 2: 6, 7, 8, 9, 0
    const r2 = ["6", "7", "8", "9", "0"];
    for (let i = 0; i < 5; i++) {
      addKey(r2[i], 28 + i * 72, 564, 64, 34, () => this.appendDigit(r2[i]));
    }

    // Row 3: delete and submit
    addKey("⌫ DEL", 28, 604, 148, 34, () => this.backspace());
    addKey("CONFIRM", 184, 604, 204, 34, () => this.submitCurrentGuess());

    // Create Phaser Text objects for each button
    this.buttonTexts = [];
    for (const b of this.buttons) {
      const isConfirm = b.label === "CONFIRM";
      const txt = label(
        this.ctx.scene,
        b.x + b.w / 2,
        b.y + b.h / 2,
        b.label,
        isConfirm ? 14 : b.label.length > 2 ? 12 : 16,
        isConfirm ? "#ffffff" : "#242b32",
      );
      txt.setFontStyle("800").setDepth(3);
      this.buttonTexts.push(txt);
      this.uiTexts.push(txt);
    }
  }

  private setupInputs() {
    // Tap handler for keypad and reveal tap-to-continue
    this.ctx.input.tap((x, y) => {
      if (!this.view.ready) return;
      ({ x, y } = this.view.point(x, y));
      if (this.paused || this.reported) return;

      if (this.state === "REVEAL") {
        if (x < 24 || x > 396 || y < 112 || y > 650) return;
        if (this.revealAge > 0.8) {
          this.advanceNext();
        }
        return;
      }

      if (!this.canGuess) return;

      // Check button clicks
      for (const b of this.buttons) {
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          this.ctx.audio.play("tap");
          b.action();
          return;
        }
      }
    });

    // Keyboard support on desktop
    const digitCodes = [
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "Digit5",
      "Digit6",
      "Digit7",
      "Digit8",
      "Digit9",
      "Digit0",
      "Numpad1",
      "Numpad2",
      "Numpad3",
      "Numpad4",
      "Numpad5",
      "Numpad6",
      "Numpad7",
      "Numpad8",
      "Numpad9",
      "Numpad0",
    ];
    this.ctx.input.press(
      [...digitCodes, "Backspace", "Enter", "Space"],
      (code) => {
        if (this.paused || this.reported) return;
        if (this.state === "REVEAL") {
          if (
            this.view.ready &&
            this.revealAge > 0.8 &&
            (code === "Enter" || code === "Space")
          )
            this.advanceNext();
          return;
        }
        if (!this.canGuess) return;

        if (/^(Digit|Numpad)[0-9]$/.test(code)) {
          const char = code.replace("Digit", "").replace("Numpad", "");
          if (/^[0-9]$/.test(char)) {
            this.ctx.audio.play("tap");
            this.appendDigit(char);
          }
        } else if (code === "Backspace") {
          this.ctx.audio.play("tap");
          this.backspace();
        } else if (code === "Enter" || code === "Space") {
          this.ctx.audio.play("wood");
          this.submitCurrentGuess();
        }
      },
    );
  }

  private appendDigit(digit: string) {
    const next = this.inputBuffer + digit;
    if (next.length > 3 || Number(next) > 100) return;
    this.inputBuffer = next;
    this.updateBufferDisplay();
  }

  private backspace() {
    if (this.inputBuffer.length > 0) {
      this.inputBuffer = this.inputBuffer.slice(0, -1);
      this.updateBufferDisplay();
    }
  }

  private get canGuess() {
    return (
      this.state === "GUESSING" &&
      this.view.ready &&
      this.match.guesses[this.activeGuesser] === null
    );
  }

  private updateBufferDisplay() {
    this.inputBufferText
      .setFontSize(18)
      .setText(this.inputBuffer.length === 0 ? "— %" : `${this.inputBuffer}%`);
  }

  private startRound() {
    this.state = "FILLING";
    this.fillAnimProgress = 0;
    this.inputBuffer = "";
    this.roundResult = undefined;
    this.revealAge = 0;
    this.revealText.setAlpha(0).setScale(1);
    this.bannerTitle.setVisible(true);

    const isSudden = this.match.isSuddenDeath;
    this.bannerTitle.setText(isSudden ? "TIEBREAK" : `${this.match.round} / 5`);
    this.ctx.setHint("");

    // In 2P, alternate who guesses first
    this.activeGuesser = this.match.round % 2 === 1 ? 0 : 1;

    // AI locks its guess automatically if in AI mode
    if (this.ai) {
      this.aiWait = this.random.sample(1.45, 0.35, 1.0);
      this.activeGuesser = 0; // Human is Player 1
    }

    this.view.set(!this.ai && this.activeGuesser === 1);
    this.inputBufferText.setAlpha(1);
    this.updateBufferDisplay();
    this.buttonTexts.forEach((t) => t.setAlpha(1));
    this.ctx.audio.play("soft");
  }

  private submitCurrentGuess() {
    if (this.inputBuffer.length === 0 || !this.canGuess) return;
    const val = parsePercentInput(this.inputBuffer);

    const ok = this.match.submit(this.activeGuesser, val);
    if (!ok) {
      this.inputBufferText.setText("Choose another %").setFontSize(13);
      this.inputBuffer = "";
      this.ctx.audio.play("fail");
      return;
    }

    this.ctx.audio.play("wood");

    this.inputBuffer = "";

    // Check if both have submitted
    if (this.match.bothSubmitted) {
      this.triggerReveal();
    } else {
      // In 2P, switch to the other player
      if (!this.ai) {
        this.activeGuesser = this.activeGuesser === 0 ? 1 : 0;
        this.view.set(this.activeGuesser === 1);
      }
      this.updateBufferDisplay();
    }
  }

  private triggerReveal() {
    if (this.state !== "GUESSING" || this.reported) return;
    this.state = "REVEAL";
    this.revealAge = 0;
    this.buttonTexts.forEach((t) => t.setAlpha(0));
    this.roundResult = this.match.resolveRound();
    this.ctx.setScore(this.match.scores[0], this.match.scores[1]);

    const res = this.roundResult;
    // Local mobile players see the result from the winner's side. A tied
    // round keeps the current orientation; desktop and AI stay upright.
    this.view.set(
      !this.ai &&
        (res.winner === 2 ||
          (res.winner === "draw" && this.activeGuesser === 1)),
    );
    if (res.winner === 1) {
      this.ctx.audio.play("capture");
    } else if (res.winner === 2) {
      this.ctx.audio.play("capture");
    } else {
      this.ctx.audio.play("draw");
    }

    this.bannerTitle.setVisible(false);
    this.revealText
      .setPosition(0, 0)
      .setFontSize(54)
      .setText(formatPercent(res.actual))
      .setAlpha(1);

    this.inputBufferText.setAlpha(0);
  }

  private advanceNext() {
    if (this.match.isMatchOver) {
      if (!this.reported) {
        this.reported = true;
        this.ctx.finish({
          winner: this.match.matchWinner!,
          scores: this.match.scores,
        });
      }
      return;
    }

    this.match.nextRound();
    this.startRound();
  }

  update(dt: number) {
    if (this.paused || this.reported) return;
    this.animTime += dt;
    this.view.update(dt);
    if (
      this.state === "GUESSING" &&
      this.ai &&
      this.match.guesses[1] === null
    ) {
      this.aiWait = Math.max(0, this.aiWait - dt);
      if (this.aiWait === 0) {
        let guess = this.ai.estimate(this.match.actual);
        // Occupied guesses are unavailable to either player. Choose a legal
        // adjacent percentage without re-sampling for a more accurate answer.
        if (guess === this.match.guesses[0]) {
          const direction = this.random.next() < 0.5 ? -100 : 100;
          guess += guess === 0 ? 100 : guess === 10000 ? -100 : direction;
        }
        this.match.submit(1, guess);
        if (this.match.bothSubmitted) this.triggerReveal();
      }
    }

    if (this.state === "FILLING") {
      this.fillAnimProgress = Math.min(1, this.fillAnimProgress + dt * 1.3);
      if (this.fillAnimProgress >= 1) {
        this.state = "GUESSING";
        this.updateBufferDisplay();
      }
    } else if (this.state === "REVEAL") {
      // Do not consume the readable reveal while turning to its recipient.
      if (this.view.ready) this.revealAge += dt;
      const pop = Math.min(1, this.revealAge / 0.24);
      this.revealText.setScale(0.92 + 0.08 * (1 - Math.pow(1 - pop, 3)));
      // Auto-advance after 3.2s if player doesn't tap
      if (this.revealAge > 3.2) {
        this.advanceNext();
      }
    }

    this.render();
  }

  private render() {
    const g = this.g;
    g.clear();

    // 1. Play area card (warm cream/sky blue background)
    rounded(
      g,
      24,
      112,
      372,
      538,
      20,
      this.state === "REVEAL"
        ? this.roundResult?.winner === 1
          ? theme.orange
          : this.roundResult?.winner === 2
            ? theme.blue
            : theme.paper
        : turnBackground(
            this.ai &&
              this.match.guesses[0] !== null &&
              this.match.guesses[1] === null
              ? 2
              : this.activeGuesser === 0
                ? 1
                : 2,
          ),
      4,
    );

    if (this.state === "REVEAL") return;

    const available = this.match.guesses[this.activeGuesser] === null;
    const enabled = available && this.state === "GUESSING" && this.view.ready;
    this.inputBufferText.setAlpha(available ? 1 : 0);
    for (const text of this.buttonTexts) text.setAlpha(enabled ? 1 : 0.38);

    // 2. Tube & Water
    const waterLevel =
      this.state === "FILLING"
        ? (1 - Math.pow(1 - this.fillAnimProgress, 2)) * this.match.actual
        : this.match.actual;

    this.renderer.drawTube(
      g,
      waterLevel,
      this.animTime,
      false,
      this.match.actual,
      this.match.guesses[0],
      this.match.guesses[1],
    );

    // 3. Keypad buttons (during GUESSING state)
    if (this.state === "GUESSING" || this.state === "FILLING") {
      for (const b of this.buttons) {
        let btnColor = 0xffffff;
        if (b.label === "CONFIRM") {
          btnColor = this.activeGuesser === 0 ? theme.orange : theme.blue;
        } else if (b.label === "⌫ DEL") {
          btnColor = 0xf5b7b1;
        }
        rounded(g, b.x, b.y, b.w, b.h, 10, enabled ? btnColor : 0xe7e8e5, 2);
      }
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  dispose() {
    this.reported = true;
    this.view.destroy();
  }

  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      match: this.match,
      state: this.state,
      activeGuesser: this.activeGuesser,
      rotation: this.view.rotation,
      turning: !this.view.ready,
      aiWait: this.aiWait,
      inputBuffer: this.inputBuffer,
      scores: [...this.match.scores],
      round: this.match.round,
      roundWinner: this.roundResult?.winner,
      keypadEnabled: this.canGuess,
      revealAge: this.revealAge,
    };
  }
}
