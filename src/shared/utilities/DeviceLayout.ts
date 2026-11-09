/** Opposite-side play is for touch-primary devices; desktop always stays upright. */
export function oppositeSideLayout(): boolean {
  return (
    typeof matchMedia !== "undefined" &&
    matchMedia("(pointer: coarse)").matches &&
    !matchMedia("(hover: hover)").matches
  );
}
