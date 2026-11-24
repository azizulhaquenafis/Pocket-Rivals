/** Full 180° sweep stays inside the 147..273 tower sides and cleanly above the 606 anvil base. */
export const NEEDLE_LENGTH = 54;
export const NEEDLE_PIVOT_Y = 598;
export function needleTip(position: number) {
  const angle = (Math.max(-1, Math.min(1, position)) * Math.PI) / 2;
  return {
    x: 210 + Math.sin(angle) * NEEDLE_LENGTH,
    y: NEEDLE_PIVOT_Y - Math.cos(angle) * NEEDLE_LENGTH,
  };
}
