# Interface refinement — 15 October 2026

- Hammer rotates around a fixed grip without the former pivot jump. Turn rotation and AI preparation delays remain.
- Impossible Hammer samples legal timing targets: 70% 97–100, 25% 90–96, 5% 75–89. In 3,000 simulated strikes: 2,116 / 722 / 162 (70.53% / 24.07% / 5.40%). Scores come from needle position, never direct assignment. Lower difficulties use broader, lower bands.
- Light Fingers has original vector gloves, mirrored arms, reach/retract animation and a gem pedestal. Signal timing and early-tap penalties are unchanged.
- Turn-based playfields use player colors. Water Guess shows blue while awaiting AI after human submission. Round and final celebrations use winner colors with concise text.
- Keyboard instructions remain in setup; live keyboard legends were removed from Pong, Hockey and Car Duel. Touch arrow buttons remain.

Validation: 238 existing unit tests passed; all four Hammer tests including the new distribution check passed after the timing refinement. Five targeted browser scenarios passed (Water rounds/keypad, Hammer rotation/alternating turns, Light Fingers false starts/pause/results). Final TypeScript/Vite build and bundle checks pass. No Math Quiz edits, deployment or physical-device testing.

Hammer follow-up: alternating scale labels, full ring behind the tower, gravity-driven puck flight with separating bell contact, damped ring motion and compact floating scores. Six targeted unit tests and two Hammer browser scenarios pass; production build succeeds. Score rules and AI distribution remain unchanged.

Light Fingers / Lumberjack follow-up:
- Early or unsuccessful grabs now cause cooldowns, never point penalties. Successful grabs steal the gem; simultaneous grabs leave it available after both cooldowns. Blue's hand is hidden. Cooldown labels sit at the player edges, with no central message.
- The orange hand reaches the gem before it travels toward the winner. Pause freezes both motion and cooldowns.
- Lumberjack has original leafy trees, hatted characters, swinging axes, sliding segments, separated sky panels and narrow edge meters. All seven lookahead segments remain visible. Rules, seeded courses and scoring are preserved.
- Full unit suite: 241 passed. Complete-match browser regressions for both games passed. Production build succeeds. Physical-device testing remains outstanding.

Fruit Duel / Perfect Timer — 16 October 2026:
- Fruit Duel now uses real-fruit slicing versus gift/medal/flower decoys, original curved swords, object wobble, separating fruit halves, droplets and recovery arcs. Wrong/empty swings cause a 1.35-second cooldown without point manipulation. Valid slices retain the object ID visible at input, preventing reveal-boundary misjudgments. New local matches also support seeded replay.
- Perfect Timer has quiet half-second ticks and distinct stop clicks, alongside countdown and result effects. Fruit has swing, hit and slice cues. Shared audio still owns mute, volume and voice cleanup.
- YouTube could not be fetched (throttled); supplied screenshots guided the original vector artwork. No reference assets or audio were copied.
- Full suite passed 242 tests; subsequent targeted rules/audio/timer checks passed 13 tests after the final object-snapshot refinement. Production build passes. Browser/visual results are appended after verification.

Final browser verification: four scenarios passed across the collection and effects runs, covering a complete ten-slice match, AI response, decoy cooldown/repeated-input rejection, slicing, pause/cleanup, Timer pause exclusion, and scheduled tick/stop/slice/hit frequencies. Initial effects-test failures were test-observation issues (a screenshot consumed the reveal window; the audio probe read the default oscillator value instead of its scheduled frequency); both probes were corrected and passed. Screenshots inspected. No physical Android or speaker-listening certification.

Final web build and bundle budget pass. Setup instructions for these two games were condensed while retaining controls and rules, keeping the shell within its existing 24KB gzip budget; game implementations remain lazy.

Fruit sword motion: farther-back rest positions, short windup, a translated/rotated sweep through the object, and a slow return to the opposite side. Recovery is now the animation itself: .72s for successful slices and 1.35s for misses. Both players use the same mirrored path; pause freezes it. Separate cooldown rings and idle shaking were removed.

Sword follow-up checks: mirrored path/contact geometry, endpoint continuity, cooldown lock and terminal return pass; 18 AI regressions also passed. Two browser scenarios verify alternate-side return, input lock, pause, decoys, slice effects and cleanup. Rest/end screenshots inspected; production build and initial-payload budget pass.

Latest correction: Fruit swords return to their original backed-away rest after every swing; they no longer alternate sides. Gravity Runner now has one shared portrait course, denser seeded hazards, updated predictive AI and existing procedural flip/landing/death/round sounds. See GRAVITY_RUNNER_REFINEMENT.md for evidence.

Final motion pass: Gravity Runner now interpolates movement, flips and landings, anchors scenery to world distance and includes genuinely broken middle bridges. Happy Birds now uses one shared spiked wall-bounce arena with original birds, wing animation and safe pattern warnings. Both end deadlocks after two foreground minutes. Full 256-test suite, 14 browser scenarios and build/bundle/discovery checks pass. See GRAVITY_RUNNER_REFINEMENT.md. Flappy Jump and Car Duel are deferred intact under src/future-games and excluded from active menus/tournaments.
