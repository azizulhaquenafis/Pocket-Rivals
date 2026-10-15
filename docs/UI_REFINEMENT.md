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
