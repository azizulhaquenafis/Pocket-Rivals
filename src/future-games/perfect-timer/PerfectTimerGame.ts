import Phaser from "phaser";
import { MatchRandom } from "../../shared/ai/MatchRandom";
import { TimerClock } from "./TimerClock";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label } from "../../shared/components/drawing";
import {
  PerfectTimerMatch,
  formatSeconds,
  type TimerRoundResult,
} from "./PerfectTimerRules";
import { PerfectTimerAI } from "./PerfectTimerAI";
import { TimerRenderer } from "./TimerRenderer";

export class PerfectTimerGame implements MiniGame {
  private ctx!: GameContext;
  private random = new MatchRandom();
  private match = new PerfectTimerMatch(this.random.next);
  private ai?: PerfectTimerAI;
  private renderer!: TimerRenderer;

  private g!: Phaser.GameObjects.Graphics;
  private uiTexts: Phaser.GameObjects.Text[] = [];

  private bannerTitle!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  private p1BtnText!: Phaser.GameObjects.Text;
  private p2BtnText!: Phaser.GameObjects.Text;
  private revealText!: Phaser.GameObjects.Text;

  private ready = [false, false];
  private lastTick = -1;
  private state: "WAITING_READY" | "COUNTDOWN" | "TIMING" | "REVEAL" =
    "WAITING_READY";

  private countdownStep = 3;
  private countdownTimer = 0;

  private clock = new TimerClock();
  private animTime = 0;
  private revealAge = 0;
  private paused = false;
  private reported = false;
  private roundResult?: TimerRoundResult;

  // Button boundaries
  private readonly p1Btn = { x: 45, y: 550, w: 330, h: 72 };
  private readonly p2Btn = { x: 45, y: 140, w: 330, h: 72 };

  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.renderer = new TimerRenderer(ctx.scene);
    this.g = ctx.scene.add.graphics();

    if (ctx.options.mode === "ai") {
      this.ai = new PerfectTimerAI(ctx.options.difficulty, this.random.seed);
    }

    // Header banner
    this.bannerTitle = label(
      ctx.scene,
      210,
      126,
      "PERFECT TIMER · ROUND 1/5",
      14,
      "#242b32",
    );
    this.bannerTitle.setFontStyle("700").setDepth(2);
    this.uiTexts.push(this.bannerTitle);

    // Target Duration Banner (prominent above stopwatch crown)
    this.targetText = label(
      ctx.scene,
      210,
      248,
      `TARGET: ${formatSeconds(this.match.target)}`,
      22,
      "#e67e22",
    );
    this.targetText.setFontStyle("900").setDepth(2);
    this.uiTexts.push(this.targetText);

    // Big Countdown display (centered right in stopwatch dial)
    this.countdownText = label(ctx.scene, 210, 390, "", 48, "#e67e22");
    this.countdownText.setFontStyle("900").setDepth(3).setAlpha(0);
    this.uiTexts.push(this.countdownText);

    // Status Indicator (comfortably in lower area between stopwatch and P1 button)
    this.statusText = label(ctx.scene, 210, 510, "Tap ready", 14, "#7f8c8d");
    this.statusText.setFontStyle("800").setDepth(2);
    this.uiTexts.push(this.statusText);

    // Player 2 Button Text (top)
    this.p2BtnText = label(
      ctx.scene,
      210,
      176,
      this.ai ? "AI OPPONENT" : "Ready",
      18,
      "#ffffff",
    );
    this.p2BtnText.setFontStyle("800").setDepth(3);
    if (ctx.options.mode === "local") this.p2BtnText.setRotation(Math.PI);
    this.uiTexts.push(this.p2BtnText);

    // Player 1 Button Text (bottom)
    this.p1BtnText = label(ctx.scene, 210, 586, "Ready", 18, "#ffffff");
    this.p1BtnText.setFontStyle("800").setDepth(3);
    this.uiTexts.push(this.p1BtnText);

    // Reveal Result text (centered inside reveal card)
    this.revealText = label(ctx.scene, 210, 350, "", 15, "#242b32");
    this.revealText.setFontStyle("700").setDepth(4).setAlpha(0);
    this.uiTexts.push(this.revealText);

    this.setupInputs();
    this.startRound();
    this.ctx.setScore(0, 0);
  }

  private setupInputs() {
    // Touch / Tap input
    this.ctx.input.tap((x, y) => {
      if (this.paused || this.reported) return;

      if (this.state === "REVEAL") {
        if (this.revealAge > 0.8) {
          this.advanceNext();
        }
        return;
      }

      // Hit test Player 1 button (bottom)
      if (
        x >= this.p1Btn.x &&
        x <= this.p1Btn.x + this.p1Btn.w &&
        y >= this.p1Btn.y &&
        y <= this.p1Btn.y + this.p1Btn.h
      ) {
        this.handlePlayerAction(0);
        return;
      }

      // Hit test Player 2 button (top)
      if (
        x >= this.p2Btn.x &&
        x <= this.p2Btn.x + this.p2Btn.w &&
        y >= this.p2Btn.y &&
        y <= this.p2Btn.y + this.p2Btn.h
      ) {
        if (!this.ai) {
          this.handlePlayerAction(1);
        }
        return;
      }
    });

    // Keyboard support on desktop
    this.ctx.input.press(["Space", "KeyA"], () => {
      if (this.paused || this.reported) return;
      if (this.state === "REVEAL" && this.revealAge > 0.8) {
        this.advanceNext();
        return;
      }
      this.handlePlayerAction(0);
    });

    this.ctx.input.press(["Enter", "KeyL"], () => {
      if (this.paused || this.reported) return;
      if (this.state === "REVEAL" && this.revealAge > 0.8) {
        this.advanceNext();
        return;
      }
      if (!this.ai) {
        this.handlePlayerAction(1);
      }
    });
  }

  private handlePlayerAction(player: 0 | 1) {
    if (this.state === "WAITING_READY") {
      if (!this.ready[player]) {
        this.ready[player] = true;
        this.ctx.audio.play("tap");
        this.updateButtons();

        // If both ready (or in AI mode where AI is auto-ready)
        if (this.ready[0] && this.ready[1]) {
          this.startCountdown();
        }
      }
    } else if (this.state === "TIMING") {
      if (this.match.stops[player] === null) {
        const elapsedMs = this.clock.elapsed();
        this.match.recordStop(player, elapsedMs);
        this.ctx.audio.play("clockStop");
        this.updateButtons();

        if (this.match.bothStopped) {
          this.triggerReveal();
        }
      }
    }
  }

  private startRound() {
    this.state = "WAITING_READY";
    this.ready = [false, this.ai ? true : false];
    this.roundResult = undefined;
    this.revealAge = 0;
    this.revealText.setAlpha(0);
    this.countdownText.setAlpha(0);
    this.targetText.setAlpha(1);
    this.statusText.setAlpha(1);

    const isSudden = this.match.isSuddenDeath;
    this.bannerTitle.setText(isSudden ? "Tiebreak" : `${this.match.round} / 5`);
    this.ctx.setHint("");
    this.targetText.setText(`TARGET: ${formatSeconds(this.match.target)}`);
    this.statusText
      .setText(this.ai ? "Ready" : "Tap ready")
      .setColor("#7f8c8d");

    this.updateButtons();
  }

  private startCountdown() {
    this.state = "COUNTDOWN";
    this.countdownStep = 3;
    this.countdownTimer = 0.75;
    this.statusText.setText("").setColor("#e67e22").setFontSize(14).setAlpha(1);
    this.countdownText
      .setText("3")
      .setColor("#e67e22")
      .setFontSize(48)
      .setAlpha(1);
    this.ctx.audio.play("countdown");
    this.updateButtons();
  }

  private startTimingPhase() {
    this.state = "TIMING";
    this.clock.start();
    this.lastTick = -1;
    this.countdownText.setAlpha(0);
    this.statusText.setText("").setColor("#e74c3c").setFontSize(14).setAlpha(1);
    this.ctx.audio.play("start");

    if (this.ai) {
      this.ai.scheduleRound(this.match.target, 0);
    }
    this.updateButtons();
  }

  private updateButtons() {
    if (this.state === "WAITING_READY") {
      this.p1BtnText.setText(this.ready[0] ? "Ready ✓" : "Ready");
      if (this.ai) {
        this.p2BtnText.setText("AI READY ✓");
      } else {
        this.p2BtnText.setText(this.ready[1] ? "Ready ✓" : "Ready");
      }
    } else if (this.state === "COUNTDOWN") {
      this.p1BtnText.setText("");
      this.p2BtnText.setText(this.ai ? "AI OPPONENT" : "");
    } else if (this.state === "TIMING") {
      const p1Stopped = this.match.stops[0] !== null;
      this.p1BtnText.setText(p1Stopped ? "✓" : "STOP");

      const p2Stopped = this.match.stops[1] !== null;
      if (this.ai) {
        this.p2BtnText.setText(p2Stopped ? "AI: STOPPED" : "AI: ESTIMATING...");
      } else {
        this.p2BtnText.setText(p2Stopped ? "✓" : "STOP");
      }
    } else if (this.state === "REVEAL") {
      this.p1BtnText.setText("ROUND COMPLETE");
      this.p2BtnText.setText("ROUND COMPLETE");
    }
  }

  private triggerReveal() {
    if (this.state !== "TIMING" || this.reported) return;
    this.clock.pause();
    this.state = "REVEAL";
    this.revealAge = 0;
    this.roundResult = this.match.resolveRound();
    this.ctx.setScore(this.match.scores[0], this.match.scores[1]);

    const res = this.roundResult;
    const s0Str = formatSeconds(res.stops[0]);
    const s1Str = formatSeconds(res.stops[1]);
    const err0Str = formatSeconds(res.errors[0]);
    const err1Str = formatSeconds(res.errors[1]);
    const tarStr = formatSeconds(res.target);

    let winnerStr: string;
    if (res.winner === 1) {
      winnerStr = "ORANGE WINS ROUND!";
      this.ctx.audio.play("capture");
    } else if (res.winner === 2) {
      winnerStr = (this.ai ? "AI" : "BLUE") + " WINS ROUND!";
      this.ctx.audio.play("capture");
    } else {
      winnerStr = "TIED ROUND!";
      this.ctx.audio.play("draw");
    }

    // Hide overlapping background texts so reveal card is crisp and clean
    this.targetText.setAlpha(0);
    this.statusText.setAlpha(0);
    this.countdownText.setAlpha(0);

    this.revealText
      .setText(
        `TARGET: ${tarStr}\n\n` +
          `ORANGE: ${s0Str}   (ERR ${err0Str})\n` +
          `${this.ai ? "AI" : "BLUE"}: ${s1Str}   (ERR ${err1Str})\n\n` +
          `★ ${winnerStr} ★\n\n` +
          `TAP TO CONTINUE`,
      )
      .setAlpha(1);

    this.updateButtons();
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

    if (this.state === "COUNTDOWN") {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.countdownStep--;
        if (this.countdownStep === 0) {
          this.countdownText.setText("GO!").setColor("#27ae60");
          this.startTimingPhase();
        } else {
          this.countdownTimer = 0.75;
          this.countdownText
            .setText(`${this.countdownStep}`)
            .setColor("#e67e22");
          this.ctx.audio.play("countdown");
        }
      }
    } else if (this.state === "TIMING") {
      const now = this.clock.elapsed();
      const tick = Math.floor(now / 500);
      if (tick !== this.lastTick && !this.match.bothStopped) {
        this.lastTick = tick;
        this.ctx.audio.play("clockTick");
      }

      // Check AI auto-stop
      if (this.ai && this.match.stops[1] === null && this.ai.shouldStop(now)) {
        const elapsedMs = now;
        this.match.recordStop(1, elapsedMs);
        this.ctx.audio.play("clockStop");
        this.updateButtons();
        if (this.match.bothStopped) {
          this.triggerReveal();
        }
      }

      // Max timeout safeguard (target + 5.00s)
      const maxMs = (this.match.target + 500) * 10;
      if (this.state === "TIMING" && now > maxMs) {
        if (this.match.stops[0] === null) this.match.recordStop(0, maxMs);
        if (this.match.stops[1] === null) this.match.recordStop(1, maxMs);
        this.updateButtons();
        this.triggerReveal();
      }
    } else if (this.state === "REVEAL") {
      this.revealAge += dt;
      if (this.revealAge > 3.2) {
        this.advanceNext();
      }
    }

    this.render();
  }

  private render() {
    const g = this.g;
    g.clear();

    // 1. Play area card (warm ivory / off-white)
    rounded(g, 24, 112, 372, 538, 20, 0xfcf8f2, 4);

    // 2. Stopwatch Illustration in center (cx=210, cy=390, r=85)
    this.renderer.drawStopwatch(
      g,
      210,
      390,
      85,
      this.state === "TIMING",
      this.animTime,
    );

    // 3. Player 2 Button (Top)
    const p2Color =
      this.state === "TIMING" && this.match.stops[1] !== null
        ? 0x7f8c8d
        : theme.blue;
    rounded(
      g,
      this.p2Btn.x,
      this.p2Btn.y,
      this.p2Btn.w,
      this.p2Btn.h,
      16,
      p2Color,
      3,
    );

    // 4. Player 1 Button (Bottom)
    const p1Color =
      this.state === "TIMING" && this.match.stops[0] !== null
        ? 0x7f8c8d
        : theme.orange;
    rounded(
      g,
      this.p1Btn.x,
      this.p1Btn.y,
      this.p1Btn.w,
      this.p1Btn.h,
      16,
      p1Color,
      3,
    );

    // 5. Reveal Card Overlay in center
    if (this.state === "REVEAL") {
      rounded(g, 40, 235, 340, 230, 18, 0xffffff, 3);
    }
  }

  pause() {
    if (this.state === "TIMING") this.clock.pause();
    this.paused = true;
  }

  resume() {
    if (this.paused && this.state === "TIMING") this.clock.resume();
    this.paused = false;
  }

  dispose() {
    this.reported = true;
    this.clock.pause();
    this.ai?.reset();
    this.g.destroy();
    for (const t of this.uiTexts) t.destroy();
  }

  snapshot() {
    return {
      ai: this.ai?.snapshot(),
      match: this.match,
      state: this.state,
      ready: [...this.ready],
      scores: [...this.match.scores],
      round: this.match.round,
    };
  }
}
