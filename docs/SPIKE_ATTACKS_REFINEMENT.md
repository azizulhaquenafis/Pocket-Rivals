# Spike Attacks — 16 October 2026

The supplied [reference short](https://www.youtube.com/shorts/p1eZhSl-U_g) was viewed in the in-app browser, including frames around 18%, 36%, 69% and 83%. It shows two players in one tiled square arena, three solid cover blocks, four wide piston spikes per edge, warning lamps and extending/retracting attacks. The previous prototype's separate arenas, circular stones and projectile rain did not match that composition.

## Changes

- One shared square arena, three physical cover blocks and original Pocket Rivals vector characters. Both players have the same hazards, movement limits and collision rules; avatars do not push each other.
- Four physical piston lanes per edge. Each shaft stops at its first block. Circle/shaft/triangle contact uses the same dimensions as drawing. Bounded 120Hz checks and conservative swept extension prevent tunnelling.
- Seeded warning, extension, hold, eased return and recovery phases. Consecutive attacks change edges, preventing repeated-side camping. Warnings ramp from 1.85s to a 1.05s minimum, extension speed increases from 620 to 940 world units/s and hold time grows modestly. Cover and narrow gaps remain legitimate escape options.
- Two independently owned joysticks, mouse drag support and keyboard alternatives in How to Play. Release, cancellation and pause clear movement. A presentation layer interpolates movement/shafts and smooths facing without writing physics.
- Clean warning lamps replace central instructions. Existing procedural audio supplies strike, impact, return, collision and round feedback. First five survival points; simultaneous deaths replay. An independent 120-second foreground deadline preserves the lead or draws tied scores and excludes pause/background time.
- Bounded AI plans routes around the actual blocks, ranks comparable legal safe positions using its seeded profile, and uses the same movement speed as humans. Medium/Hard/Impossible reaction delays differ; no teleportation, fabricated scores or arbitrary deaths.

Archery Duel and Chicken Jump were moved intact into `src/future-games/`, alongside Flappy Jump and Car Duel. Their source, assets, metadata, IDs and module instructions remain. Unit tests still run; inactive browser specs are retained individually in `tests/future/`. They are absent from menu/tournament discovery and production bundles. Restore a folder to `src/games/` to reactivate it. No Math Quiz module, shared navigation or tournament code was changed.

## Verification

- Full suite: **260 unit tests passed**. Spike coverage includes tip/shaft contacts and block shielding, bounded sliding/no tunnelling, single scoring and simultaneous deaths, actual return to sockets, progressive difficulty, safe reachable routes on every edge, 100 seeded 40-second strongest-AI traversals, 100 reaction samples per difficulty, interpolation isolation, deadline and terminal guards. Fixed-step outcomes match at 30/60/120 render FPS.
- **12 browser scenarios passed**, including simultaneous joystick touches, pause/cancellation, mouse input, repeated entry/exit, a complete real AI match, two-minute deadline, 360×640 layout, deferred-game exclusion, tournament scoring and Gravity/Happy Birds regressions. Start, strike and small-screen screenshots were inspected.
- Production Vite/TypeScript build, initial-payload budget and automatic new-folder discovery check pass. The production manifest contains 18 lazy games and no deferred games.
- Short headless desktop Chrome samples at a touch viewport measured ~60 FPS, ~16.7ms frames, ~1ms AI planning, a stable 11 scene children and zero host input listeners after exit. `expansion-performance.json` records the samples. These are short desktop measurements, not Android hardware or long-session certification.

No physical Android testing, external asset reuse, deployment or publishing occurred. Device touch feel and speaker playback still warrant real-device verification.

## Local preview and controls follow-up

The development server runs at http://127.0.0.1:5173/. Solo keyboard controls accept either arrows or WASD; local two-player retains independent WASD/arrow controls. Both on-screen joysticks remain usable. Standard gamepads use the left stick or D-pad, first connected controller for Orange and second for local Blue. Browsers may require pressing a controller button before exposing it. Dead zones ignore drift, disconnects preserve the other player’s slot, and pause blocks held gamepad motion until neutral. Input is polled within the existing loop with no added listeners or dependency.

Controls verification: 10 targeted unit checks and five browser scenarios passed, including solo arrows, simultaneous local keyboards, touch/mouse controls, simulated browser gamepad input, dead-zone/assignment behavior and neutral gating after pause. Production build and bundle budget pass. No physical gamepad or Android-device test was performed.

## AI collision and maps follow-up

The old 60-unit shafts left 20-unit gaps around a diameter-18 player. AI could park at lane intersections forever. Shafts now share a 72-unit visible/physical width, closing that loophole for everyone. All three data-driven maps have reachable cover on each edge and are checked for permanent four-direction safe spots. Exposed AI takes the exact same lethal hit as a human; no score manipulation or forced misses. Medium uses slower shelter-center decisions while Hard/Impossible evaluate tighter legal routes.

Courtyard, Split Steps and Crosswind are selectable through standard game variants, with a reproducible Random choice. Rendering, collision, spawning and AI all use the selected map. Existing IDs and old unspecified-map matches retain Courtyard. Only human joysticks are drawn: solo shows Orange, local shows both. Solo accepts WASD/arrows; local keeps WASD for Orange and arrows for Blue.

Validation of the follow-up: the full 276-test unit suite passed, including 100 seeded mixed-difficulty Spike matches across all maps, genuine lethal AI collisions, all-edge reachability, no permanent safe camping point and difficulty timing. Eight browser checks passed for maps, hidden AI controls, local/solo keyboard, mouse/touch, simulated gamepads, complete AI matches and tournament regression. Map previews derive from the same map data; mobile checks confirm all four choices and no horizontal overflow. Initial implementation remains lazy and within the 24KB gzip shell budget.
