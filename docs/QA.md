# Verification record — 2026-10-13

All commands ran locally. Nothing was deployed or pushed. Chrome automation uses a mobile viewport/touch emulation; it is not physical Android testing.

## Automated checks

- Final unit suite: **140 passed** across five files, including full-route, bounded preview and record-validation tests.
- Full browser suite: **23 passed**. The final golf-focused run then passed **3 tests**, adding a complete real-touch Temple win, score banking and reload persistence (24 distinct browser tests now exist). The final production-offline rerun also passed. Covers two-pointer Pong/Hockey input, cancellation/background pause, repeated switching and listener disposal, Classic/Ultimate legal play and results, worker AI, tournament persistence/draws/rematches, Connect Four wins, Snake/Star Patrol controls, resized layouts, physics clocks/restoration, all Ultimate Golf courses, focus/retry, mouse/touch and offline loading of all seven modules.
- Production `npm run build`: passes strict TypeScript and Vite compilation. Shared Phaser remains the large vendor chunk; all seven game implementations are lazy.
- `npm run test:modules`: passes folder-only registration in a temporary build, without modifying existing application source.
- `npm run test:bundle`: passes; expected lazy modules are discovered automatically. See `bundle-report.json` for exact payload sizes.
- `npx cap sync android`: passes and packages the current web build and plugins.
- `./android/gradlew -p android assembleDebug`: attempted, failed before building because no Java runtime is installed. No APK/AAB was produced.

## Gameplay evidence

Pong/Hockey tests cover 120-second regulation, five-point wins, 0–0 draws, tied-score overtime, sudden death, overtime draw, separate 15-second hockey possession, pause, restored clocks and all AI motion settings. Hockey stress tests cover high-speed rails/corners/mallet overlaps and unreachable-state recovery. Classic Impossible is checked against all legal strategies as either player. Ultimate covers routing, all resolved-board cases, global outcomes and saved-history validation. Connect Four covers all 69 winning windows and bounded tactical AI. Snake and Shooter cover collision/scoring/projectile and wave lifecycle rules.

Ultimate Golf uses four full legal Easy-mode tee-to-cup shot replays: Foundry 15, Shoreline 15, Event Horizon 13, Lost Temple 11. No position resets or hazard bypasses are used in those replays. Additional tests check every course's final-stroke capture, exhausted strokes, high-speed thin walls, embedded/rotating colliders, 30/60/120 FPS consistency, tides/current, portals, UFO carrying, bridge regeneration, pressure doors, quicksand and 90 simulated seconds per course/difficulty. Browser checks exercise real mouse and CDP touch gestures at desktop, 320×568 mobile and landscape viewport sizes.

Lost Temple was also completed through real CDP browser touch gestures in 14 strokes with no hazard recovery; its actual victory overlay, Finish run result and persisted course record were checked. Clock control accelerated elapsed time without modifying positions, scores or game state.

Visual screenshots were inspected for the menu, board games, Arcade and golf course picker/overview/focus. The course viewport is exactly 288×512 (9:16), rotated from the original map without changing physical distances. No current game objects/listeners remain after host shutdown.

## Measured performance

`node scripts/measure-performance.mjs` sampled each golf course for three seconds after warmup in headless desktop Chrome, development build, 412×915 mobile viewport, DPR 1. Samples were approximately 59.95–60.04 FPS and 16.6–16.7 ms/frame; golf initialization was approximately 30 ms. One active scene, 11 shared textures and 25 scene children remained stable. Full samples and heap measurements are in `performance-report.json`. These measurements are neither a mobile-device guarantee nor a production hardware benchmark.

Only lightweight metadata and SVG thumbnails enter the initial shell. Golf's simulation/rendering/course data is a separate lazy chunk; the old golf worker is no longer shipped. Web shell caching is automatic; full offline caching is explicit in Settings. The offline browser test disables networking before reloading and exercising all registered games and the board-game workers.

## Remaining verification / limits

- Install JDK 21 and Android SDK 36, rebuild the APK, and test real multi-touch, lifecycle/back navigation, cutouts, audio latency and sustained performance on representative phones.
- iOS Safari and lower-end Android GPUs have not been physically tested. Landscape browsers letterbox the portrait board.
- Ultimate/Connect Four Impossible are bounded strong searches, not mathematical guarantees. Golf is intentionally solo; source difficulty controls hazards, not an AI opponent.
- Golf course records persist; an unfinished golf course restarts after closure. Its former duel source is retained but no longer registered. Old golf tournament rounds need a new tournament; other game state remains compatible.
- Full golf routes were demonstrated on Easy; Normal/Hard physics were stress-tested, not exhaustively solved.
- Named-player reference score files and original C art/audio are not imported. Source provenance and adaptations are documented in `ULTIMATE_GOLF.md`.
