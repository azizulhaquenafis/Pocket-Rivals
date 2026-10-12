# Adding a mini-game

Adding a game is a **build-time folder operation**, not a downloaded runtime plugin. Every Android build includes every discovered folder. Unselected games have metadata in the menu but their implementation is only loaded when selected.

## Working example

A complete, playable example is included at `examples/tap-duel/`. It is intentionally outside `src/games/`, so the shipped initial collection contains exactly three games.

```sh
cp -R examples/tap-duel src/games/tap-duel
npm run build
npm run dev
```

**Tap Duel** now appears in the menu. Orange taps the lower half; blue taps the upper half; the first to ten taps wins. No menu, registry, router, score manager, or existing game changes are needed. For Android, run `npm run android:sync` and rebuild the APK/AAB.

`npm run test:modules` copies the application into a temporary directory, adds only this example folder, type-checks it, builds it, verifies its discovered metadata and lazy code, and removes the temporary directory. It leaves the installed three-game collection unchanged.

## Required folder contract

```text
src/games/my-game/
  config.ts             lightweight default-exported metadata
  index.ts              default-exported factory returning a fresh MiniGame
  Game.ts               implementation (optional split)
  assets/preview.svg    original card illustration (220 × 180 recommended)
  assets/               any other bundled assets
```

The folder name and metadata `id` must be identical lowercase kebab-case. IDs must be unique. `config.ts` must never import gameplay code or initialize Phaser objects.

```ts
// config.ts
import type { GameMetadata } from "../../shared/interfaces/MiniGame";
import preview from "./assets/preview.svg?raw";

export default {
  id: "my-game",
  name: "My Game",
  description: "A short, playful description.",
  instructions: "Explain both controls and the winning condition.",
  preview,
  color: "#d5c2e9",
  accent: "#eadff6",
  tag: "QUICK FINGERS",
  order: 4,
  supportedModes: ["local-two-player"],
} satisfies GameMetadata;
```

`index.ts` exports a factory, **never a reused singleton**:

```ts
import { MyGame } from "./Game";
export default () => new MyGame();
```

Use `examples/tap-duel/index.ts` as the minimal working `MiniGame` implementation. It includes drawing, two-player input, scores, completion, pause/resume, and disposal; there is no placeholder dependency to fill in before playing it.

## Lifecycle and context

| Method                 | Responsibilities                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `initialize(context)`  | Create scene-owned objects, state, input subscriptions; set initial score and hint.       |
| `update(deltaSeconds)` | Simulate/render a frame. Delta is seconds and capped at 0.1. Use `FixedStep` for physics. |
| `pause()`              | Stop simulation; reset any accumulated time. Host also releases and disables input.       |
| `resume()`             | Resume without simulating elapsed background time.                                        |
| `dispose()`            | Destroy everything the module created. Called on navigation/restart.                      |
| `snapshot?()`          | Optional read-only debug information, used only by development tests.                     |

`GameContext` supplies:

- `scene`: Phaser scene used for all rendering, tweens, timing, and local assets.
- `input`: `dragHalves()` exposes two separately owned `players`; `tap()` receives logical `x`, `y`, and side `player`. Host manages every subscription made through this object.
- `audio.play('tap' | 'hit' | 'goal' | 'win' | 'draw')`: global preferences and audio context are respected. Host handles final win/draw sounds.
- `setScore(orange, blue)`: this match's HUD, separate from persistent overall wins.
- `setHint(text)`: compact controls/win-rule hint below the field.
- `finish({ winner: 1 | 2 | 'draw', scores: [orange, blue] })`: end the match. The host pauses controls, persists a result once, and opens rematch/menu actions.

Use logical **420 × 760** coordinates. `FIELD` defines the game area: x = 24…396, y = 112…650, center y = 381. Keep gameplay and game touch handling inside it. Orange is player 1 at the bottom; blue is player 2 at the top. The host owns the header, score pills, and footer. InputManager already converts high-density canvas coordinates into this logical space.

## Isolation rules

1. Import only your own files, `core` services exposed through the contract, and `shared` helpers. Never import another game or reach into `GameManager`.
2. Do not directly write localStorage, award persistent wins, navigate, or start another scene.
3. Do not add global event listeners, raw intervals/timeouts, standalone animation loops, or unbounded particle arrays. If an exceptional resource is necessary, explicitly dispose it.
4. Prefer `context.input`. If using additional Phaser keyboard/game-object listeners, remove them in `dispose`. Destroy timers/tweens that you create; scene shutdown is a second safeguard.
5. Keep all state instance-local. Reset state through a fresh factory instance on rematch.
6. Use local SVGs, procedural graphics, or imports resolved by Vite. Any Phaser texture cache key must be namespaced, e.g. `my-game:ball`, and removed during disposal if owned exclusively by this module. For asynchronous asset initialization, guard callbacks after disposal, suspend interaction until ready, and remove loaders/listeners you own.
7. Clamp input, simulation time, velocities and object counts. Separate pure rules/physics for deterministic tests. Never assume only one active touch exists.
8. Return exactly one result. Treat draw as a draw; do not arbitrarily award one player.

## Validate before packaging

- Test the new game's full win/draw/lose and rematch paths.
- Exercise both touches concurrently and with a third finger/cancel event.
- Confirm 30/60/90/144 Hz simulation equivalence where appropriate.
- Run repeated switching and confirm listener/object counts return to baseline.
- Check safe areas, small phones, tall phones, landscape and larger screens.
- Run `npm test`, `npm run build`, `npm run test:browser`; update collection-count assertions when intentionally expanding beyond three games.
- Run `npm run android:sync`, rebuild, and validate on physical Android hardware.
