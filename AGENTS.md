# Pocket Rivals engineering rules

- Exactly three initial games; no network services, accounts, ads, analytics, or remote assets.
- TypeScript strict, Phaser 3 gameplay, Vite build, Capacitor Android. Keep dependencies small.
- Games are isolated folders in src/games. config.ts is lightweight metadata; index.ts exports a factory. Registry discovery is build time and factories are lazy loaded.
- Never import one game from another. Core and shared code must never import a specific game. Communicate only through MiniGame/GameContext.
- Own every listener, tween, object and timer. dispose must release input and scene resources; pause must clear held pointers. No independent RAF/setInterval loops.
- Physics runs at fixed 120 Hz with bounded catch-up. Keep simulation independent from rendering, support concurrent pointer IDs, clamp velocities, use swept/substep collisions.
- Player 1 orange/bottom; Player 2 blue/top. Safe areas and controls must not obstruct either touch half. Canvas gameplay must prevent browser gestures.
- All assets/font/audio must be local or procedural. Follow shared palette, heavy dark outlines, rounded forms, short feedback animations.
- A result can be recorded only once per round; draws never count as a win. Storage must tolerate corrupt/blocked localStorage.
- Run npm test, npm run build and npm run test:browser for gameplay/lifecycle changes. Report actual coverage honestly; browser emulation is not device validation.
- Do not commit credentials, keystores, SDK paths, build outputs or node_modules. Never publish without explicit user authorization.
