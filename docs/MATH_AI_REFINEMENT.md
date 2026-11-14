# Math Quiz AI timing and difficulty

The opponent continues to select the validated question-bank key, not run a symbolic solver. Actual answers still go through `QuizMatch.answer`, identical first-response resolution, scoring and tie rules.

The previous Impossible latency was 25% of the question's estimated human solution time. Long university prompts could therefore leave it waiting about 10 seconds despite already knowing the answer. It now answers 0.70–1.25 seconds after presentation, always correctly. It never answers an unpresented question or takes action after completion. Medium takes 2.6–8 seconds with approximately 74% accuracy; Hard takes 1.5–4.2 seconds with approximately 95% accuracy. Question complexity still affects timing within each tier's bounds.

A seeded match personality retains pace and accuracy parameters across questions. Jitter is sampled once per question, not per frame. Development replay uses the existing `?aiSeed=42` support. Diagnostics expose seed, profile, difficulty, planned delay and accuracy. AI response state now follows the round counter rather than just the question ID, so reusing a question after a tie/retry cannot stall the opponent.

Validation: 100 complete matches per tier across seeds 0–99 and 5/12/40-second fixture questions, exact replay, 100% Impossible correctness, meaningful lower-tier separation, no pre-presentation response, single-shot answers, fair simultaneous responses, unchanged paused clocks and post-finish inactivity. The 300-match suite takes approximately 42 ms in this environment; measured mean latency/accuracy was Medium 6.22 s / 73.9%, Hard 3.06 s / 94.2%, Impossible 0.87 s / 100%. Existing math question validation and three-match history tests also pass. Browser regressions cover both variants, a complete 10-point Impossible win, pause/resume, and cleanup.

No question content, answer keys, prompt history or formula layout was changed. Device-specific performance still needs real Android validation.
