import {
  checkEdge,
  DESK,
  edgeDistance,
  pens,
  physicsStep,
  stopped,
  strike,
  type Desk,
  type Pen,
  type Shot,
} from "./PenPhysics";

const STEP = 1 / 240;
const OPENING_LIMIT = 0.74;
const FLICKS_PER_DESK = 6;
const ROUND_FLICKS = 18;
const DESKS: readonly Desk[] = [0, 21, 42].map((inset) => ({
  left: DESK.left + inset,
  right: DESK.right - inset,
  top: DESK.top + inset,
  bottom: DESK.bottom - inset,
}));

export function deskForShots(completed: number) {
  return DESKS[
    Math.min(DESKS.length - 1, Math.floor(completed / FLICKS_PER_DESK))
  ];
}

export function shotFromPull(
  dx: number,
  dy: number,
  offset: number,
): Shot | null {
  const distance = Math.hypot(dx, dy);
  if (distance < 9) return null;
  return {
    angle: Math.atan2(dy, dx),
    power: Math.min(1, distance / 90),
    offset,
  };
}

export function powerLimit(completed: number) {
  return completed < 2 ? OPENING_LIMIT : 1;
}

function flick(pen: Pen, shot: Shot, completed: number) {
  if (!Number.isFinite(shot.power)) return false;
  return strike(pen, {
    ...shot,
    power: Math.min(shot.power, powerLimit(completed)),
  });
}

function checkSmallerDesk(pair: [Pen, Pen], completed: number, desk: Desk) {
  const next = deskForShots(completed);
  if (next === desk || pair.some((pen) => pen.out)) return desk;
  for (const pen of pair) checkEdge(pen, next);
  return next;
}

type RoundReason = "edge" | "double-out" | "smaller-desk" | "pressure" | "even";

export class PenMatch {
  bodies = pens();
  scores: [number, number] = [0, 0];
  pressure: [number, number] = [0, 0];
  desk = deskForShots(0);
  turn: 0 | 1 = 0;
  phase: "aim" | "moving" | "between" | "done" = "aim";
  winner: 1 | 2 | "draw" | null = null;
  roundWinner: 0 | 1 | "draw" | null = null;
  roundReason: RoundReason | null = null;
  round = 1;
  remaining = 120;
  shots = 0;
  totalShots = 0;
  serial = 0;
  impacts = 0;
  private calm = 0;
  private age = 0;
  private draws = 0;
  private rivalClearance = 0;

  get nextShrink() {
    if (this.desk === DESKS[DESKS.length - 1]) return null;
    const completed = this.phase === "moving" ? this.shots - 1 : this.shots;
    const inFlicks = FLICKS_PER_DESK - (completed % FLICKS_PER_DESK);
    return { inFlicks, desk: deskForShots(completed + inFlicks) };
  }

  get flicksLeft() {
    return ROUND_FLICKS - this.shots;
  }

  /** Uncapped foreground elapsed time; an accepted flick resolves at the buzzer. */
  advanceClock(dt: number) {
    if (this.phase === "done" || !Number.isFinite(dt) || dt <= 0) return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining === 0 && this.phase !== "moving") this.finishMatch();
  }

  shoot(player: 0 | 1, shot: Shot) {
    if (
      this.phase !== "aim" ||
      this.turn !== player ||
      this.remaining === 0 ||
      !flick(this.bodies[player], shot, this.shots)
    )
      return false;

    this.rivalClearance = edgeDistance(this.bodies[1 - player], this.desk);
    this.phase = "moving";
    this.shots++;
    this.totalShots++;
    this.serial++;
    this.age = this.calm = 0;
    return true;
  }

  step(dt: number) {
    if (this.phase === "done" || this.phase === "aim") return;
    this.age += dt;
    if (this.phase === "between") {
      if (this.age >= 1) {
        this.round++;
        this.bodies = pens(this.round);
        this.desk = deskForShots(0);
        this.pressure = [0, 0];
        this.turn = this.round % 2 === 1 ? 0 : 1;
        this.shots = 0;
        this.roundWinner = null;
        this.roundReason = null;
        this.phase = "aim";
      }
      return;
    }
    const steps = Math.max(1, Math.ceil(dt / STEP));
    for (let n = 0; n < steps; n++)
      if (physicsStep(this.bodies, dt / steps, this.desk) > 3) this.impacts++;
    this.calm = this.bodies.every(stopped) ? this.calm + dt : 0;
    if (this.calm >= 0.13) this.settleFlick();
  }

  private settleFlick() {
    const [a, b] = this.bodies;
    const rival = this.bodies[1 - this.turn];
    this.pressure[this.turn] += Math.max(
      0,
      this.rivalClearance - edgeDistance(rival, this.desk),
    );

    const previous = this.desk;
    this.desk = checkSmallerDesk(this.bodies, this.shots, previous);
    if (a.out && b.out) {
      this.finishRound(
        "draw",
        this.desk === previous ? "double-out" : "smaller-desk",
      );
    } else if (a.out || b.out) {
      this.finishRound(
        a.out ? 1 : 0,
        this.desk === previous ? "edge" : "smaller-desk",
      );
    } else if (this.flicksLeft === 0) {
      const lead = this.pressure[0] - this.pressure[1];
      this.finishRound(
        Math.abs(lead) < 1 ? "draw" : lead > 0 ? 0 : 1,
        Math.abs(lead) < 1 ? "even" : "pressure",
      );
    } else {
      this.turn = this.turn === 0 ? 1 : 0;
      this.phase = "aim";
    }
    if (this.remaining === 0 && this.phase !== "done") this.finishMatch();
  }

  private finishRound(winner: 0 | 1 | "draw", reason: RoundReason) {
    this.roundWinner = winner;
    this.roundReason = reason;
    if (winner === "draw") this.draws++;
    else {
      this.scores[winner]++;
      this.draws = 0;
    }
    this.age = 0;
    if (this.scores[0] === 3 || this.scores[1] === 3 || this.draws === 3)
      this.finishMatch();
    else {
      this.phase = "between";
      this.serial++;
    }
  }

  private finishMatch() {
    this.winner =
      this.scores[0] === this.scores[1]
        ? "draw"
        : this.scores[0] > this.scores[1]
          ? 1
          : 2;
    this.phase = "done";
    this.serial++;
  }

  snapshot() {
    return {
      bodies: this.bodies.map((p) => ({ ...p })),
      desk: { ...this.desk },
      nextShrink: this.nextShrink,
      scores: [...this.scores],
      pressure: [...this.pressure],
      turn: this.turn,
      phase: this.phase,
      round: this.round,
      roundWinner: this.roundWinner,
      roundReason: this.roundReason,
      winner: this.winner,
      shots: this.shots,
      totalShots: this.totalShots,
      remaining: this.remaining,
      serial: this.serial,
      impacts: this.impacts,
    };
  }
}

export function simulateShot(
  bodies: Pen[],
  player: 0 | 1,
  shot: Shot,
  completed = 0,
) {
  const pair = bodies.map((p) => ({ ...p })) as [Pen, Pen];
  const desk = deskForShots(completed);
  if (!flick(pair[player], shot, completed)) return pair;
  for (let i = 0; i < 840; i++) {
    physicsStep(pair, STEP, desk);
    if (pair.every(stopped)) break;
  }
  checkSmallerDesk(pair, completed + 1, desk);
  return pair;
}

/** Draw the same physical flight up to the first meaningful contact or stop. */
export function previewFlick(
  bodies: [Pen, Pen],
  player: 0 | 1,
  shot: Shot,
  completed: number,
) {
  const pair = bodies.map((pen) => ({ ...pen })) as [Pen, Pen];
  const points: { x: number; y: number }[] = [];
  const pen = pair[player];
  const desk = deskForShots(completed);
  if (!flick(pen, shot, completed)) return points;

  let previousX = pen.x;
  let previousY = pen.y;
  for (let i = 0; i < 600; i++) {
    const impact = physicsStep(pair, STEP, desk) > 3;
    const travel = Math.hypot(pen.x - previousX, pen.y - previousY);
    if (travel >= 16 || (travel > 6 && (impact || stopped(pen)))) {
      points.push({ x: pen.x, y: pen.y });
      previousX = pen.x;
      previousY = pen.y;
    }
    if (impact || stopped(pen)) break;
  }
  return points;
}
