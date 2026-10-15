# Connect Four module

ConnectFourRules.ts owns gravity, legal columns, 69 winning windows, undo and replay validation. ConnectFourAI.ts mutates/undoes only a worker-local board and must restore it even on timeout. Search uses iterative deepening, bounded alpha-beta and transposition entries. ConnectFourGame blocks input during the drop animation/AI turn and checkpoints complete moves. Keep 7×6 geometry and match-result reporting independent of tournaments.

Read only this folder, the shared contract and required shared helpers. Do not import other games or put rules in core. Own and dispose workers/graphics; use host-owned input. Relevant checks: `tests/unit/phase3.test.ts and browser/phase3.spec.ts` (browser paths are under tests).

AI identities use the lazy `shared/ai/MatchRandom.ts` utility; keep tactical parameters inside this module and preserve personality across rounds. See `docs/AI_REFINEMENT.md` for seeded replay and audit commands. Preserve legal actions and bounded worker/motion behavior when adding variety.
