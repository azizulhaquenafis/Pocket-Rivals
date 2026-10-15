import { FixedStep } from "../../shared/physics/FixedStep";
import { StrikePhysics, ImpactRing } from "./StrikePhysics";
import type Phaser from "phaser";
import { TurnView, turnBackground } from "../../shared/components/TurnView";
import type { GameContext, MiniGame } from "../../shared/contracts/GameModule";
import { theme } from "../../core/ThemeManager";
import { rounded, label, circle } from "../../shared/components/drawing";
import { HammerMatch } from "./Rules";
import { HammerAI } from "./AI";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

interface StrikeAnimation {
  physics: StrikePhysics;
  player: 0 | 1;
  score: number;
  elapsed: number;
  peakY: number;
  puckY: number;
  hitTriggered: boolean;
  bellTriggered: boolean;
}

export class HammerGame implements MiniGame {
  private ctx!: GameContext;
  private view!: TurnView;
  private fixed = new FixedStep();
  private animationFixed = new FixedStep();
  private ring = new ImpactRing();
  private turnWait = 0.7;
  private model = new HammerMatch();
  private ai?: HammerAI;
  private g!: Phaser.GameObjects.Graphics;
  private numberTexts: Phaser.GameObjects.Text[] = [];
  private turnBadgeText!: Phaser.GameObjects.Text;
  private popupText!: Phaser.GameObjects.Text;
  private paused = false;
  private finishAge = 0;
  private reported = false;

  // Turn management: turns are strictly one-by-one!
  private currentTurn: 0 | 1 = 0; // 0 = Orange (P1), 1 = Blue (P2 / AI)

  // Visual & animation state
  private strikeAnim?: StrikeAnimation;
  private hammerAngle = 0.32; // resting ~18.5 deg
  private hammerRestAngle = 0.32;
  private sparks: Spark[] = [];
  private bellFlashAge = 0;
  private cameraShake = 0;
  private totalElapsed = 0;

  initialize(ctx: GameContext) {
    this.ctx = ctx;
    this.g = ctx.scene.add.graphics();

    // 10 band numbers: 0 to 90
    // Bands run from y = 216 down to y = 606 (390px height, 10 bands of 39px each)
    // Alternating lanes leave the white rail unobstructed.
    const bandNumbers = [
      "0",
      "10",
      "20",
      "30",
      "40",
      "50",
      "60",
      "70",
      "80",
      "90",
    ];
    for (let i = 0; i < 10; i++) {
      const y = 606 - (i + 0.5) * 36;
      const t = label(
        ctx.scene,
        i % 2 ? 184 : 236,
        y,
        bandNumbers[i],
        22,
        "#b86812",
      );
      t.setFontStyle("700").setDepth(1);
      this.numberTexts.push(t);
    }

    // Top center bell "100" text (centered at y = 212)
    const bellText = label(ctx.scene, 210, 212, "100", 22, "#1d2328");
    bellText.setFontStyle("800").setDepth(2);
    this.numberTexts.push(bellText);

    // Active turn badge text (inside field at y = 132, safely above dome arch)
    this.turnBadgeText = label(ctx.scene, 342, 136, "1 / 3", 12, "#596361");
    this.turnBadgeText.setFontStyle("700").setDepth(3);

    // Score popup text (floats in open field space to the left of column at x = 88)
    this.popupText = label(ctx.scene, 88, 380, "", 24, "#242b32");
    this.popupText
      .setFontStyle("900")
      .setStroke("#fffaf0", 3)
      .setDepth(4)
      .setAlpha(0);

    if (ctx.options.mode === "ai") {
      this.ai = new HammerAI(ctx.options.difficulty);
    }

    this.view = new TurnView(ctx.scene, [
      this.g,
      ...this.numberTexts,
      this.turnBadgeText,
      this.popupText,
    ]);
    // Input handlers: turns are one-by-one!
    ctx.input.tap((x, y) => {
      if (x > 20 && x < 400 && y > 100 && y < 700) {
        // In local mode, tap anywhere or player half hits for the current turn player
        this.hit(this.currentTurn);
      }
    });
    ctx.input.press(["Space", "Enter"], (code) => {
      const p = code === "Space" ? 0 : 1;
      if (p === this.currentTurn) this.hit(p);
    });

    // Score is tracked out of 300!
    ctx.setScore(0, 0);
    ctx.setHint("");
    ctx.audio.play("start");
  }

  private hit(p: 0 | 1, ai = false) {
    if (this.paused || this.reported) return;
    if (!this.view.ready || this.turnWait > 0) return;
    // Strictly enforce turn: only current turn player can strike!
    if (p !== this.currentTurn) return;
    // Prevent human from triggering AI turn
    if (this.ai && p === 1 && !ai) return;
    // If a strike is actively animating (smash/rise), ignore taps
    if (this.strikeAnim) return;

    const score = this.model.hit(p);
    if (score !== null) {
      // Trigger hammer swing & rising puck animation
      const targetPeakY = 602 - (score / 100) * (602 - 212);
      this.strikeAnim = {
        physics: new StrikePhysics(score),
        player: p,
        score,
        elapsed: 0,
        peakY: targetPeakY,
        puckY: 602,
        hitTriggered: false,
        bellTriggered: false,
      };

      // Score out of 300 (integer sum of up to 3 strikes)
      const t = this.model.totals;
      this.ctx.setScore(t[0], t[1]);
    }
  }

  update(dt: number) {
    if (this.paused || this.reported) return;
    this.totalElapsed += dt;
    this.view.update(dt);
    this.turnWait = Math.max(0, this.turnWait - dt);
    if (this.turnWait === 0 && !this.strikeAnim) {
      this.fixed.advance(dt, (step) => {
        // Refine visible needle timing within the same fixed simulation tick.
        for (let i = 0; i < 5 && !this.strikeAnim; i++) {
          this.model.update(step / 5);
          if (this.currentTurn === 1 && this.ai?.update(this.model))
            this.hit(1, true);
        }
      });
    } else this.fixed.reset();

    // Update camera shake
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 18);
    }

    // Update bell flash
    if (this.bellFlashAge > 0) {
      this.bellFlashAge = Math.max(0, this.bellFlashAge - dt);
    }

    // Stable spring and flight integration, independent of render rate.
    this.animationFixed.advance(dt, (step) => {
      this.ring.step(step);
      this.updateStrike(step);
    });

    // Update particles
    this.updateSparks(dt);

    // Render all elements
    this.render();

    // Update UI text & badges
    this.updateUI();

    // Match end check
    if (this.model.done) {
      this.finishAge += dt;
      if (this.finishAge > 1.4 && !this.reported) {
        this.reported = true;
        // Final score card is averaged as requested!
        this.ctx.finish({
          winner: this.model.winner!,
          scores: this.model.averages,
        });
      }
    }
  }

  private updateStrike(dt: number) {
    if (!this.strikeAnim) {
      // Idle hammer breathing
      this.hammerAngle = this.hammerRestAngle;
      return;
    }

    const anim = this.strikeAnim;
    anim.elapsed += dt;
    const t = anim.elapsed;

    if (t < 0.07) this.hammerAngle = this.hammerRestAngle - (t / 0.07) * 0.42;
    else if (t < 0.16)
      this.hammerAngle =
        this.hammerRestAngle - 0.42 + Math.pow((t - 0.07) / 0.09, 2) * 1.3;
    else {
      if (!anim.hitTriggered) {
        anim.hitTriggered = true;
        this.ctx.audio.play("wood", 0.8);
        this.cameraShake = 3;
      }
      this.hammerAngle =
        this.hammerRestAngle + 0.88 * Math.max(0, 1 - (t - 0.16) / 0.3);
      anim.physics.step(dt);
      anim.puckY = anim.physics.y;
      if (anim.physics.peaked && !anim.bellTriggered) {
        anim.bellTriggered = true;
        anim.peakY = anim.puckY;
        if (anim.physics.contacted) {
          this.ring.strike();
          this.ctx.audio.play("perfect");
          this.bellFlashAge = 0.6;
          this.spawnSparks(210, 244, 0xffea00, 8);
        } else this.ctx.audio.play("metal", 0.4);
        this.popupText
          .setText(String(anim.score))
          .setColor(anim.player === 0 ? "#b85e20" : "#22789e");
      }
      if (anim.bellTriggered) {
        const age = t - 0.16;
        this.popupText
          .setPosition(
            88 - 210,
            Math.max(220, anim.peakY) - 381 - Math.min(24, age * 24),
          )
          .setAlpha(Math.min(1, Math.max(0, (1.25 - t) / 0.35)))
          .setScale(1 + 0.08 * Math.exp(-age * 6));
      }
    }
    if (t >= 1.25 && anim.physics.settled) {
      this.popupText.setAlpha(0);
      this.strikeAnim = undefined;

      // Advance turn one-by-one
      if (!this.model.done) {
        const s0 = this.model.scores[0].length;
        const s1 = this.model.scores[1].length;
        if (this.currentTurn === 0) {
          if (s1 < 3) this.currentTurn = 1;
        } else {
          if (s0 < 3) this.currentTurn = 0;
        }
        this.turnWait =
          this.ai && this.currentTurn === 1
            ? 1.2 + this.ai.personality.tempo * 0.15
            : 0.65;
        this.model.clocks[this.currentTurn] = 0;
        this.model.cooldowns[this.currentTurn] = 0;
        this.view.set(!this.ai && this.currentTurn === 1);
      }
    }
  }

  private spawnSparks(cx: number, cy: number, color: number, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 120 + Math.random() * 180;
      this.sparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.5,
        color: Math.random() > 0.4 ? color : 0xffffff,
        size: 3 + Math.random() * 3,
      });
    }
  }

  private updateSparks(dt: number) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 380 * dt; // gravity
    }
  }

  private render() {
    const g = this.g;
    g.clear();

    const shakeX = (Math.random() - 0.5) * this.cameraShake;
    const shakeY = (Math.random() - 0.5) * this.cameraShake;

    // Field background (warm carnival peach / tan)
    rounded(
      g,
      24,
      112,
      372,
      538,
      20,
      turnBackground(this.currentTurn === 0 ? 1 : 2),
      4,
    );

    // 1. TOWER COLUMN BODY
    const towerLeft = 147 + shakeX;
    const towerRight = 273 + shakeX;
    const towerWidth = 126;
    const towerTop = 246 + shakeY;
    const towerBottom = 606 + shakeY;
    const segmentHeight = 36;
    const domeCX = 210 + shakeX;
    const domeCY = 212 + shakeY;

    // Full ring behind the tower, with a damped impact-driven rotation.
    circle(g, domeCX, domeCY, 83, 0x414b48, 4);
    circle(
      g,
      domeCX,
      domeCY,
      61,
      turnBackground(this.currentTurn === 0 ? 1 : 2),
      3,
    );
    for (const angle of [-2.95, -2.55, -2.15, -1.57, -0.99, -0.59, -0.19]) {
      const a = angle + this.ring.angle;
      this.drawStar(
        g,
        domeCX + Math.cos(a) * 72,
        domeCY + Math.sin(a) * 72,
        7,
        this.bellFlashAge > 0 ? 0xffe77a : 0xffffff,
        1,
      );
    }

    // Golden dome cap underneath (merges seamlessly into column)
    g.fillStyle(0xfec32e);
    g.beginPath();
    g.arc(domeCX, domeCY, 63, Math.PI, 0, false);
    g.closePath();
    g.fillPath();
    g.fillRect(towerLeft, domeCY, towerWidth, towerTop - domeCY);

    // Alternating golden yellow bands
    for (let i = 0; i < 10; i++) {
      const y = towerBottom - (i + 1) * segmentHeight;
      const fill = i % 2 === 0 ? 0xfec32e : 0xfca71a;
      g.fillStyle(fill).fillRect(towerLeft, y, towerWidth, segmentHeight);
    }

    // Continuous tower outline (curved dome top + vertical sides)
    g.lineStyle(4, theme.ink);
    g.beginPath();
    g.moveTo(towerLeft, towerBottom);
    g.lineTo(towerLeft, domeCY);
    g.arc(domeCX, domeCY, 63, Math.PI, 0, false);
    g.lineTo(towerRight, towerBottom);
    g.lineTo(towerLeft, towerBottom);
    g.strokePath();

    // 2. WHITE VERTICAL GUIDE RAIL
    g.lineStyle(6, 0xffffff).lineBetween(domeCX, domeCY, domeCX, towerBottom);

    // 4. TOP GREEN "100" BELL / BULLSEYE
    circle(g, domeCX, domeCY, 32, 0x2ecc71, 4);

    // Bell ring flash aura
    if (this.bellFlashAge > 0) {
      const auraAlpha = this.bellFlashAge / 0.6;
      g.lineStyle(6, 0xffea00, auraAlpha).strokeCircle(
        domeCX,
        domeCY,
        36 + (1 - auraAlpha) * 18,
      );
    }

    // 5. BASE ANVIL & PIVOT
    // Dark anvil base block
    rounded(g, 120 + shakeX, 606 + shakeY, 180, 40, 10, 0x353b42, 4);

    // Red strike pad
    rounded(g, 197 + shakeX, 592 + shakeY, 26, 22, 6, 0xe74c3c, 3);

    // Center pivot hinge
    circle(g, 210 + shakeX, 614 + shakeY, 9, 0x2b3036, 3);
    circle(g, 210 + shakeX, 614 + shakeY, 4, theme.ink, 0);

    // 6. TIMING NEEDLE GAUGE (reflects current turn player!)
    const activePlayer = this.currentTurn;
    const isHold =
      this.model.cooldowns[activePlayer] > 0 &&
      this.model.scores[activePlayer].length > 0;
    const needlePos = isHold
      ? this.model.locked[activePlayer]
      : this.model.position(activePlayer);

    const needleAngle = needlePos * 0.64; // ~ +/- 37 degrees
    const pivotX = 210 + shakeX;
    const pivotY = 614 + shakeY;
    const needleLen = 70;
    const tipX = pivotX + Math.sin(needleAngle) * needleLen;
    const tipY = pivotY - Math.cos(needleAngle) * needleLen;

    // Draw needle
    g.lineStyle(4, theme.ink);
    g.lineBetween(pivotX, pivotY, tipX, tipY);
    circle(g, tipX, tipY, 3, theme.ink, 0);

    // 7. RISING STRIKER PUCK
    const puckY = this.strikeAnim
      ? this.strikeAnim.puckY + shakeY
      : 602 + shakeY;
    rounded(g, 198 + shakeX, puckY - 10, 24, 20, 6, 0xe74c3c, 3);

    // 8. ANIMATED HAMMER
    this.drawHammer(g, shakeX, shakeY);

    // 9. SPARKS
    for (const s of this.sparks) {
      const alpha = s.life / s.maxLife;
      g.fillStyle(s.color, alpha).fillCircle(s.x, s.y, s.size);
    }

    // 11. STRIKE PIPS (3 dots for each player at bottom corners)
    // P1 (Orange) pips on bottom left
    for (let i = 0; i < 3; i++) {
      const s = this.model.scores[0][i];
      const filled = s !== undefined;
      circle(g, 42 + i * 22, 626, 7, filled ? theme.orange : theme.paper, 2);
    }
    // P2 (Blue) pips on bottom right
    for (let i = 0; i < 3; i++) {
      const s = this.model.scores[1][i];
      const filled = s !== undefined;
      circle(g, 334 + i * 22, 626, 7, filled ? theme.blue : theme.paper, 2);
    }
  }

  private drawStar(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    r: number,
    color: number,
    line = 2,
  ) {
    const points: { x: number; y: number }[] = [];
    const innerR = r * 0.44;
    for (let i = 0; i < 10; i++) {
      const rad = (i * Math.PI) / 5 - Math.PI / 2;
      const radDist = i % 2 === 0 ? r : innerR;
      points.push({
        x: cx + Math.cos(rad) * radDist,
        y: cy + Math.sin(rad) * radDist,
      });
    }
    g.fillStyle(color);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.closePath();
    g.fillPath();
    if (line) {
      g.lineStyle(line, theme.ink);
      g.strokePath();
    }
  }

  private drawHammer(
    g: Phaser.GameObjects.Graphics,
    shakeX: number,
    shakeY: number,
  ) {
    // Hammer grip colored according to the current turn player!
    const activePlayer = this.strikeAnim
      ? this.strikeAnim.player
      : this.currentTurn;
    const gripColor = activePlayer === 0 ? theme.orange : theme.blue;

    // Keep the grip planted; rotate the head onto the anvil without a position snap.
    const pivotX = 300 + shakeX;
    const pivotY = 600 + shakeY;
    const angle = 0.32 - (this.hammerAngle - 0.32) * 2.32;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rot = (dx: number, dy: number) => ({
      x: pivotX + dx * cos - (dy - 86) * sin,
      y: pivotY + dx * sin + (dy - 86) * cos,
    });

    // 1. Hammer Handle
    // Length 84px, width 14px
    const p1 = rot(-6, 0);
    const p2 = rot(6, 0);
    const p3 = rot(6, 84);
    const p4 = rot(-6, 84);

    g.fillStyle(0x8c502b); // Wood brown
    g.beginPath();
    g.moveTo(p1.x, p1.y);
    g.lineTo(p2.x, p2.y);
    g.lineTo(p3.x, p3.y);
    g.lineTo(p4.x, p4.y);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, theme.ink);
    g.strokePath();

    // Grip band
    const g1 = rot(-6, 38);
    const g2 = rot(6, 38);
    const g3 = rot(6, 70);
    const g4 = rot(-6, 70);
    g.fillStyle(gripColor);
    g.beginPath();
    g.moveTo(g1.x, g1.y);
    g.lineTo(g2.x, g2.y);
    g.lineTo(g3.x, g3.y);
    g.lineTo(g4.x, g4.y);
    g.closePath();
    g.fillPath();

    // Handle end pommel
    const pommel = rot(0, 86);
    circle(g, pommel.x, pommel.y, 6, 0x8c502b, 3);

    // 2. Hammer Head
    // Width 64, height 36
    const headCorners = [
      rot(-32, -18),
      rot(32, -18),
      rot(32, 18),
      rot(-32, 18),
    ];
    g.fillStyle(0x41474d); // Steel grey
    g.beginPath();
    g.moveTo(headCorners[0].x, headCorners[0].y);
    g.lineTo(headCorners[1].x, headCorners[1].y);
    g.lineTo(headCorners[2].x, headCorners[2].y);
    g.lineTo(headCorners[3].x, headCorners[3].y);
    g.closePath();
    g.fillPath();
    g.lineStyle(4, theme.ink);
    g.strokePath();

    // Head top fastener pin
    const pin1 = rot(-6, -24);
    const pin2 = rot(6, -24);
    const pin3 = rot(6, -18);
    const pin4 = rot(-6, -18);
    g.fillStyle(0x2b3036);
    g.beginPath();
    g.moveTo(pin1.x, pin1.y);
    g.lineTo(pin2.x, pin2.y);
    g.lineTo(pin3.x, pin3.y);
    g.lineTo(pin4.x, pin4.y);
    g.closePath();
    g.fillPath();
    g.lineStyle(2, theme.ink);
    g.strokePath();
  }

  private updateUI() {
    const s0 = this.model.scores[0];
    const s1 = this.model.scores[1];

    if (this.model.done) {
      this.turnBadgeText.setText("AVERAGE WINS");
      return;
    }

    const count = this.currentTurn === 0 ? s0.length : s1.length;
    let roundNum: number;
    if (this.strikeAnim && this.strikeAnim.player === this.currentTurn) {
      roundNum = Math.min(3, Math.max(1, count));
    } else {
      roundNum = Math.min(3, count + 1);
    }

    if (this.currentTurn === 0) {
      this.turnBadgeText.setText(`${roundNum} / 3`);
    } else {
      const p2Name = this.ai ? "AI" : "BLUE";
      this.turnBadgeText.setText(`${roundNum} / 3`);
    }
  }

  pause() {
    this.fixed.reset();
    this.animationFixed.reset();
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
      scores: this.model.scores.map((s) => [...s]),
      totals: this.model.totals,
      averages: this.model.averages,
      clocks: [...this.model.clocks],
      positions: [this.model.position(0), this.model.position(1)],
      cooldowns: [...this.model.cooldowns],
      winner: this.model.winner,
      turn: this.currentTurn,
      turnWait: this.turnWait,
      rotation: this.view.rotation,
      ringAngle: this.ring.angle,
      puckY: this.strikeAnim?.puckY ?? 602,
    };
  }
}
