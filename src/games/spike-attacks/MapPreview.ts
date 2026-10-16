import type { SpikeMap } from "./Maps";
/** Tiny metadata-only illustration, generated from the same cover positions as gameplay. */
export function mapPreview(map?: SpikeMap) {
  const blocks = map?.blocks ?? [
    { x: 0, y: 0, w: 72, h: 72 },
    { x: 160, y: 80, w: 72, h: 72 },
    { x: 240, y: 240, w: 80, h: 80 },
  ];
  const floor = map?.floor ?? [0xe6dce8, 0xd4dbe4];
  const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;
  let tiles = "";
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++)
      tiles += `<rect x="${20 + x * 80}" y="${20 + y * 80}" width="80" height="80" fill="${hex(floor[(x + y) % 2])}"/>`;
  return `<svg class="map-preview" width="80" height="80" viewBox="0 0 360 360" aria-hidden="true"><rect x="11" y="11" width="338" height="338" rx="15" fill="#242b32"/>${tiles}${blocks.map((b) => `<rect x="${b.x + 20}" y="${b.y + 23}" width="${b.w}" height="${b.h}" rx="8" fill="#66546f"/><rect x="${b.x + 20}" y="${b.y + 20}" width="${b.w}" height="${b.h}" rx="8" fill="#93809c" stroke="#242b32" stroke-width="7"/>`).join("")}${map ? '<circle cx="128" cy="228" r="14" fill="#f49b58" stroke="#242b32" stroke-width="5"/><circle cx="232" cy="228" r="14" fill="#58addb" stroke="#242b32" stroke-width="5"/>' : '<circle cx="180" cy="180" r="63" fill="#fffdf5" stroke="#242b32" stroke-width="7"/><path d="M160 160q0-30 25-30 35 0 27 30-3 12-25 23v14" fill="none" stroke="#242b32" stroke-width="13" stroke-linecap="round"/><circle cx="187" cy="218" r="7" fill="#242b32"/>'}</svg>`;
}
