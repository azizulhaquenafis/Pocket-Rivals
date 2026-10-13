# Pocket Rivals — universal rules

- Work inside this project; the surrounding grading workspace is unrelated. Preserve the existing visual identity.
- TypeScript strict, Phaser 3, Vite, Capacitor. One Phaser instance and render loop. No backend, ads, analytics, accounts, remote assets or AI services.
- Read `docs/ARCHITECTURE.md`, the contract and the target module's AGENTS.md. Do not read or modify unrelated games by default.
- Modules live in `src/games/*` or `src/arcade/*`. Only lightweight config/thumbnail metadata is eager. Factories, rules, physics and AI load on demand. Never import one game into another or into core/shared.
- Keep factories/constructors free of listeners and side effects. Initialize with GameContext; own and dispose every scene resource, worker, timer and subscription. Host-owned input is cleared on pause and disposed on shutdown.
- Simulations use fixed/bounded steps. Match clocks use foreground monotonic elapsed time. Preserve pointer identity, velocity/acceleration limits, separating collision normals and penetration correction.
- Orange is Player 1; blue is Player 2/AI. Keep HUD outside play areas, retain black outlines, local fonts, rounded geometry and brief feedback. Do not reintroduce opacity-zero menu remounts.
- Duel results and arcade scores are separate. Core coordinates scoring and tournament attempt tokens; only a valid current attempt may score. Validate restored data. Preserve the legacy Pong ID `ping-pong`.
- Heavy AI runs in cancellable workers with time/node bounds. AI obeys human physics. Only Classic Tic-Tac-Toe claims optimal play; other Impossible modes are bounded practical searches.
- Run relevant unit checks, `npm run build`, browser regressions and `npm run test:bundle`. Run `test:modules` for discovery changes. Do not equate headless desktop Chrome with Android device validation.
- Android assets are packaged; web modules cache on first use, with an explicit offline download in Settings. No secrets, SDK paths, build outputs or credentials in source control. Never publish/deploy without the user's request.
