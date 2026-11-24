# Status: 24 November update

Pocket Drift, Magnet Dash, Tiny Foundry, Shadow Step and Domino Lab are deferred intact under `src/future-games`. Paper Glider remains active. The implementation notes below describe the original six-game release.

# Six new solo games

All six live in independent `src/arcade/` modules. Each has original vector art, a lazy factory, pure rule engine, Medium/Hard/Impossible selection, touch and keyboard input, host-managed pause/restart/results and separate arcade high scores. Instructions are expandable in the difficulty picker and available when paused. No new dependency, worker, animation loop or physics engine was added.

| Game | Play and progression | Difficulty changes |
| --- | --- | --- |
| Pocket Drift | Accelerating car with heading, lateral momentum, handbrake and grip. Follow four ordered checkpoints for three laps. Avoid two barriers and grass; five lives and a 100-second run. Sustained slides earn extra points. | Speed 104/125/145; track clearance 36/30/25; grip 6/5/4. Racing line on Medium. |
| Magnet Dash | Switch polarity to accelerate between rails. Dodge incoming barriers and collect charges. Three collisions end an endless run; speed gradually increases with a cap. Seeded obstacle generation stays bounded. | Base speed 128/165/200, spacing 260/245/240 and pull strength 820/950/1050. |
| Paper Glider | Steer against crosswinds, slow descent, pass at least two rings, then land near the strip center with low lateral speed. Three flights, three lives. Unbanked ring points are lost on a crash. | Narrower gates/rings/landing strips, faster descent and stronger crosswinds. |
| Tiny Foundry | Hold to pour ballistic droplets into moving molds; release before the target is reached, then finish after airborne drops settle. Eight accepted casts. Four original mold silhouettes display volume accurately; nozzle upgrades reduce spread every two accepted casts. A cast automatically settles after 22 seconds. | Faster conveyor/flow, narrower molds, accepted error 20/14/9 percentage points. |
| Shadow Step | Walk or tap a route, collect gold and reach the exit through five rooms. Walls block rotating searchlights. Exposure fills an alert ring; capture costs a life and returns the player to the entrance. Three lives. | Faster sweep, longer sightlines and shorter warning: 0.75/0.52/0.34 seconds. Route shown on Medium. |
| Domino Lab | Place an ordered chain around blocked cells, then topple it. Falling angle and reach determine propagation. Undo/Clear permit revisions; failed launches cost a try. Six puzzles, three tries. | Reach 61/48/44; spare pieces 3/1/0. Impossible hides the reach circle. |

## Controls

- Drift: left/right or A/D; Space for handbrake. Hold either screen side to steer; drag lower to brake while steering.
- Magnet: tap or Space to reverse polarity.
- Glider: arrows/A/D or horizontal touch drag. Space/Down or the lower touch strip slows descent.
- Foundry: hold Space or hold above the finish button to pour. Release to stop; Enter or Finish Cast settles.
- Shadow: arrows/WASD or tap a floor tile. Routes respect walls but do not automatically avoid searchlights.
- Domino: tap grid points to place in order; Undo/Clear/Topple buttons. Arrows move a cursor, Space places, Backspace undoes, Enter launches.

## Validation

`tests/unit/new-solo-games.test.ts` tests legal three-lap driving, seeded magnet survival/replay/death, all three glider flights and eight casts at each tier, all six domino solutions at each tier, and all five stealth rooms at each tier using timed routes with actual visibility and movement. It also checks invalid placements, wall occlusion, collision/recovery, unbanked points and all 101 fill percentages for four mold profiles.

`tests/browser/new-solo-games.spec.ts` checks ordinary inputs, pause invariance, restart/reset, listener cleanup, real held mobile touch/cancellation, full Domino Lab completion/rematch, desktop Impossible launches, small-screen instructions, production previews/lazy loading and frame/text-rasterization samples. Existing solo loading and responsive suites are included in the final browser run.

Full unit suite: 443 tests across 49 files passed. The final completion-layout polish also passed the 28-test targeted suite (including one added regression). Production TypeScript/Vite build, automatic discovery check and bundle budget passed. App entry gzip: 22,781 bytes (budget 24,000); all 29 engines remain lazy. Five older previews now use separately cached SVG assets without changing their artwork or rules.

All 20 browser scenarios passed. New-game 90-frame samples measured 16.7–16.8 ms p95 frame times, with 0–9 text rasterizations per sample. Browser performance measurements are headless desktop Chrome measurements, including mobile emulation—not physical Android or low-end-device certification. Drift has one circuit; Glider three flights; Foundry eight casts; Shadow five rooms; Domino six puzzles. Magnet alone is endless. Domino is a deterministic directed chain model, not a general rigid-body sandbox. Human difficulty balancing can be refined after playtesting.
