# Performance and difficulty audit — 2026-11-14

## Fixed causes

- **Solo label uploads:** Phaser Text.setColor regenerates its canvas and uploads a texture even when the requested color is unchanged. The shared solo renderer now changes text color only when necessary. The same guard covers the host clock and Air Hockey possession clock. Hammer's popup color is already event-driven and was left alone.
- **Loading race:** selecting a game before Phaser finishes boot could lose the scene's startup data and leave the loading screen indefinitely. Game launches now await scene registration, preload only the selected exports concurrently, and reject stale launches. Loading can be canceled and has a 12-second visible-page watchdog with menu/reload recovery.
- **Lifecycle:** remove outstanding first-render callbacks during cleanup; finish input cleanup even if a module's dispose throws; sleep the menu renderer after its first render, not before Phaser starts its loop. Wake the loop when destroying a sleeping game so Phaser can finish its deferred destruction.
- **Repeated work:** cache the per-run personal best instead of reading/parsing storage for every Star Patrol HUD update. Skip diagnostics scene/texture enumeration when disabled. Perfect Pour caches five vessel area profiles and static outlines; its inverse fill-height lookup uses binary search, preserving the original integrated geometry.

## Measured rendering results

A short headless Chrome sample at 390×844 / DPR2 measured 120 frames per game after selection. Use `node scripts/perf/solo-profile.mjs` against the local Vite server to repeat it. This measures idle gameplay, not a complete playthrough or a physical phone.

| Game | Before: text draws / uploads | After | Frame p95 | Module update p95 |
| --- | --- | --- | --- | --- |
| Orbit Hop | 120 / 120 | 0 / 0 | 16.7 ms | 0.30 ms |
| Color Switch | 120 / 120 | 0 / 0 | 16.8 ms | 0.20 ms |
| Perfect Pour | 240 / 240 | 0 / 0 | 16.8 ms | 0.20 ms |
| Pocket Climber | 122 / 122 | 2 / 2 | 16.7 ms | 0.20 ms |
| Classic Snake | already cached | 0 / 0 | 16.7 ms | 0.20 ms |
| Star Patrol | already cached | 1 / 1 | 16.7 ms | 0.20 ms |

The changed Climber/Patrol labels legitimately upload new values. Both before and after were near 60 FPS on this computer; the demonstrated improvement is removed work, not an invented FPS gain. Cold navigation samples were 469–598 ms. No new dependencies or eager game engines were added.

## Difficulty findings

- **Lumberjack:** repeated fatal-error rolls made Medium unlikely to reach 100 chops. All tiers now choose safe visible branches, with different pacing, switch costs and hesitation. Median completion across 100 seeds: Medium 52.69s, Hard 24.03s, Impossible 10.67s. All 300 finish; same 85ms legal contact debounce applies. See LUMBERJACK_BALANCE.md.
- **Math Quiz:** Impossible knew every answer but waited up to about ten seconds on university questions. It now answers correctly 0.70–1.25s after presentation. Seeded Medium/Hard personalities remain slower and imperfect. Fixed round reset when a question ID is reused. Full browser matches pass for Basic and University. See MATH_AI_REFINEMENT.md.
- **Happy Birds:** old Impossible averaged 41.01s/1.14 recoveries versus Hard 39.31s/0.84 across 100 seeds. Impossible now compares two legal immediate actions using bounded forecasts through the shared bird/collision integrator. New averages: 35.16s/0.10 recoveries; Medium 49.20s/1.67, Hard 39.31s/0.84. All 300 races finish by physically collecting 15 stars. Forecasts do not alter match state or inspect future randomized walls. A short Node scenario measured update p95 .049ms/max .452ms; browser/device costs may differ.
- **Gravity Runner:** Medium previously used expert-level precise forecasts and survived all tested two-minute rounds. Its shorter .62s lookahead/.30s observation cadence now differs materially from Hard 1.45s/.085s and Impossible 1.75s/.04s. Across 100 seeds, Medium averages 108.83s with 78 full rounds; Hard/Impossible both survive 100/100. Upper tiers choose different legal sequences, but generated course clearances do not separate their completion rate. No forced errors or artificial deaths were added.
- **Other audited engines:** Classic Impossible remains exhaustively non-losing. Connect Four/Dots use distinct bounded search budgets; reflex games have distinct reaction distributions; Water Guess has tier-specific visible-measurement error. Existing broad tests cover legal moves, seeded replay, physical bounds, score resolution and worker cleanup. Passing those checks does not prove perfect strength or balance in every state.

## Verification status

Production build and bundle checks pass: shell 23,808 bytes gzip, below the existing 24,000-byte budget; all 23 implementations remain lazy. Phaser remains the dominant shared runtime. Module auto-discovery check also passes. The live Lost Temple worker AI completes on all tiers: Medium 23 shots, Hard 18, Impossible 12.

The complete unit suite passes: **45 files / 396 tests**. Final TypeScript validation also passes after the browser-test updates.

The full browser sweep executed **125 scenarios: 116 initially passed, 9 failed**. All nine subsequently passed in targeted reruns after correcting stale listener expectations and nondeterministic test timing. Two additional lifecycle scenarios pass, giving **127 distinct browser scenarios verified across the sweep and reruns**, not one uninterrupted green run. No production assertions were relaxed to hide a gameplay failure:

- Early renderer boot is explicitly gated and released, so the cancellation test cannot accidentally click after loading finishes.
- Perfect Pour and Orbit input checks use a stopped test clock plus explicit frame advances; automation latency no longer changes the intended hold time or launch angle.
- Happy Birds checks progress toward the middle during recovery and arrival after recovery, rather than assuming it has already arrived halfway through its three-second animation.
- Fruit Duel waits for an eligible real/decoy object under a controlled clock and advances the render frame before checking sound.
- Repeated navigation checks the current Air Hockey listener count, then still requires zero on exit. Multi-game profiling receives a suitable total test timeout; measured frame/upload assertions remain unchanged.

Coverage includes complete matches, real mouse/touch/keyboard actions, pause/resume, repeated exits, worker cleanup, all golf courses, Lost Temple AI, mobile portrait/landscape, solo difficulty selection, offline production loading, and delayed/canceled launches. The menu draws no GPU frames while idle, while the positive control confirms rendering resumes in play. The local server responds successfully at http://127.0.0.1:5173/.

Remaining limits: no real Android hardware run; short desktop profiling cannot establish thermal or long-session performance. Gravity Hard and Impossible remain indistinguishable by survival rate on the sampled generated courses, despite distinct planning budgets/actions. This is a tested improvement pass, not a claim that every possible bug has been eliminated.

## Follow-up inspection prompts

1. Profile sustained late-game play on a real lower-end Android device; record frame distributions, memory and thermal behavior before choosing further rendering work.
2. Evaluate Gravity Hard versus Impossible on demanding but human-reachable compound hazards. Keep stronger planning as the distinction; never manufacture deaths to satisfy win-rate statistics.
3. Recheck all loading cancellation/error paths after any loader, service-worker or native lifecycle change. Test first boot and delayed chunks, not only warm reloads.
4. Keep every balance change backed by fixed-seed legal-action simulations and real browser pause/restart/navigation checks. Do not equate zero failures in sampled states with zero possible bugs.
