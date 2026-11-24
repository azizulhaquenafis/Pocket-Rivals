import type { Course, Rect } from "../courses";
import { oil } from "../courses/foundry";

/** Static course overview: no world, AI, assets or physics initialization. */
export function courseArt(c: Course) {
  const rect = (r: Rect, fill: string, stroke = "", rx = 0) =>
    `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${rx}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="8"` : ""}/>`;

  const bgFill =
    c.id === "horizon"
      ? "#1f1b36"
      : c.id === "shoreline"
        ? "#57b2ca"
        : c.id === "foundry"
          ? "#e6dbc2"
          : "#cde0ae";

  const decor =
    c.id === "horizon"
      ? `<circle cx="380" cy="300" r="240" fill="#6f4eb8" opacity=".24"/><circle cx="1450" cy="860" r="260" fill="#398da8" opacity=".22"/>${[
          [180, 320],
          [420, 880],
          [820, 230],
          [1160, 890],
          [1650, 240],
          [1060, 620],
          [1480, 990],
          [260, 620],
          [1720, 990],
          [680, 440],
        ]
          .map(
            ([x, y], i) =>
              `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 11 : 7}" fill="#fffdf5" opacity=".78"/>`,
          )
          .join("")}`
      : c.id === "shoreline"
        ? `<circle cx="715" cy="515" r="34" fill="#ecd595" stroke="#242b32" stroke-width="7"/><circle cx="1135" cy="515" r="34" fill="#ecd595" stroke="#242b32" stroke-width="7"/>`
        : "";

  const ground = c.ground
    ? c.id === "shoreline"
      ? c.ground
          .map((r) =>
            rect(
              { x: r.x - 18, y: r.y - 18, w: r.w + 36, h: r.h + 36 },
              "#95e6ef",
              "",
              24,
            ),
          )
          .join("") +
        c.ground
          .map((r) =>
            rect(
              { x: r.x - 7, y: r.y - 7, w: r.w + 14, h: r.h + 14 },
              "#242b32",
              "",
              10,
            ),
          )
          .join("") +
        c.ground.map((r) => rect(r, "#f6e2a5")).join("")
      : c.ground
          .map((r) =>
            rect(
              { x: r.x - 10, y: r.y - 10, w: r.w + 20, h: r.h + 20 },
              "#7d8be8",
              "",
              12,
            ),
          )
          .join("") +
        c.ground
          .map((r) =>
            rect(
              { x: r.x - 5, y: r.y - 5, w: r.w + 10, h: r.h + 10 },
              "#242b32",
              "",
              8,
            ),
          )
          .join("") +
        c.ground.map((r) => rect(r, "#dcd6f0")).join("")
    : "";

  const surfaces = c.surfaces
    .map((s) =>
      rect(
        s,
        (
          {
            slick: c.id === "horizon" ? "#9ce8fa" : "#96dcd6",
            mud: "#7c563b",
            quicksand: "#e2aa4d",
            sand: "#e2b05c",
            belt: "#4b535c",
            wind: "#88a2f4",
            ford: "#72cedb",
          } as const
        )[s.kind],
      ),
    )
    .join("");
  const oilEl =
    c.id === "foundry"
      ? `<circle cx="${oil.x}" cy="${oil.y}" r="${oil.r}" fill="#222830" stroke="#242b32" stroke-width="8"/>`
      : "";
  const lava = (c.lava ?? [])
    .map(
      (v) =>
        `<circle cx="${v.x}" cy="${v.y}" r="${v.r}" fill="#e8542c" stroke="#242b32" stroke-width="8"/><circle cx="${v.x}" cy="${v.y}" r="${v.r * 0.52}" fill="#ffe278"/>`,
    )
    .join("");
  const bridges = [...(c.bridges ?? []), ...(c.planks ?? []).flat()]
    .map((r) => rect(r, "#e3be84", "#6e5134"))
    .join("");
  const fields = c.fields
    .map(
      (f) =>
        `<circle cx="${f.x}" cy="${f.y}" r="${f.r}" fill="${c.id === "shoreline" ? "#1e6782" : c.id === "foundry" ? "#4e9cd4" : "#9c7ce8"}" opacity=".28" stroke="${c.id === "shoreline" ? "#d8f7ff" : "#7868a6"}" stroke-width="7"/>${f.core ? `<circle cx="${f.x}" cy="${f.y}" r="${f.core}" fill="${c.id === "foundry" ? "#e5594c" : "#251742"}" stroke="#242b32" stroke-width="7"/>` : ""}`,
    )
    .join("");
  const circles = c.circles
    .map(
      (v) =>
        `<circle cx="${v.x}" cy="${v.y}" r="${v.r}" fill="${v.bounce ? "#f29652" : "#58addb"}" stroke="#242b32" stroke-width="7"/>`,
    )
    .join("");
  const movers = c.movers
    .map((m) =>
      m.r
        ? `<circle cx="${(m.from.x + m.to.x) / 2}" cy="${(m.from.y + m.to.y) / 2}" r="${m.r}" fill="${c.id === "horizon" ? "#988fb0" : "#8f9986"}" stroke="#242b32" stroke-width="7"/>`
        : rect(
            {
              x: (m.from.x + m.to.x) / 2,
              y: (m.from.y + m.to.y) / 2,
              w: m.w ?? 10,
              h: m.h ?? 10,
            },
            c.id === "shoreline" ? "#f29352" : "#58addb",
            "#242b32",
          ),
    )
    .join("");
  const walls = c.walls
    .map((r) => rect(r, c.id === "temple" ? "#7c906e" : "#6d7b85", "#242b32"))
    .join("");
  const fans = c.fans
    .map(
      (f) =>
        `<g transform="translate(${f.x} ${f.y}) rotate(35)"><path d="M${-f.length / 2} 0h${f.length}M0 ${-f.length / 2}v${f.length}" stroke="#242b32" stroke-width="22"/><circle r="${f.hub}" fill="#f49b58"/></g>`,
    )
    .join("");
  const portals = (c.portals ?? [])
    .map((p, i) => {
      const col = ["#f29e57", "#58addb", "#c98cf0"][i] ?? "#f29e57";
      return `<circle cx="${p.from.x}" cy="${p.from.y}" r="26" fill="${col}" stroke="#242b32" stroke-width="8"/><circle cx="${p.from.x}" cy="${p.from.y}" r="13" fill="#1b152f"/><circle cx="${p.to.x}" cy="${p.to.y}" r="26" fill="none" stroke="${col}" stroke-width="10"/>`;
    })
    .join("");
  const plates = (c.plates ?? [])
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="24" fill="#f4d06b" stroke="#242b32" stroke-width="7"/>`,
    )
    .join("");
  return `<svg class="golf-course-preview" viewBox="0 0 1010 1920" aria-hidden="true"><g transform="translate(1080 0) rotate(90)">${rect({ x: 0, y: 70, w: 1920, h: 1010 }, bgFill)}${decor}${ground}${c.river ? rect(c.river, "#4fa7cf") : ""}${surfaces}${oilEl}${bridges}${fields}${lava}${portals}${walls}${circles}${movers}${fans}${c.lasers.map((r) => rect(r, "#ef584c")).join("")}${(c.doors ?? []).map((r) => rect(r, "#e3944c", "#242b32")).join("")}${plates}<circle cx="${c.hole.x}" cy="${c.hole.y}" r="24" fill="#242b32"/><path d="M${c.hole.x} ${c.hole.y}h-72v-48l34 48" fill="#f49b58" stroke="#242b32" stroke-width="8" stroke-linejoin="round"/><circle cx="${c.start.x}" cy="${c.start.y}" r="21" fill="#fffdf5" stroke="#ed9a55" stroke-width="12"/></g></svg>`;
}
