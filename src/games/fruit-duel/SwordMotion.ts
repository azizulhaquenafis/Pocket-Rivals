/** The same recovery durations drive both legal input and visible sword return. */
export const SWING_IMPACT = 0.15;
export const HIT_RECOVERY = 0.85;
export const MISS_RECOVERY = 2.4;
const WIND_END = 0.045;
const FOLLOW_END = 0.25;
const RECOIL_END = 0.34;
const smooth = (t: number) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
};
const easeOut = (t: number) => {
  const u = 1 - Math.max(0, Math.min(1, t));
  return 1 - u * u * u;
};
export type Pose = { x: number; y: number; angle: number };
// Natural forehand slash from bottom-right poised stance across center (210, 381) to lower-left.
const restPose: Pose = { x: 322, y: 604, angle: 0.6 };
const windPose: Pose = { x: 336, y: 600, angle: 0.78 };
const impactPose: Pose = { x: 292, y: 566, angle: 0.3 };
const followPose: Pose = { x: 230, y: 580, angle: -0.34 };
const decoyClankPose: Pose = { x: 304, y: 576, angle: 0.42 };
const decoyRecoilPose: Pose = { x: 334, y: 608, angle: 0.84 };

function mix(a: Pose, b: Pose, t: number, curve = smooth): Pose {
  if (t <= 0) return { ...a };
  if (t >= 1) return { ...b };
  const s = curve(t);
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
  recoil = false,
): Pose {
  let pose: Pose;
  if (attempt === 0 || age >= duration) {
    pose = restPose;
  } else if (age < WIND_END) {
    pose = mix(restPose, windPose, age / WIND_END);
  } else if (recoil) {
    if (age < SWING_IMPACT) {
      pose = mix(
        windPose,
        decoyClankPose,
        (age - WIND_END) / (SWING_IMPACT - WIND_END),
      );
    } else if (age < RECOIL_END) {
      const k = (age - SWING_IMPACT) / (RECOIL_END - SWING_IMPACT);
      pose = mix(decoyClankPose, decoyRecoilPose, k, easeOut);
      pose.angle += Math.sin(k * Math.PI * 5) * (1 - k) * 0.08;
    } else {
      pose = mix(
        decoyRecoilPose,
        restPose,
        (age - RECOIL_END) / (duration - RECOIL_END),
      );
    }
  } else if (age < SWING_IMPACT) {
    pose = mix(
      windPose,
      impactPose,
      (age - WIND_END) / (SWING_IMPACT - WIND_END),
    );
  } else if (age < FOLLOW_END) {
    pose = mix(
      impactPose,
      followPose,
      (age - SWING_IMPACT) / (FOLLOW_END - SWING_IMPACT),
      easeOut,
    );
  } else {
    pose = mix(
      followPose,
      restPose,
      (age - FOLLOW_END) / (duration - FOLLOW_END),
    );
  }
  return player === 0
    ? { ...pose }
    : { x: 420 - pose.x, y: 762 - pose.y, angle: pose.angle + Math.PI };
}
export function bladeTip(pose: Pose) {
  return {
    x: pose.x - 139 * Math.cos(pose.angle) + 154 * Math.sin(pose.angle),
    y: pose.y - 139 * Math.sin(pose.angle) - 154 * Math.cos(pose.angle),
  };
}
