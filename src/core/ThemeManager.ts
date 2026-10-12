export const theme = {
  ink: 0x242b32,
  paper: 0xf8f5eb,
  orange: 0xf49b58,
  blue: 0x58addb,
  green: 0xb8d998,
  ice: 0xc8e7eb,
  peach: 0xf3bdab,
  white: 0xfffdf5,
  muted: 0x7d8583,
  line: 0x93ada5,
};
export const W = 420,
  H = 760;
export const FIELD = {
  left: 24,
  right: 396,
  top: 112,
  bottom: 650,
  middle: 381,
};
export const cssColor = (color: number) =>
  `#${color.toString(16).padStart(6, "0")}`;
