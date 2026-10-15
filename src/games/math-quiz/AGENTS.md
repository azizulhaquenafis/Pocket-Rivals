# Math Quiz

Banked university questions: `questions/university.json` (100 verified static questions) supplemented by procedural question families in `questions/ProceduralUniversity.ts` across 8 topics (Limits, Derivatives, Integrals, Trigonometry, Algebra, Matrices, Complex numbers, Probability) providing >430+ distinct valid instances.
Basic arithmetic is procedurally generated in `questions/Basic.ts` across 7 categories (Addition, Subtraction, Multiplication, Division, Fractions, Percentages, Operator Precedence) with exact rational and integer calculations and misconception-based distractors.
Repetition and uniqueness are tracked via bounded FIFO ring buffer (150 recent question IDs) in `questions/History.ts` under localStorage (`pocket-rivals.math-history.v1`), with safe fallback to memory and graceful topic exhaustion reset policy preventing infinite loops.
Every question guarantees exactly three pairwise distinct options, exactly one correct answer, two plausible misconception-based distractors, and strictly validated KaTeX LaTeX.
MathUI is a DOM overlay positioned over the logical 420x760 canvas. It includes dedicated player-local topic indicators, balanced vertical rhythm, display-mode margin resets inside buttons, and dual-axis auto-fit scaling executed upon `document.fonts.ready` and viewport resizes. Blue section rotates 180 degrees for local two-player mode and is cleanly disposed on shutdown.
Rules coordinates scoring via FirstResponse, rewarding 1 point for the first correct answer and awarding 1 point to the opponent on errors. First to 10 points wins.
Math Quiz AI is game-local (`AI.ts`) with difficulty-calibrated latency and accuracy, never responding before question visibility.
