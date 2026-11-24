export function modeArt(mode: "ai" | "casual" | "local") {
  const ball = (x: number, y: number, color: string) =>
    `<circle cx="${x}" cy="${y}" r="14" fill="${color}" stroke="#242b32" stroke-width="4"/><circle cx="${x - 4}" cy="${y - 4}" r="3.2" fill="#fffdf5"/>`;
  return `<svg viewBox="0 0 110 90" aria-hidden="true"><rect x="4" y="6" width="102" height="78" rx="22" fill="${mode === "casual" ? "#cde4a8" : "#f6e3be"}" stroke="#242b32" stroke-width="4"/><path d="M12 68 Q48 56 98 64 L98 78 Q98 84 92 84 L18 84 Q12 84 12 78 Z" fill="#b4d48c" opacity=".65"/><path d="M26 60 Q54 71 78 32" fill="none" stroke="#fffdf5" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="5 6"/><ellipse cx="81" cy="34" rx="11" ry="5.5" fill="#242b32"/><path d="M81 34 V11 L99 17.5 81 24" fill="#f2a360" stroke="#242b32" stroke-width="3" stroke-linejoin="round"/>${ball(27, 60, "#f2a360")}${mode !== "casual" ? ball(55, 48, "#58addb") : ""}</svg>`;
}
