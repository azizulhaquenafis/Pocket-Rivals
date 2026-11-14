# Lumberjack balance audit — 2026-11-14

The old Medium AI inverted its chosen side on 10% of decisions; Hard did so on 1.2%. A single branch collision ends a match, so those repeated error rolls accumulated over the 100-chop objective. The older test accepted either winner and therefore passed when the AI killed itself early.

All tiers now use safe, visible-branch choices. Medium loses time recognizing and switching sides, including occasional longer hesitation. Hard switches faster and hesitates rarely. Impossible never deliberately hits a branch and uses a fast legal cadence. The same `LumberMatch.chop` cooldown, collision and scoring API applies to humans and AI. There are no score adjustments, hidden branch inspection or multi-action catch-up bursts. Existing 24 seeded personalities retain side preference and visible-branch lookahead strategies.

Measured with 100 seeded unattended attempts per tier at 120Hz:

| Tier | Completed | Fastest | Median | Slowest |
| --- | --- | --- | --- | --- |
| Medium | 100/100 | 47.44s | 52.69s | 58.16s |
| Hard | 100/100 | 22.17s | 24.03s | 26.42s |
| Impossible | 100/100 | 10.00s | 10.67s | 11.37s |

These are completion timings against an idle rival, not estimated human win rates. Slower tiers remain beatable by chopping faster; they no longer depend on inevitable artificial death to concede a win.

Validation: `npx vitest run tests/unit/lumberjack.test.ts tests/unit/lumberjack-balance.test.ts` — 9 tests passed. Tests cover 300 measured attempts plus 90 attempts at 30/60/120Hz, exact seeded replay, varied openings/profiles, cooldown legality, invalid deltas, no post-result actions and no hidden-branch inspection. Completion-time variation across tested frame rates stays below 350ms. Existing first-to-100, immediate loss on branch contact and idle-without-penalty rules remain intact. Whole-project build/browser checks are coordinated separately by the main audit.
