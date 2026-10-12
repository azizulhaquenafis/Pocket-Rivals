# Pocket Rivals

Three little games. One big rivalry. An original, offline, same-screen two-player collection built with TypeScript, Phaser 3, Vite, and Capacitor 8.

The app lives entirely in this folder; the surrounding workspace's grading files are unrelated and untouched.

## Play locally

Requires Node **22.21.1+** (current LTS recommended), npm, and a modern browser.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. Use a touchscreen for simultaneous two-player control. On desktop, mouse input controls one player at a time. Escape opens/closes pause. The production web build caches all game chunks after its first successful online load; the Android package contains every asset from installation and needs no connection.

```sh
npm run build       # Strict TypeScript check + optimized dist/
npm run preview     # Serve the production build on port 4173
npm test            # Simulation, game rules, persistence
npm run test:browser # Chrome mobile emulation, CDP two-touch input, offline build
npm run test:modules # Prove folder-only discovery with a temporary fourth game
npm run format      # Format source and developer documentation
```

Run `npm run build` before the browser tests: their production/offline scenario uses `dist/`. Browser tests use an installed Google Chrome; if unavailable, install Playwright Chromium and remove `launchOptions.channel` in `playwright.config.ts`. Tests start their own preview servers unless these ports are already serving this project.

## The collection

| Game        | Orange / Player 1     | Blue / Player 2       | Match          |
| ----------- | --------------------- | --------------------- | -------------- |
| Ping Pong   | Drag the lower half   | Drag the upper half   | First to 5     |
| Air Hockey  | Move the lower mallet | Move the upper mallet | First to 5     |
| Tic-Tac-Toe | ×; plays first        | ○; plays second       | Three in a row |

Orange is always at the bottom and blue at the top. Blue's score faces the person across the phone. Touches are assigned at pointer-down and stay with that player until release or cancellation. Extra fingers do not steal an active control. Paddle/mallet movement remains in its permitted field.

The menu includes a scrollable illustrated collection, sound/music preferences, persistent overall wins, round totals, and a confirmed scoreboard reset. Music preference is saved; **no music track is included**. Sound effects are synthesized locally with Web Audio. Rematches start a clean game. Draws count as completed matches but not wins; leaving or restarting an unfinished match does not change overall scores.

## Architecture

- `src/core/`: metadata discovery, lazy factory loading, lifecycle, pointer ownership, audio, storage and scores.
- `src/scenes/MainMenu.ts`: accessible DOM menu with native scrolling; custom local SVG illustrations.
- `src/scenes/GameHost.ts`: shared Phaser HUD and isolated module lifecycle.
- `src/scenes/Results.ts`: consistent result presentation.
- `src/games/*/`: independent metadata, factory, rules/physics, rendering, assets.
- `src/shared/`: contract, fixed timestep, drawing primitives and bounded effects.
- `examples/tap-duel/`: working extension example; **not installed in the collection**.
- `android/`: generated, customized native project, Gradle wrapper, icon and splash assets.

Games expose `initialize / update / pause / resume / dispose`. The host owns input cleanup, navigation, and one-time result recording. No game imports another game. Vite eagerly discovers only metadata and preview SVGs; game factories are separate lazy chunks. Adding a folder plus rebuilding packages it for Android automatically. See [ADDING_GAMES.md](ADDING_GAMES.md).

Pong and hockey run at a fixed 120 Hz. Hockey uses three collision substeps (360 Hz), capped velocities, collision projection, and a rail/mallet contact escape. Pong sweeps paddle contacts and derives reflection from impact position and paddle velocity. Catch-up is capped at 100 ms; backgrounding pauses the game and releases fingers instead of trying to replay hidden time. Graphics use up to 2× canvas resolution. Phaser owns the only render loop; no game starts a timer or requestAnimationFrame loop.

The portrait playfield fits inside its container without distortion. Phones request portrait orientation natively; landscape browser windows and larger Android displays retain a centered portrait field. Capacitor's CSS safe-area values and browser `env()` insets protect cutouts. The menu uses HTML for accessible buttons, scrolling and modal focus; gameplay and HUD render in Phaser.

## Android

```sh
npm run android:sync   # Build web + copy every chunk and asset into Android
npm run android:open   # Open generated project in Android Studio
npm run android:debug  # Sync + assembleDebug
npm run android:release # Sync + signed bundleRelease; environment credentials required
```

Expected debug output: `android/app/build/outputs/apk/debug/app-debug.apk`.
Expected release output: `android/app/build/outputs/bundle/release/app-release.aab`.

This workstation has no usable Java runtime or Android SDK, so **no APK/AAB or Android-device validation is claimed**. The project is configured for minimum SDK 24, compile/target SDK 36, with no app permissions and no remote assets. See [Android release instructions](docs/ANDROID_RELEASE.md), [privacy documentation](docs/PRIVACY.md), and the [QA report](docs/QA.md).

## Visual assets and licenses

Pocket Rivals branding, preview illustrations, icon, and geometric game graphics were created for this project. The provided screenshots and [reference Play listing](https://play.google.com/store/apps/details?id=com.JindoBlu.TwoPlayerGamesChallenge&hl=en) informed the minimalist composition, black outlines, bold color, and shared-device interactions. No reference logos, illustration files, sounds, or branded text are packaged.

Fredoka and Nunito Sans are bundled locally under the SIL Open Font License. See [third-party notices](docs/THIRD_PARTY_NOTICES.md). The proposed name and package ID still need the publisher's final availability/ownership review before the first public release.
