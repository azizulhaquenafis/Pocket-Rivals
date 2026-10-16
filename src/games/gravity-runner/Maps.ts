/** Lightweight map metadata; no renderer or simulation enters the menu bundle. */
export const MAPS = [
  {
    id: "ice",
    name: "Icy Heights",
    traps: "Icicles, frost blocks & fractured paths",
    sky: 0xdceff7,
    haze: 0xb4d7ed,
    wall: 0x8eaec6,
    highlight: 0xbad6e8,
    edge: 0xeefaff,
    rail: 0x7899b4,
    detail: 0xffffff,
  },
  {
    id: "green",
    name: "Green Valley",
    traps: "Roots, brambles & fallen log rails",
    sky: 0xe6f1d6,
    haze: 0xbcdcca,
    wall: 0xb98265,
    highlight: 0xc89272,
    edge: 0x91bb72,
    rail: 0x879c74,
    detail: 0xcfe8a4,
  },
  {
    id: "blue",
    name: "Blue Lagoon",
    traps: "Pulsing water jets & floating buoys",
    sky: 0xcbe8f6,
    haze: 0x9bc9e8,
    wall: 0x698cac,
    highlight: 0x8eb6cf,
    edge: 0x80d6e1,
    rail: 0x6087a2,
    detail: 0xd1f3f5,
  },
  {
    id: "purple",
    name: "Violet Night",
    traps: "Crystal teeth & timed phase gates",
    sky: 0xe6def3,
    haze: 0xc0b0db,
    wall: 0x8d7ba8,
    highlight: 0xab98c1,
    edge: 0xc3b4e2,
    rail: 0x807498,
    detail: 0xeee2ff,
  },
] as const;
export type RunnerMap = (typeof MAPS)[number];
export function mapPreview(map?: RunnerMap) {
  const m = map ?? MAPS[0],
    hex = (v: number) => `#${v.toString(16).padStart(6, "0")}`;
  const traps =
    m.id === "ice"
      ? '<path d="M28 24l10 28 10-28M204 114l8-28 8 28" fill="#b6e3ef"/>'
      : m.id === "green"
        ? '<path d="M28 24l4 24h12l4-24M204 114l4-22h8l4 22" fill="#7d9e66"/>'
        : m.id === "blue"
          ? '<path d="M28 24v24h20V24M204 114V92h16v22" fill="#56b5d5"/><path d="M30 35h16m60 35h18" fill="none" stroke="#fff"/>'
          : '<path d="M38 24l10 13-10 13-10-13zM212 114l8-13-8-13-8 13z" fill="#b29ace"/>';
  return `<svg class="map-preview" aria-hidden="true" width="80" height="80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 138"><rect width="240" height="138" rx="16" fill="${hex(m.sky)}"/><g stroke="#252d32" stroke-width="4" stroke-linejoin="round"><path d="M0 0H240V24H165V10H95V24H0Z" fill="${hex(m.wall)}"/><path d="M0 138H240V114H165V128H95V114H0Z" fill="${hex(m.wall)}"/><rect x="76" y="58" width="110" height="22" rx="4" fill="${hex(m.rail)}"/>${traps}<circle cx="111" cy="94" r="10" fill="#f5a052"/><circle cx="152" cy="44" r="10" fill="#50abd6"/></g><path d="M20 67H51m-8-7 8 7-8 7" fill="none" stroke="#252d32" stroke-width="3" stroke-linecap="round"/>${map ? "" : '<text x="218" y="55" font-size="22" text-anchor="middle" fill="#252d32">?</text>'}</svg>`;
}
