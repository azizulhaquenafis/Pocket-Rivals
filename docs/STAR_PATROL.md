# Star Patrol combat update

Marked gold supply ships carry a visible reward icon and drop a real falling capsule when defeated. They appear on odd levels and six-level life milestones. Ordinary loot drops every **32 kills**, reduced from eight. Ace rewards remain. Loot expires if missed and gently attracts toward a nearby ship in the collection area. Score is earned through combat; no automatic gear is awarded just for reaching a level.

- Cannons stack through twin, triple and five-shot tiers. Damage removes one tier.
- Rapid fire lasts 14 seconds; piercing lasers 16; wingmates 18. Repeated temporary pickups stack up to 24 seconds. Shields absorb one hit.
- **Every new level resets cannons, rapid fire, lasers, wingmates and shields.** Uncollected equipment capsules and pickup announcements are cleared too. Lives, score and falling life capsules carry over. Formation retries within the same level retain gear.
- Lives come only from supply ships on six-level milestones, at least 90 gameplay seconds apart. Four lives maximum; already-full life pickups become shields. Ordinary loot never includes lives.
- Level 2 introduces armor, level 3 aimed gunners, and every fourth level an armored ace with fan attacks and a laser reward. Formation speed, projectile speed, firing rate and enemy durability increase within bounds. Charged shots have a visible warning.

Rendering retains the pastel/outlined visual identity, with compact level/weapon badges, timed-gear bars, companion and shield indicators, collectible icons and brief pickup feedback. Touch steering/firing and keyboard arrows/A/D + Space remain supported. Pause freezes combat and gear durations.

The module stays lazy. No dependencies, extra render loops or standalone physics engine were added. Fixed pools reserve 52 player and 28 enemy projectiles, eight pickups and 24 short effects. Swept collisions handle angled shots and nearest-hit ordering; piercing shots cannot repeatedly damage the same ship. Use numeric `?aiSeed=42` in development for reproducible attack/loot choices.

## Verification

- Original combat update: full Vitest suite **297 tests across 32 files passed**. Reduced-drop/level-reset update: **52 relevant unit tests passed**, plus all four relevant browser checks, production build and bundle guard. Browser play confirms gear is cleared on reaching level 2; its touch-driving test now dodges enemy fire instead of relying on abundant pickups.
- Ten dedicated combat tests cover formations through level 20, reduced loot frequency, life restrictions, weapon tiers/durations, piercing collisions, attack warnings, shields/damage, level reset versus same-level retries and 100 seeded powered scenarios.
- Four browser checks passed: real touch/keyboard play at small viewport sizes; actual drops/catches and progression to level 2; pause/resume and listener disposal; production mobile/desktop launch; registry laziness, navigation cycles and arcade exclusion from tournaments.
- Production TypeScript/Vite build and bundle guard passed. Game implementation remains a dynamic entry; the shell remains within its existing 24,000-byte gzip budget (current measurement in bundle-report.json). Shared Phaser remains the dominant initial payload.
- Mobile and desktop screenshots were inspected. Android hardware and sustained on-device 60 FPS have **not** been verified; no such performance claim is made. Higher endless levels have scenario coverage rather than exhaustive human playtesting.

An initial navigation run timed out; its isolated rerun and the final complete browser group passed without changes to shared navigation. A browser run interrupted by source hot reload was discarded and repeated after edits stopped. Math Quiz and other game implementations were not modified.
