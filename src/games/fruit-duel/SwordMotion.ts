/** The same recovery durations drive both legal input and visible sword return. */
export const SWING_IMPACT = 0.15;
export const HIT_RECOVERY = 0.72;
export const MISS_RECOVERY = 1.35;
const smooth = (t: number) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
};
type Pose = { x: number; y: number; angle: number };
const rest: Pose[] = [
  { x: 322, y: 615, angle: -0.25 },
  { x: 98, y: 615, angle: 1.6 },
];
const wind: Pose[] = [
  { x: 338, y: 624, angle: -0.4 },
  { x: 82, y: 624, angle: 1.75 },
];
const impact: Pose[] = [
  { x: 300, y: 575, angle: 0.4 },
  { x: 120, y: 575, angle: 1.15 },
];
const follow: Pose[] = [
  { x: 180, y: 560, angle: 1.25 },
  { x: 240, y: 560, angle: 0.1 },
];
function mix(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return { ...a };
  if (t >= 1) return { ...b };
  const s = smooth(t);
  return {
    x: a.x + (b.x - a.x) * s,
    y: a.y + (b.y - a.y) * s,
    angle: a.angle + (b.angle - a.angle) * s,
  };
}
export function swordPose(
  player: 0 | 1,
  attempt: number,
  age: number,
  duration: number,
): Pose {
  const from = 0,
    to = 0;
  let pose: Pose;
  if (attempt === 0) pose = rest[0];
  else if (age < 0.065) pose = mix(rest[from], wind[from], age / 0.065);
  else if (age < SWING_IMPACT)
    pose = mix(
      wind[from],
      impact[from],
      (age - 0.065) / (SWING_IMPACT - 0.065),
    );
  else if (age < 0.26)
    pose = mix(
      impact[from],
      follow[from],
      (age - SWING_IMPACT) / (0.26 - SWING_IMPACT),
    );
  else pose = mix(follow[from], rest[to], (age - 0.26) / (duration - 0.26));
  return player === 0
    ? { ...pose }
    : { x: 420 - pose.x, y: 762 - pose.y, angle: pose.angle + Math.PI };
}
