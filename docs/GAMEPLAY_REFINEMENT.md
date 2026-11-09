# Gameplay refinement — November 2026

- Penfight: 350-unit maximum centre-flick speed, constant translational/rotational energy budget, off-centre collision torque, and a separate 120-second foreground draw clock. First-to-three scoring remains. Pause/background time is excluded. Opening knockout, centre/tip contact and timer regressions added.
- University Math Quiz: 3,072 additional exact-rational variants across eight topics. Every new answer is independently checked numerically; all options and explanations pass strict KaTeX. Duplicate prompts are removed. Persistent history retains up to 10,000 IDs, evicts basic entries first, and university topics repeat only after the full bank is exhausted. A finite bank cannot promise infinite novelty; clearing browser storage resets history.
- Dots and Boxes: neutral initial edges; keyboard selection appears only when used.
- Hammer Hit: normalized needle now renders a full 180-degree sweep; scoring and AI timing are unchanged.
- Lumberjack: first to 100, branch collision immediately loses, no idle/round timeout. Identical seeded streams remain; stronger character details, bark grain and wood chips preserve the existing flat theme. Old timer/progress meters removed.
- Perfect Timer: preserved intact under `src/future-games/perfect-timer`; excluded automatically from menus/tournaments/bundles. Unit tests remain active and browser cases are archived under `tests/future`.
- Water Guess: integer levels and answers, no duplicate guesses, no tube ticks/empty foot. Reveal displays only the actual percentage on the winner-colored field. Keyboard/touch and flipped local input remain supported; unavailable AI estimates choose an adjacent legal answer without re-sampling.
- Spike Attacks: brighter red warning strips and a pulsing near-edge danger band; timing, geometry and other settings unchanged.

Verification: 64 targeted unit tests plus 18 AI regressions passed. Seventeen affected browser checks passed across the initial run and corrected reruns, including a full 100-chop race, two-minute idle draw, paused timer, duplicate guess rejection, all Penfight AI levels, mobile input, and production launch. Initial automation races were corrected to wait for input readiness and capture paused state after pausing. Visual review found and fixed the Water Guess reveal's container-relative position. Screenshots of the tube/reveal, Lumberjack, Dots and red warnings were reviewed.

TypeScript/Vite build, automatic module discovery and bundle guard passed. Initial shell: 22,858 gzip bytes, below the unchanged 24,000-byte budget. No physical Android device verification, push or deployment was performed. Local app remains at http://127.0.0.1:5173/.

## Device-aware play and denser courses (November 9)

- Spike Attacks now opens without a map picker. Every launch selects among all three arenas using a fresh match seed; fixed AI debug seeds remain reproducible. Red warning glow is reduced from 25 to 9 world units and lower opacity, with the crisp red edge retained.
- Gravity Runner starts obstacles at 300 distance, tightens independent clearances from 245–380 to 230–285, reaches full density earlier, adds 3–4 obstacle clusters and three-part switchbacks/slaloms, and shortens long uninterrupted rails. Map-specific trap physics, speed cap and guaranteed rail entry/exit space remain intact.
- Desktop turn views, blue score, Math Quiz and Lumberjack stay upright. Touch-primary devices retain opposite-side orientation; Lumberjack touch coordinates use the same orientation decision. No physics differences by screen size.
- Lumberjack branch slots move up 36 units. The next safe branch clears the cap; a lethal next branch falls into the head without awarding points. Branches above the panel are culled.
- Math Quiz variant cards show titles only. Basic gains equations, powers, ratios and averages; University gains 1,536 exact series/logarithm/vector/modular questions (4,608 extended variants total). The original verified bank remains unchanged.

Validation: 60 targeted unit checks passed (26 math/device/Lumberjack/Spike checks plus 34 Gravity checks), including 400 seeded two-minute routes across all four maps and 100 seeds per AI difficulty. Eighteen browser scenarios passed across desktop/touch orientation, a complete 100-chop race, all four Gravity viewports, Spike controls/match completion, pause/cleanup, Water Guess and tournaments. CPU-contended aggregate tests initially timed out; simulation batches now yield between seeds and were rerun cleanly sequentially. Production Vite build, automatic module discovery and bundle checks passed. Initial application entry gzip is 22,732 bytes, below its unchanged 24,000-byte budget. Android hardware was not tested.
