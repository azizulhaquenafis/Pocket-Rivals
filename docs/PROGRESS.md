# Active development

Work order: Ultimate Golf refinement/competition, then the 13-game expansion one game at a time. Specification: `specifications/13-games.md`. No deployment/push.

## Golf refinement

Implemented responsive compact HUD/footer, smooth uniform focus camera, safe portal exit, configurable recurring UFO, separate casual/hot-seat/AI controllers, seeded competitions and real bounded worker shot planning. Casual records preserved. All four legal completion fixtures pass; optional Impossible AI audit also completed all four with seed 123. Production build, 148 unit tests, 25 browser tests, module-discovery check, bundle check and Android sync passed. Physical Android/Safari and exhaustive seed testing remain unverified. See ULTIMATE_GOLF.md.

## Expansion queue

Foundation: procedural effects expanded, capped voices, persistent effects volume, unused music control removed. Unit/browser checks pass.

Completed sequentially with builds and targeted unit/browser checks: Dots and Boxes, Hammer Hit, Light Fingers, Fruit Duel.

Current: Math Quiz (implemented, validation/browser checks underway; 100-question SymPy-verified bank). Then Lumberjack → Chicken Jump → Archery Duel → Gravity Runner → Happy Birds → Spike Attacks → Flappy Jump → Car Duel.

Finish/test/build each game before starting the next. Finally audit existing audio, full integration/performance checks and documentation. The referenced 23-page PDF is not supplied; written rules provide explicit defaults. Google Play reference inspected; original vector art only.

## Environment

Web/installed Chrome testing available. Android sync available; Java runtime/SDK unavailable for APK build. No physical Android tests. Unrelated grading workspace files must remain untouched.
