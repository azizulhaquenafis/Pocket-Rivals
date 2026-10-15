# Seven-game expansion and final integration

The remaining seven games from specifications/13-games.md are implemented as separate lazy modules. Together with the existing six, all thirteen requested entries are present. The reference PDF was not supplied: written rules govern implementation, while numerical tuning and timeout defaults are original and documented in each module's AGENTS.md.

| Game | Implemented mechanics | Targeted validation |
|---|---|---|
| Chicken Jump | Moving block, timed lock/jump, geometric landing, growing stack, retry on miss, first ten | 100 Impossible and 100 Medium legal completion runs; duplicate input and misses |
| Archery Duel | Three debounced taps, horizontal/vertical crosshair, projectile flight, exact circular targets worth 1/2, first ten | 100 seeded AI completions; real hits, one-time scoring |
| Gravity Runner | Gravity reversals, shared seeded floor/ceiling gaps, increasing speed, first five rounds | 100 AI matches; 100 Hard and 100 Impossible 80-second traversals; gap clearance and simultaneous deaths |
| Happy Birds | Gravity/flap impulses, identical gates, spikes, increasing speed, first three rounds | 100 seeded 80-second dual-flight runs; cooldown and collisions |
| Spike Attacks | Warning waves, freely moving players, solid cover, swept projectile collisions, first five | 100 seeded 60-second cover runs; earliest-contact shielding and legal movement |
| Flappy Jump | Running/jumping, apex ball release, rim/backboard rebounds, downward hoop crossing, first ten | 100 seeded ten-basket completions; rim reflections and no double scoring |
| Car Duel | Acceleration, momentum, rotation, terrain/wheel contacts, collisions, exposed driver heads, first five | 100 bounded full-match simulations; idle stability, simultaneous deaths and real two-pointer browser input |

All offer local play and Medium/Hard/Impossible AI. AI uses legal game actions, seeded match personalities and bounded computation. Impossible is practical prediction, not a mathematical optimality claim. Car uses a compact custom rigid-body approximation; broader human balance testing remains advisable.

## Integration

Metadata and SVG previews are eager; implementations/AI are lazy. No registry/menu/tournament router edits were needed. All seven declare tournament compatibility and report the existing result contract. One host scene, no new frameworks, no network services and no added dependencies. Each module has cleanup and terminal guards. Car's per-pointer button adapter explicitly removes its own scene/canvas subscriptions.

The final production build contains 22 lazy entries, a 23,920-byte gzip shell and 358,642-byte total initial JavaScript, mostly Phaser. Compared with the recorded AI-pass build, the shell grew about 2.7KB compressed as the seven games and concurrent metadata changes were integrated. Their implementation and AI code remain outside the initial static import graph.

New real-time attempts restart after process closure. Existing board and Pong/Hockey checkpoints are preserved. Matches have explicit 3–5 minute safety caps with score-based winners/ties; simultaneous survival deaths replay. These defaults prevent indefinite tournaments and are visible in setup instructions.

## Cleaner interface

Water Guess and Hammer Hit use orange/blue playfield backgrounds and rotate local hot-seat content 180 degrees with input blocked during the short transition. Navigation remains fixed. Board games use color-based turns and small neutral status; repeated instructions move out of the live field into existing setup help. Simultaneous split-field games retain independent views. AI preparation is intentionally visible in turn-based games without slowing their search or physics.

## Verification status

Final checks on 15 October 2026:

- **238 unit tests passed across 26 files**, including read-only Math Quiz coverage. Seven-game fixed-step outcomes match at 30/60/120 render FPS; seeded simulation counts are listed above. Classic Impossible exhaustive legal-human tests still pass.
- **37 browser scenarios passed** in two stable-source runs (31 collection/AI/regression checks in 4.6 minutes, then 6 UI/tournament/Golf checks in 37.5 seconds). Installed desktop Chrome with Pixel 7 touch emulation; actual pointer/key actions, two-pointer Car controls, rotated Hammer/Water input, pause, cleanup, worker lifecycle, tournament scoring, persistence and real Golf touch completion are covered.
- Strict TypeScript and production Vite build pass. Bundle budget and folder-only automatic discovery pass. The only build warning is the existing large Phaser runtime chunk.
- Earlier failures were repaired: the obsolete simultaneous Hammer test, low-bit Golf route selection aliasing, and the unnecessary playable delay after both golfers finish. Both latest full runs are green.
- Screenshots for the cleaned orange/blue Water and Hammer fields were inspected. Runtime measurements are in expansion-performance.json: five half-second samples per new game remained about 59.9–60.1 FPS, initialization measured 18.3–27.6ms, and every exit left zero scene objects and host input listeners. These short desktop samples do not certify mobile hardware or absence of long-term memory leaks.

No push, deployment or publication. No physical Android/Safari testing; no claim of sustained 60FPS on all devices. Headless desktop Chrome with touch emulation checks runnability, input and lifecycle; physical feel and longer sessions remain manual validation.
