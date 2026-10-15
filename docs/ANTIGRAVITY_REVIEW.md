# Formal review — Water Guess, Perfect Timer, Hammer Hit

Scope: preserve Antigravity's artwork and mechanics; inspect rules, AI, input, scoring, lifecycle and integration. Math Quiz source, question banks, rendering and AI were excluded from edits. Its tests ran read-only.

## Confirmed findings and repairs

| Finding | Severity | Resolution |
|---|---|---|
| Perfect Timer included pause/background wall time in human stops and AI deadlines | High | Module-local foreground monotonic clock shared by both input paths; repeated pause/resume tested |
| AI stop and timeout could resolve the same round twice | High | Idempotent rule resolution plus controller phase guards |
| Both rules accepted nonfinite numeric submissions | Medium | Reject invalid values before updating state |
| Water Guess swallowed NumpadDecimal as a digit prefix | Medium | Restrict digit matching; browser decimal-key regression |
| Perfect Timer used identical preset order every match | Medium | Seeded selection without replacement |
| Both new AIs imposed artificial minimum error | Medium | Impossible Timer targets the visible exact duration; Water measures the visible tube to one logical pixel. Lower levels use seeded bias/variation |
| Hammer's inactive gauge advanced before its turn, allowing an immediate AI strike | Medium | Reset the active gauge on handoff, add 1.2–1.5s AI preparation, block input through strike animation |
| Old Hammer browser test assumed simultaneous play after controller changed to alternating turns | Test mismatch | Updated to validate six alternating strikes and arithmetic averages |
| Duplicate titles/status/instruction text crowded play | UX | Compact counters, color-based turns, local Hammer/Water playfield rotation and inverse keypad input |

## Verification and limits

Targeted rules tests cover precision, ties/sudden death, duplicate stops/resolution, invalid input, pause timing, seeded AI replay and difficulty differences. Browser tests cover an entire five-round Water match, rotated keypad coordinates, AI delay, Timer pause/resume and Hammer's six-strike result flow. Full regression results are recorded in EXPANSION_COMPLETION.md.

No changes to core scoring or tournament attempt-token logic. These games report standard results once. Active precision-game attempts restart after process closure; completed tournament rounds remain persisted. This is a known checkpoint limitation, not a claim of mid-round restoration. No physical Android/iOS verification or long-duration heap soak.

## Additional Golf integration findings

The later Golf route table used raw XOR low bits to select variants; correlated seeds and roles collapsed Medium onto one route. Selection now uses the existing avalanche seed mixer. Once both attempt records exist, AIChallengeMode now completes immediately; finish-time tolerance remains in winner comparison. Existing newer stroke-first competitive scoring was preserved. Four deterministic legal tee-to-cup fixtures and the three added route/competition regressions pass. Alternative navigation waypoint variants have not all been proved to finish autonomously.
