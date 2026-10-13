# Pocket Rivals

An original offline game collection for one phone: four local/AI rivalry games, three solo arcade games, and persistent tournaments. TypeScript · Phaser 3 · Vite · Capacitor 8. The existing cream/pastel visual identity, local typography, bold outlines and illustrated cards are preserved.

## Run

Requires Node 22.21.1+ and npm.

```sh
npm ci
npm run dev             # http://127.0.0.1:5173/
npm run build           # Strict TypeScript + production dist/
npm run preview         # Production preview on port 4173
npm test                # Pure rules, physics, AI and persistence
npm run test:browser    # Installed Chrome, Pixel 7 emulation and CDP multi-touch
npm run test:modules    # Folder-only automatic discovery proof
npm run test:bundle     # Initial-payload budget and lazy-module verification
node scripts/measure-performance.mjs # Running dev server required; desktop Chrome sample
```

Build before running browser or bundle tests. Browser tests use installed Google Chrome; alternatively install Playwright Chromium and remove the channel override in `playwright.config.ts`. Vercel configuration is included; nothing has been deployed.

## Play

| Collection | Games |
| --- | --- |
| 2 Player Games | Pong, Air Hockey, Classic/Ultimate Tic-Tac-Toe, Connect Four |
| 1 Player Arcade | Ultimate Golf, Classic Snake, Star Patrol |
| Tournament | Any eligible rivalry game/variant; random or selected pool; local or AI |

Every rivalry game offers Medium, Hard and Impossible AI. Classic Impossible cannot be beaten with legal play; Ultimate and Connect Four use strong bounded searches, **not a mathematical optimality guarantee**. Blue is AI in single-player games. For local games, orange plays from the bottom and blue across the phone.

- Pong/Hockey: first to five, or lead at two minutes. Regulation 0–0 draws; other ties get a 60-second sudden-death period, then draw. Hockey also awards a point against 15 seconds of continuous possession on one half.
- Ultimate: legal boards are highlighted; optional focus enlarges the required board. The interactive tutorial is in setup.
- Connect Four: tap a column.
- Ultimate Golf: four source-faithful solo courses in a vertical 9:16 view. Pull back anywhere on the course and release; Focus enlarges the view, ? explains the course, R retries. Easy/Normal/Hard preserve the original obstacle speeds and stroke limits. [Port details](docs/ULTIMATE_GOLF.md).
- Snake: direction pad, swipe, arrows or WASD. Star Patrol: drag the lower field to move/fire, or arrows/A–D plus Space.
- Escape/back opens pause. Backgrounding pauses automatically. Settings retain sound/music preferences; no music track is included.

Completed duel scores, tournament progress, unfinished matches and arcade high scores are stored locally. Golf keeps per-course best scores; active Arcade runs restart after closure. No accounts, ads, analytics, backend or external AI.

Android packages the full collection offline. The production web version caches the shell and games as played; use **Settings → Save all games offline** while connected to make every game and AI worker available without a network. Browser site-data eviction can remove that cache.

## Development

Open `/?diagnostics` in development for FPS/frame time, initialization timings, scenes, texture count, memory where supported, AI search time and loaded modules. The diagnostic UI and read-only test snapshots are disabled in production.

Start with [architecture](docs/ARCHITECTURE.md), [adding games](docs/ADDING_GAMES.md), the root AGENTS.md and the target game's AGENTS.md. Each game owns its rules, physics, AI and assets. Only metadata is eager; implementations and workers are split into lazy chunks. The stable Pong ID remains `ping-pong`.

## Android

```sh
npm run android:sync    # Build and package all web assets
npm run android:open    # Open Android Studio
npm run android:debug   # Sync + assembleDebug
npm run android:release # Sync + signed bundleRelease
```

Debug output: `android/app/build/outputs/apk/debug/app-debug.apk`. Release output: `android/app/build/outputs/bundle/release/app-release.aab`. This workstation lacks a usable Java runtime and Android SDK; no APK/AAB or physical-device testing is claimed. Android is configured with min SDK 24, compile/target SDK 36, portrait mode and no app permissions. See [build/signing instructions](docs/ANDROID_RELEASE.md).

[QA and known limits](docs/QA.md) · [Privacy/data handling](docs/PRIVACY.md) · [Third-party licenses](docs/THIRD_PARTY_NOTICES.md). Branding and illustrations are original; fonts are bundled under their open licenses. Publisher identity/name/package availability and release signing remain the publisher's responsibility.
