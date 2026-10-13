# Add a game without editing core

1. Create `src/games/<folder>/` for a duel, or `src/arcade/<folder>/` for a solo arcade game.
2. Add `config.ts`, `index.ts`, your implementation, and a small original SVG preview.
3. Implement `MiniGame` from `src/shared/contracts/GameModule.ts`.
4. Run tests and rebuild. Metadata discovery, the menu, lazy loader and eligible tournaments update automatically.

No edits to registry, router, score manager, menu or another game are needed. The folder name need not equal the stable game ID. Installation is **build time**, not runtime plugin downloading.

## Metadata

```ts
import type { GameMetadata } from '../../shared/contracts/GameModule';
import preview from './assets/preview.svg?raw';
export default {
  id: 'tap-duel', name: 'Tap Duel',
  description: 'A little race for your thumbs.',
  instructions: 'Tap your own half. First to ten wins.',
  color: '#f3bdab', accent: '#fffdf5', preview,
  order: 20, tag: 'QUICK FINGERS', category: 'duel', tournament: true,
  supportedModes: ['local-two-player'],
} satisfies GameMetadata;
```

Declare `single-player` only if AI is implemented for duels. Unsupported AI is disabled in setup and excluded from AI tournament pools. Optional `variants` contain IDs, display names, descriptions, `ai: false` overrides and `hasTutorial`. Your factory receives `MatchOptions` and may lazily import the selected variant. An optional named `tutorial(variant, ui)` export owns that game's tutorial.

## Working example

`examples/tap-duel/` is a complete, playable implementation, not part of the shipped collection. Copy that folder unchanged into `src/games/tap-duel/`, then run `npm run build`. It demonstrates input, independent state, score reporting and disposal. `npm run test:modules` performs this copy in a temporary checkout and verifies discovery/build without changing the real collection.

Its factory is simply:

```ts
export default () => new TapDuel();
```

The class implements:

```ts
initialize(ctx: GameContext): void; // Create objects and bind input here.
update(elapsedSeconds: number): void;
pause(): void;   // Clear transient controls; cancel AI work.
resume(): void;
dispose(): void; // Destroy objects, remove owned assets, terminate workers.
snapshot?(): unknown; // Optional development observability, not mutable controls.
```

Use `ctx.setScore(one, two)`, `ctx.setHint(text)`, optional `ctx.setClock(text, urgent)`, and exactly one `ctx.finish({ winner: 1 | 2 | 'draw', scores: [one, two] })`. Winner is explicit; low-score games such as golf work without special tournament logic. Never update global scores yourself.

For Arcade, declare `category: 'arcade'`, `tournament: false`, `supportedModes: ['single-player']`. Use `ctx.bestScore`, `ctx.setArcadeHUD(score, detail)` and `ctx.finishArcade(score, detail)` instead of duel results. Core persists the high score independently.

## Isolation and performance checklist

- Keep rules, physics, AI, course data and save validation in the module. No cross-game imports.
- Do not import implementation code from `config.ts`; it is eagerly evaluated. Use only lightweight SVG previews there.
- Constructors/factories must have no side effects. Create listeners, workers and objects only in `initialize` or a cancellable decision.
- Use the supplied scene; never create another Phaser.Game or rendering loop. Coordinates are logical 420×760; shared HUD lies outside the playfield.
- `ctx.input.tap`, `dragHalves`, `drag`, `press` and `keys` are host-cleaned and pause-aware. Any additional subscription must have its own cleanup.
- Use fixed-step simulation for physics. Use foreground elapsed time for real clocks. Never tick time by frame count.
- Use `WorkerTask` for costly search. Workers should return within a bounded budget, report `milliseconds`, and terminate on pause/dispose. Call `ctx.reportAI` for diagnostics.
- Call `ctx.saveState` only with compact serializable data. Validate `ctx.restoredState`; reject malformed histories rather than trusting stored cells. Checkpoint after discrete moves or at a modest frequency.
- Namespace dynamic textures; remove them on disposal. Do not allocate graphics/text or unbounded particles each frame.
- Test rules, illegal input, results, pause, stale worker cancellation, saves, repeated navigation, mobile layout and offline worker loading. Add a concise module AGENTS.md.

## Commands

```sh
npm run dev
npm test
npm run build
npm run test:browser
npm run test:modules
npm run test:bundle
npm run android:sync
npm run android:debug
npm run android:release # Requires local signing environment variables
```

`test:bundle` discovers the expected folders automatically, verifies their lazy chunks and enforces an application-shell size budget. Review the report when adding games; no module-count expectation or application core change is needed. Android signing/build prerequisites are in `docs/ANDROID_RELEASE.md`.
