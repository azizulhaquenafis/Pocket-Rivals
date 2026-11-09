# Light Fingers hands and recovery

The supplied video was inspected through browser screenshots: two opposing gloved hands, a shared central gem, and reach/return movement inform the original vector presentation. No reference assets were copied.

Both players have a visible hand, including AI Blue. A legal steal reaches the center, curls the fingers around the gem and returns to that player's home position. Failed grabs reach, recoil, turn gray and ease back to rest while regaining their color. Recovery uses the existing 1.25-second input lock instead of a numeric countdown. No live instruction labels or new timers were added.

`HandMotion.ts` contains only presentation curves driven by `LightMatch.time`. This freezes every pose on pause and aligns readiness with the rules' existing deadlines. Outcome changes preserve the current hand position. `LightArt.ts` owns glove/pedestal/gem vectors; `LightGame.ts` observes model results and cooldown changes for both human and AI input. Scoring, tie resolution, signal fairness, AI delays and tournament results are unchanged.

Verification: **eight unit tests and three browser checks passed**, covering scoring/input locks, animation continuity, recoil, color restoration, carrying, exact readiness, rejected retry inputs, both players, AI steals, pause/resume, a small mobile viewport, scene cleanup and the existing steal/Lumberjack regression. Production TypeScript/Vite build and bundle guard passed. Screenshots: light-two-hands.png, light-hands-recovery.png, light-blue-steal.png, light-ai-steal.png and light-small.png.

Physical Android validation remains outstanding. Rendering uses the existing Phaser loop and one retained graphics object; there are no additional listeners, animation timers or asset downloads.
