/** Navigation waypoints only; every shot is planned against the live physics state. */
import type { Difficulty } from "../../../../shared/contracts/AIController";
import { mixSeed } from "../../../../shared/ai/MatchRandom";

const lane = (1920 - 196) / 6,
  c = (i: number) => 28 + i * (lane + 28) + lane / 2;

/**
 * Three distinct strategic routes per course:
 * - Route 0: Balanced / Central route (standard fair line)
 * - Route 1: Aggressive / Inside cut route (faster turns, direct angles)
 * - Route 2: Conservative / Flank route (wider arcs, safe clearance around movers/hazards)
 */
export const courseRoutes: number[][][][] = [
  // Course 0: Foundry
  [
    // Route 0: Central slalom
    [
      [c(0), 220],
      [c(1) + 110, 220],
      [c(1) + 110, 670],
      [c(1) - 100, 670],
      [c(1) - 100, 950],
      [680, 950],
      [680, 220],
      [1235, 220],
      [1235, 950],
      [c(4), 950],
      [c(4), 220],
      [c(5) - 120, 220],
      [c(5) - 120, 942],
      [c(5), 942],
    ],
    // Route 1: Left-flank & inside cuts
    [
      [c(0) - 30, 220],
      [c(1) + 85, 220],
      [c(1) + 85, 650],
      [c(1) - 85, 650],
      [c(1) - 85, 950],
      [730, 950],
      [730, 220],
      [1170, 220],
      [1170, 950],
      [c(4) + 60, 950],
      [c(4) + 60, 220],
      [c(5) - 100, 220],
      [c(5) - 100, 942],
      [c(5), 942],
    ],
    // Route 2: Wide-clearance outer path
    [
      [c(0) + 35, 220],
      [c(1) + 120, 220],
      [c(1) + 120, 680],
      [c(1) - 110, 680],
      [c(1) - 110, 950],
      [650, 950],
      [650, 220],
      [1245, 220],
      [1245, 950],
      [c(4) - 50, 950],
      [c(4) - 50, 220],
      [c(5) - 125, 220],
      [c(5) - 125, 942],
      [c(5), 942],
    ],
  ],
  // Course 1: Shoreline
  [
    // Route 0: Standard South loop
    [
      [220, 990],
      [220, 220],
      [520, 220],
      [520, 970],
      [910, 970],
      [910, 220],
      [910, 150],
      [1340, 150],
      [1340, 930],
      [1760, 930],
      [1760, 220],
      [1560, 200],
    ],
    // Route 1: Corner-cutting inside line
    [
      [220, 990],
      [220, 220],
      [520, 220],
      [520, 970],
      [910, 970],
      [910, 480],
      [910, 150],
      [1340, 150],
      [1340, 930],
      [1760, 930],
      [1760, 380],
      [1560, 200],
    ],
    // Route 2: Safe paced circuit
    [
      [180, 990],
      [180, 550],
      [180, 220],
      [520, 220],
      [520, 650],
      [520, 970],
      [910, 970],
      [910, 600],
      [910, 220],
      [910, 150],
      [1340, 150],
      [1340, 600],
      [1340, 930],
      [1760, 930],
      [1760, 220],
      [1560, 200],
    ],
  ],
  // Course 2: Event Horizon
  [
    // Route 0: Portal 0 & 1 standard
    [
      [1100, 990],
      [1810, 990],
      [1840, 700, 1265, 340],
      [290, 340],
      [290, 590],
      [700, 600, 1205, 600],
      [1400, 575],
    ],
    // Route 1: Portal 0 early entry & inside center cut
    [
      [800, 990],
      [1810, 990],
      [1840, 700, 1265, 340],
      [450, 340],
      [290, 340],
      [290, 590],
      [700, 600, 1205, 600],
      [1400, 575],
    ],
    // Route 2: Full runway momentum
    [
      [600, 990],
      [1350, 990],
      [1810, 990],
      [1840, 700, 1265, 340],
      [290, 340],
      [290, 590],
      [700, 600, 1205, 600],
      [1400, 575],
    ],
  ],
  // Course 3: Lost Temple — resting points clear bumpers, the mover sweep and quicksand.
  [
    // Route 0: South Bridge, Plate 1 then Plate 2
    [
      [520, 980],
      [790, 960],
      [1100, 900],
      [1080, 570],
      [1000, 570],
      [1330, 570],
      [1320, 290],
      [1420, 220],
      [1810, 200],
      [1810, 950],
      [1770, 660],
      [1770, 570],
      [1560, 575],
    ],
    // Route 1: South Bridge, Plate 2 then Plate 1 (Reversed outer plates)
    [
      [520, 980],
      [790, 960],
      [1100, 900],
      [1080, 570],
      [1000, 570],
      [1330, 570],
      [1330, 850],
      [1810, 950],
      [1810, 200],
      [1770, 480],
      [1770, 570],
      [1560, 575],
    ],
    // Route 2: South Bridge with centered approach
    [
      [480, 980],
      [790, 960],
      [1080, 900],
      [1080, 570],
      [1000, 570],
      [1330, 570],
      [1320, 290],
      [1420, 220],
      [1810, 200],
      [1810, 950],
      [1770, 660],
      [1770, 570],
      [1560, 575],
    ],
  ],
];

/** Default routes for backward compatibility. */
export const routes: number[][][] = courseRoutes.map((variants) => variants[0]);

/**
 * Returns a deterministic route for the course given the difficulty, seed, and player style.
 * Provides distinct paths across matches and difficulty levels.
 */
export function getRoute(
  courseIndex: number,
  difficulty: Difficulty,
  seed = 0,
  role = 0,
): number[][] {
  const variants = courseRoutes[courseIndex];
  if (!variants || variants.length === 0) return routes[courseIndex] ?? [];
  // Mix high and low bits before selection: correlated seed/role sequences
  // otherwise cancel in the low bits used by the four-entry Medium table.
  const hash = mixSeed(seed, role + courseIndex * 7);
  let variantIndex = 0;
  if (difficulty === "medium") {
    // Medium varies between safe lines (0 and 2) and alternate line (1)
    const options = [0, 2, 0, 1];
    variantIndex = options[hash % options.length];
  } else if (difficulty === "hard") {
    // Hard evenly uses all three variations
    variantIndex = hash % variants.length;
  } else {
    // Impossible chooses among all variants, prioritizing direct lines
    const options = [1, 0, 2];
    variantIndex = options[hash % options.length];
  }
  return variants[variantIndex % variants.length];
}
