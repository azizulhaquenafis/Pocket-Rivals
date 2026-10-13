export function modeArt(mode: "ai" | "casual" | "local") {
  const ball = (x: number, y: number, color: string) =>
    `<circle cx="${x}" cy="${y}" r="15" fill="${color}" stroke="#242b32" stroke-width="4"/><circle cx="${x - 4}" cy="${y - 4}" r="3" fill="#fffdf5"/>`;
  return `<svg viewBox="0 0 110 90" aria-hidden="true"><rect x="4" y="6" width="102" height="78" rx="22" fill="#d9e9bc" stroke="#242b32" stroke-width="4"/><path d="M22 60 Q55 73 77 29" fill="none" stroke="#fffdf5" stroke-width="5" stroke-dasharray="5 5"/><ellipse cx="81" cy="34" rx="10" ry="5" fill="#242b32"/><path d="M81 34 V11 L99 17 81 23" fill="#f2a360" stroke="#242b32" stroke-width="3"/>${ball(27, 61, "#f2a360")}${mode !== "casual" ? ball(57, 46, "#58addb") : ""}${mode === "ai" ? '<path d="M51 43h3m7 0h3m-14 8h14" stroke="#242b32" stroke-width="3"/>' : ""}</svg>`;
}
