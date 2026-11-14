/** Full 180° sweep, including tip radius, stays inside the tower's 147..273 sides. */
export const NEEDLE_LENGTH = 54;
export function needleTip(position: number) {
  const angle = (Math.max(-1, Math.min(1, position)) * Math.PI) / 2;
  return {
    x: 210 + Math.sin(angle) * NEEDLE_LENGTH,
    y: 614 - Math.cos(angle) * NEEDLE_LENGTH,
  };
}
