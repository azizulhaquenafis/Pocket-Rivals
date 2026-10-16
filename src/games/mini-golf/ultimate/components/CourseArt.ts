import type { Course, Rect } from "../courses";
/** Static course overview: no world, AI, assets or physics initialization. */
export function courseArt(c: Course) {
  const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
  const rect = (r: Rect, fill: string, stroke = "", rx = 0) =>
    `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${rx}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="8"` : ""}/>`;
  const ground = c.ground
    ? c.ground.map((r) => rect(r, hex(c.color))).join("")
    : rect({ x: 0, y: 70, w: 1920, h: 1010 }, hex(c.color));
  const surfaces = c.surfaces
    .map((s) =>
      rect(
        s,
        (
          {
            slick: "#a6dce8",
            mud: "#ae8468",
            quicksand: "#d9b47e",
            sand: "#e9cf96",
            belt: "#a3ada4",
            wind: "#c3d4ed",
            ford: "#a8d2bc",
          } as const
        )[s.kind],
      ),
    )
    .join("");
  const bridges = [...(c.bridges ?? []), ...(c.planks ?? []).flat()]
    .map((r) => rect(r, "#e1be85", "#80694d"))
    .join("");
  const fields = c.fields
    .map(
      (f) =>
        `<circle cx="${f.x}" cy="${f.y}" r="${f.r}" fill="#9d8bc0" opacity=".25" stroke="#74658d" stroke-width="6"/>`,
    )
    .join("");
  const circles = c.circles
    .map(
      (v) =>
        `<circle cx="${v.x}" cy="${v.y}" r="${v.r}" fill="#edbd75" stroke="#242b32" stroke-width="7"/>`,
    )
    .join("");
  const movers = c.movers
    .map((m) =>
      m.r
        ? `<circle cx="${(m.from.x + m.to.x) / 2}" cy="${(m.from.y + m.to.y) / 2}" r="${m.r}" fill="#a1a99e" stroke="#242b32" stroke-width="7"/>`
        : rect(
            {
              x: (m.from.x + m.to.x) / 2,
              y: (m.from.y + m.to.y) / 2,
              w: m.w ?? 10,
              h: m.h ?? 10,
            },
            "#899a97",
            "#242b32",
          ),
    )
    .join("");
  const walls = c.walls.map((r) => rect(r, "#82977b", "#242b32")).join("");
  const fans = c.fans
    .map(
      (f) =>
        `<g transform="translate(${f.x} ${f.y}) rotate(35)"><path d="M${-f.length / 2} 0h${f.length}M0 ${-f.length / 2}v${f.length}" stroke="#242b32" stroke-width="22"/><circle r="${f.hub}" fill="#f49b58"/></g>`,
    )
    .join("");
  const portals = (c.portals ?? [])
    .map(
      (p) =>
        `<circle cx="${p.from.x}" cy="${p.from.y}" r="25" fill="#9b7fc4" stroke="#242b32" stroke-width="8"/><circle cx="${p.to.x}" cy="${p.to.y}" r="25" fill="#58addb" stroke="#242b32" stroke-width="8"/>`,
    )
    .join("");
  const plates = (c.plates ?? [])
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="23" fill="#f4b558" stroke="#242b32" stroke-width="6"/>`,
    )
    .join("");
  return `<svg class="golf-course-preview" viewBox="0 0 1010 1920" aria-hidden="true"><g transform="translate(1080 0) rotate(90)">${rect({ x: 0, y: 70, w: 1920, h: 1010 }, c.ground ? "#465164" : hex(c.color))}${ground}${c.river ? rect(c.river, "#69afd0") : ""}${surfaces}${bridges}${fields}${portals}${walls}${circles}${movers}${fans}${c.lasers.map((r) => rect(r, "#df8b7e")).join("")}${(c.doors ?? []).map((r) => rect(r, "#d3b571", "#242b32")).join("")}${plates}<circle cx="${c.hole.x}" cy="${c.hole.y}" r="25" fill="#242b32"/><path d="M${c.hole.x} ${c.hole.y}v-75l50 18-50 18" fill="#f49b58" stroke="#242b32" stroke-width="8"/><circle cx="${c.start.x}" cy="${c.start.y}" r="20" fill="#fffdf5" stroke="#ed9a55" stroke-width="12"/></g></svg>`;
}
