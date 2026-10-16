# Future games

Flappy Jump (`flappy-jump`), Car Duel (`car-duel`), Archery Duel (`archery-duel`) and Chicken Jump (`chicken-jump`) are paused projects, preserved intact with their assets, metadata, AI, rules and module instructions.

This directory is intentionally outside `GameRegistry` and `GameLoader` discovery. These games do not appear in Quick Play or tournament selection, and their implementations/assets are not bundled. Existing stored records and IDs are not deleted. An old tournament containing a deferred game can be replaced through New tournament; an unavailable saved round cannot launch.

To reactivate a game, move its entire folder back into `src/games/` and rebuild. Relative imports retain the same depth; no core edits are needed. Unit tests remain active under `tests/unit` and reference this directory. Restore its saved browser spec from `tests/future/` to `tests/browser/` when the game returns, then run tests, build and module/bundle checks.
