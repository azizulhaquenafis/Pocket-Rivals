import type { ArcadeGuideItem } from "../../shared/arcade/ArcadeSetup";

export type PlanetClass = "feather" | "terran" | "giant" | "dense" | "super";

export type PlanetPattern =
  | "craters"
  | "clouds"
  | "icy"
  | "speckled"
  | "moss"
  | "continents"
  | "canyons"
  | "waves"
  | "ribbons"
  | "mesas"
  | "ringed"
  | "storm"
  | "cirrus"
  | "frost-ring"
  | "swirl"
  | "metallic"
  | "glossy"
  | "heavy-ring"
  | "magnetic"
  | "banded-steel"
  | "lava"
  | "crystal"
  | "atlas"
  | "gilded"
  | "geode";

export interface PlanetSpec {
  readonly id: string;
  readonly name: string;
  readonly kind: PlanetClass;
  /** Physical radius multiplier relative to tier base (represents volume). */
  readonly volume: number;
  /** Relative material density; pairs with volume to set gravitational pull. */
  readonly density: number;
  /** Peak pull fraction of the tier's fair maximum pull (0.52..1.00). */
  readonly pull: number;
  /** Halo reach multiplier relative to tier base field (0.84..1.26). */
  readonly field: number;
  readonly color: number;
  readonly accent: number;
  readonly ring?: number;
  readonly pattern: PlanetPattern;
}

export const PLANET_CLASSES: Record<
  PlanetClass,
  { readonly badge: string; readonly halo: number; readonly swatch: string }
> = {
  feather: { badge: "LOW G", halo: 0x89a8ba, swatch: "#cdebf5" },
  terran: { badge: "MID G", halo: 0x74608e, swatch: "#58addb" },
  giant: { badge: "WIDE G", halo: 0x8d6e9e, swatch: "#efc87d" },
  dense: { badge: "HIGH G", halo: 0xb96852, swatch: "#7e8e9e" },
  super: { badge: "MAX G", halo: 0xc9694a, swatch: "#9474bd" },
};

/** 25 distinct planet types spanning 5 volume/density classes with fair gravity bounds. */
export const PLANET_TYPES: readonly PlanetSpec[] = [
  // Feather / Low-Density Worlds (5): small-to-mid volume, low density -> gentle pull
  {
    id: "pumice",
    name: "Pumice Moon",
    kind: "feather",
    volume: 0.88,
    density: 0.45,
    pull: 0.52,
    field: 0.86,
    color: 0xe9e2d0,
    accent: 0xc5bca8,
    pattern: "craters",
  },
  {
    id: "cotton",
    name: "Cotton Puff",
    kind: "feather",
    volume: 1.02,
    density: 0.38,
    pull: 0.55,
    field: 0.94,
    color: 0xf4cad9,
    accent: 0xfffdf5,
    pattern: "clouds",
  },
  {
    id: "comet",
    name: "Comet Core",
    kind: "feather",
    volume: 0.86,
    density: 0.5,
    pull: 0.54,
    field: 0.88,
    color: 0xcceaf4,
    accent: 0xffffff,
    pattern: "icy",
  },
  {
    id: "chalk",
    name: "Chalk Dwarf",
    kind: "feather",
    volume: 0.91,
    density: 0.48,
    pull: 0.56,
    field: 0.9,
    color: 0xe8d7b6,
    accent: 0xc8b28c,
    pattern: "speckled",
  },
  {
    id: "spore",
    name: "Spore Globe",
    kind: "feather",
    volume: 0.96,
    density: 0.52,
    pull: 0.6,
    field: 0.95,
    color: 0xcbe2b4,
    accent: 0x8db370,
    pattern: "moss",
  },

  // Terran / Balanced Worlds (5): classic size & density -> steady familiar curve
  {
    id: "terra",
    name: "Verdant Terra",
    kind: "terran",
    volume: 1.0,
    density: 0.76,
    pull: 0.75,
    field: 1.0,
    color: 0x58addb,
    accent: 0x91bb72,
    pattern: "continents",
  },
  {
    id: "rust",
    name: "Crimson Dune",
    kind: "terran",
    volume: 0.96,
    density: 0.78,
    pull: 0.73,
    field: 0.98,
    color: 0xe4845f,
    accent: 0xfff4e0,
    pattern: "canyons",
  },
  {
    id: "ocean",
    name: "Azure Reef",
    kind: "terran",
    volume: 1.04,
    density: 0.72,
    pull: 0.76,
    field: 1.04,
    color: 0x5cc4d1,
    accent: 0xeafbff,
    pattern: "waves",
  },
  {
    id: "meadow",
    name: "Jade Oasis",
    kind: "terran",
    volume: 1.01,
    density: 0.75,
    pull: 0.75,
    field: 1.01,
    color: 0x92c47e,
    accent: 0xeff8df,
    pattern: "ribbons",
  },
  {
    id: "amber",
    name: "Amber Mesa",
    kind: "terran",
    volume: 0.98,
    density: 0.8,
    pull: 0.78,
    field: 1.02,
    color: 0xf49b58,
    accent: 0xffd7a3,
    pattern: "mesas",
  },

  // Gas & Ice Giants (5): high volume, lighter density -> large target & wide sweeping halo
  {
    id: "saturn",
    name: "Ringed Titan",
    kind: "giant",
    volume: 1.18,
    density: 0.6,
    pull: 0.78,
    field: 1.2,
    color: 0xefc87d,
    accent: 0xfae6b8,
    ring: 0xc29864,
    pattern: "ringed",
  },
  {
    id: "jupiter",
    name: "Storm Giant",
    kind: "giant",
    volume: 1.24,
    density: 0.66,
    pull: 0.86,
    field: 1.26,
    color: 0xe79e6a,
    accent: 0xfbe1be,
    pattern: "storm",
  },
  {
    id: "neptune",
    name: "Cobalt Giant",
    kind: "giant",
    volume: 1.16,
    density: 0.64,
    pull: 0.81,
    field: 1.18,
    color: 0x6b9be0,
    accent: 0xc7e0ff,
    pattern: "cirrus",
  },
  {
    id: "mint-giant",
    name: "Mint Giant",
    kind: "giant",
    volume: 1.14,
    density: 0.58,
    pull: 0.74,
    field: 1.16,
    color: 0x8cd3cc,
    accent: 0xe5fbf8,
    ring: 0x5ea9a3,
    pattern: "frost-ring",
  },
  {
    id: "nebula",
    name: "Lilac Swirl",
    kind: "giant",
    volume: 1.2,
    density: 0.62,
    pull: 0.82,
    field: 1.22,
    color: 0xb99ce0,
    accent: 0xeee3ff,
    pattern: "swirl",
  },

  // Dense Cores (5): compact volume, very high density -> sharp intense gravity pull
  {
    id: "iron",
    name: "Iron Core",
    kind: "dense",
    volume: 0.88,
    density: 1.32,
    pull: 0.92,
    field: 1.0,
    color: 0x8293a3,
    accent: 0xcbd7e2,
    pattern: "metallic",
  },
  {
    id: "obsidian",
    name: "Obsidian Orb",
    kind: "dense",
    volume: 0.84,
    density: 1.42,
    pull: 0.96,
    field: 0.98,
    color: 0x615d7c,
    accent: 0xc7c2e6,
    pattern: "glossy",
  },
  {
    id: "tungsten",
    name: "Tungsten Dot",
    kind: "dense",
    volume: 0.82,
    density: 1.46,
    pull: 0.98,
    field: 0.96,
    color: 0x91867c,
    accent: 0xd9cfc5,
    ring: 0x5c534c,
    pattern: "heavy-ring",
  },
  {
    id: "magnetar",
    name: "Pulse Magnet",
    kind: "dense",
    volume: 0.86,
    density: 1.36,
    pull: 0.94,
    field: 1.05,
    color: 0x6f82dc,
    accent: 0xd8e1ff,
    pattern: "magnetic",
  },
  {
    id: "anvil",
    name: "Anvil Dwarf",
    kind: "dense",
    volume: 0.91,
    density: 1.24,
    pull: 0.89,
    field: 1.02,
    color: 0x5a7ea1,
    accent: 0xb8d4ee,
    pattern: "banded-steel",
  },

  // Heavy Super-Worlds (5): high volume AND high density -> broad, strongest fair pull
  {
    id: "magma",
    name: "Magma Titan",
    kind: "super",
    volume: 1.15,
    density: 1.16,
    pull: 0.98,
    field: 1.22,
    color: 0x765c5c,
    accent: 0xf49b58,
    pattern: "lava",
  },
  {
    id: "diamond",
    name: "Crystal Giant",
    kind: "super",
    volume: 1.1,
    density: 1.22,
    pull: 0.97,
    field: 1.18,
    color: 0xc0d2f5,
    accent: 0xffffff,
    pattern: "crystal",
  },
  {
    id: "atlas",
    name: "Atlas Prime",
    kind: "super",
    volume: 1.18,
    density: 1.08,
    pull: 0.94,
    field: 1.24,
    color: 0x4f9fc4,
    accent: 0x9fd080,
    pattern: "atlas",
  },
  {
    id: "gold",
    name: "Gold Titan",
    kind: "super",
    volume: 1.13,
    density: 1.2,
    pull: 1.0,
    field: 1.23,
    color: 0xe6b85c,
    accent: 0xfff2c2,
    ring: 0xb88635,
    pattern: "gilded",
  },
  {
    id: "geode",
    name: "Geode Giant",
    kind: "super",
    volume: 1.12,
    density: 1.12,
    pull: 0.93,
    field: 1.19,
    color: 0x9474bd,
    accent: 0xf0d9ff,
    pattern: "geode",
  },
];

const BY_ID = new Map(PLANET_TYPES.map((p) => [p.id, p]));
export const DEFAULT_PLANET = BY_ID.get("terra")!;

export function planetSpec(id?: string): PlanetSpec {
  return (id && BY_ID.get(id)) || DEFAULT_PLANET;
}

export const PLANET_GUIDE: readonly ArcadeGuideItem[] = [
  {
    label: "Feather Worlds · LOW G",
    detail:
      "Low density (Pumice Moon, Cotton Puff, Comet Core, Chalk Dwarf, Spore Globe). Faint narrow halo with gentle pull — aim straight.",
    swatch: "#cdebf5",
  },
  {
    label: "Terran Worlds · MID G",
    detail:
      "Balanced volume & density (Verdant Terra, Crimson Dune, Azure Reef, Jade Oasis, Amber Mesa). Classic steady gravity curve.",
    swatch: "#58addb",
  },
  {
    label: "Gas & Ice Giants · WIDE G",
    detail:
      "High volume, lighter gas/ice density (Ringed Titan, Storm Giant, Cobalt Giant, Mint Giant, Lilac Swirl). Huge surface & broad sweeping halo.",
    swatch: "#efc87d",
  },
  {
    label: "Dense Cores · HIGH G",
    detail:
      "Compact volume, very high density (Iron Core, Obsidian Orb, Tungsten Dot, Pulse Magnet, Anvil Dwarf). Small target with strong inward pulse.",
    swatch: "#8293a3",
  },
  {
    label: "Super-Worlds · MAX G",
    detail:
      "High volume & high density (Magma Titan, Crystal Giant, Atlas Prime, Gold Titan, Geode Giant). Wide, powerful double-ring gravity wells.",
    swatch: "#9474bd",
  },
];
