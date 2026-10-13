# POCKET RIVALS — GRAND CODEX IMPLEMENTATION PROMPT
## 13 New Mini-Games, Advanced Mathematical Challenges, AI Opponents, Sound Effects, Tournaments & Cross-Platform Optimization

# 1. PROJECT OVERVIEW

You are working on **Pocket Rivals**, an existing minimalist multiplayer mini-game collection developed using:

- TypeScript
- Phaser 3
- Vite
- Capacitor for Android
- The project's existing modular game architecture

I want you to implement **13 fully functional new mini-games**, inspired by the gameplay concepts demonstrated in my attached 23-page reference PDF.

The primary reference application is:

https://play.google.com/store/apps/details?id=com.JindoBlu.TwoPlayerGamesChallenge&hl=en

Study the game design principles of this application, particularly:

- Instant, easy-to-understand gameplay.
- Local multiplayer on one device.
- Responsive touch controls.
- Short, competitive matches.
- Simple but polished graphics.
- AI opponents with multiple difficulties.
- Consistent score tracking.
- Fast transitions between games.
- Replayability.

The attached PDF provides gameplay references for 13 mini-games.

**Use the PDF to understand the mechanics, not to duplicate copyrighted graphics, audio, branding, or code.** All new visuals should follow Pocket Rivals' existing original aesthetic.

## Fundamental Development Requirement

**Implement every game ONE BY ONE.**

Do not create 13 incomplete demonstrations and attempt to finish them afterward.

The correct process is:

1. Understand a game's rules.
2. Implement its complete gameplay logic.
3. Implement its controls.
4. Implement AI.
5. Implement scoring and victory conditions.
6. Add appropriate sound effects.
7. Integrate it into Pocket Rivals.
8. Test it thoroughly.
9. Fix bugs.
10. Move to the next game.

Each game must be independently playable before another is started.

### Priority Order

1. Actual runnability and functionality.
2. Correct game mechanics.
3. Correct scoring and winner detection.
4. Smooth, responsive controls.
5. Stable AI.
6. Cross-platform compatibility.
7. Smooth physics and animations.
8. Consistent minimalist visuals.
9. Performance and scalability.
10. Additional polish.

Never prioritize visual complexity over reliable gameplay.

---

# 2. PRE-IMPLEMENTATION ANALYSIS

Before modifying the codebase:

1. Read the root AGENTS.md.
2. Inspect the existing source structure.
3. Identify all registered mini-games.
4. Understand the GameRegistry and GameLoader.
5. Inspect the current AI implementations.
6. Inspect the scoring and tournament systems.
7. Inspect the touch/mouse input architecture.
8. Inspect existing scene-transition code.
9. Inspect existing audio infrastructure.
10. Inspect the responsive layout system.
11. Review the attached rules PDF.
12. Identify overlapping or duplicated gameplay modules.

Do not replace working functionality unnecessarily.

If the repository differs from the assumed architecture, adapt your implementation to the actual code.

Preserve the current Pocket Rivals design system, especially:

- Warm off-white backgrounds.
- Orange and blue player identities.
- Pastel-colored playing surfaces.
- Thick dark outlines.
- Rounded cards and buttons.
- Minimalist vector illustrations.
- Clear typography.
- Smooth and restrained animations.

The new games must feel like original Pocket Rivals titles, not imported applications.

---

# 3. GAMES TO IMPLEMENT

Implement these 13 games:

1. Car Duel
2. Archery Duel
3. Gravity Runner
4. Light Fingers
5. Fruit Duel
6. Happy Birds
7. Math Quiz
8. Dots and Boxes
9. Lumberjack
10. Hammer Hit
11. Flappy Jump
12. Chicken Jump
13. Spike Attacks

Every game must support:

- Local two-player mode.
- Single-player versus AI.
- Medium AI.
- Hard AI.
- Impossible AI.
- How to Play instructions.
- Pause and resume.
- Restart and rematch.
- Sound effects.
- Correct winner detection.
- Existing tournament integration.
- Mobile touch controls.
- Desktop mouse or keyboard controls.

The rules below combine the PDF's explicit mechanics with agreed implementation defaults where the PDF is incomplete. Preserve these defaults for now, but document them as configurable design decisions rather than claiming they are confirmed original-game rules.

---

# 4. DETAILED GAME SPECIFICATIONS

## GAME 01 — CAR DUEL

Reference: PDF pages 1–3.

### Gameplay Concept

A 2D side-view vehicle battle where players attempt to strike their opponent's driver's head without exposing their own.

Two cars spawn on opposite sides of an arena.

The cars use simple but stable physics involving acceleration, momentum, rotations, wheel contact, and collisions.

### Rules

- Each player controls forward and backward movement.
- Vehicles can collide, tilt, roll, and flip.
- Every driver has a clearly defined head hitbox.
- If the driver's head collides with a dangerous surface or object, that driver loses the round.
- The opponent receives one point for the round.
- If both drivers lose simultaneously, replay the round.
- First player to win 5 rounds wins the match.

### Controls

Mobile:
- Left side of screen: Player 1 controls.
- Right side: Player 2 controls.
- Two directional buttons per player.

Desktop:
- Player 1: A/D.
- Player 2: Left/Right arrows.

Support simultaneous inputs.

### Physics Requirements

Implement:

- Predictable vehicle acceleration.
- Gradual braking and momentum.
- Gravity.
- Body rotation.
- Wheel-ground contact.
- Collision impulses.
- Head-specific collision detection.
- Stable terrain collision.

Avoid unstable flipping, perpetual vibration, penetration through walls, and impossible recoveries.

### AI

**Medium:** Basic movement and occasional poor decisions.

**Hard:** Predicts collisions, protects its own head, and attempts deliberate attacks.

**Impossible:** Strong maneuver planning and precise control without violating physical limitations.

### Audio

- Short engine acceleration.
- Tire skid.
- Vehicle collision.
- Metallic impact.
- Driver-hit impact.
- Round victory.

No continuous background soundtrack.

---

## GAME 02 — ARCHERY DUEL

Reference: PDF pages 4–10.

### Gameplay Concept

A competitive shooting game based on carefully timed inputs.

Players must lock horizontal and vertical aiming positions before shooting.

### Rules

Each shooting attempt has three steps:

1. First tap begins horizontal crosshair movement.
2. Second tap locks the horizontal position and begins vertical crosshair movement.
3. Third tap locks vertical positioning and fires.

The projectile travels toward the chosen position.

### Scoring

- Hit a large target: 1 point.
- Hit a small target: 2 points.
- Miss: 0 points.
- First player to 10 points wins.

### Important Details

- Target sizes must match their collision boundaries.
- Small targets should be meaningfully harder.
- Crosshair motion must be consistent and smooth.
- Rapid tapping must not accidentally skip states.
- Each attempt should reset cleanly.
- Targets should vary positions to maintain replayability.

### AI

Medium: Slow or imprecise timing.

Hard: Accurate target locking.

Impossible: Near-perfect timing with legal reaction behavior.

### Audio

- Aiming lock.
- Bowstring release.
- Arrow flight.
- Target impact.
- Successful scoring.

---

## GAME 03 — GRAVITY RUNNER

Reference: PDF pages 11–13.

### Gameplay Concept

Two runners move automatically through an endless side-scrolling obstacle course.

A tap reverses gravity, moving the character between floor and ceiling.

### Rules

- Characters move automatically.
- Players tap to reverse gravity.
- Avoid gaps in the floor and ceiling.
- Falling into a gap loses the round.
- Speed increases with survival duration.
- The last surviving player wins the round.
- First player to win 5 rounds wins.

If both fail in the same simulation step, replay the round.

### Course Generation

Procedurally generate valid floor/ceiling patterns.

Ensure every obstacle sequence has at least one physically possible survival route.

Do not create unavoidable deaths.

Use a shared random seed for both players so difficulty is comparable.

### AI

Medium: Reactive gravity switching.

Hard: Predictive obstacle avoidance.

Impossible: Strong path planning and precise gravity-switch timing.

### Audio

- Gravity reversal.
- Landing.
- Air movement.
- Collision.
- Failure and victory.

---

## GAME 04 — LIGHT FINGERS

Reference: PDF page 14.

### Gameplay Concept

A quick-reaction contest in which players compete to grab a diamond.

### Rules

- Both players wait for a random signal.
- A diamond becomes claimable.
- The first valid tap wins the round.
- Tapping before the signal is a false start.
- A false start awards the opponent one round victory.
- First player to win 5 rounds wins.

### Fairness

- Use the same activation event for both players.
- Handle simultaneous taps deterministically.
- Avoid predictable signal intervals.
- Make the signal clearly visible before accepting valid claims.
- Prevent multi-touch or repeated-event exploits.

### AI

Medium: Noticeable human-like reaction delay.

Hard: Faster reaction.

Impossible: Extremely quick but not instantaneous or preemptive.

### Audio

- Signal activation.
- Diamond collection.
- False-start buzzer.
- Round victory.

---

## GAME 05 — FRUIT DUEL

Reference: PDF page 15.

### Gameplay Concept

A fast-paced reaction game requiring recognition of fruit icons.

### Rules

- Display a target fruit at the start of each round.
- Show a sequence of fruit icons.
- Players must tap when the displayed fruit matches the target.
- Correct first response earns 1 point.
- Incorrect response awards 1 point to the opponent.
- First player to 10 points wins.

### Fruits

Include a collection of original vector fruit icons, such as:

- Apple.
- Orange.
- Watermelon.
- Banana.
- Pomegranate.
- Pineapple.
- Strawberry.

### Requirements

- Large, recognizable icons.
- Clear target indicator.
- Varied target and decoy sequence.
- Randomized timing.
- Proper simultaneous-tap handling.
- Penalties for incorrect or premature taps.

### AI

Medium: Delayed reactions and occasional mistakes.

Hard: High recognition accuracy.

Impossible: Very fast accurate responses within defined reaction limits.

### Audio

- Fruit appearance.
- Correct answer.
- Incorrect answer.
- Point earned.
- Victory.

---

## GAME 06 — HAPPY BIRDS

Reference: PDF page 16.

### Gameplay Concept

Two birds compete to survive an obstacle course by tapping to fly.

### Rules

- Each player controls one bird.
- Tapping applies an upward impulse.
- Gravity pulls birds downward.
- Avoid spikes and other dangerous obstacles.
- Collision ends that player's round.
- The player surviving longer wins the round.
- First to 3 round victories wins.

### Physics

Implement:

- Smooth flying motion.
- Consistent gravitational acceleration.
- Predictable upward impulse.
- Correct collision boundaries.
- Fair obstacle generation.
- Increasing difficulty.

### AI

Medium: Basic altitude correction.

Hard: Predictive obstacle avoidance.

Impossible: Accurate flight planning.

### Audio

- Wing flap.
- Air whoosh.
- Spike collision.
- Failure.
- Round victory.

---

# GAME 07 — MATH QUIZ

## One of the Most Important New Games

Reference: PDF page 17.

This game is intended to support fast-paced mathematics competitions between friends.

It must have two clearly separated categories:

1. **Basic Arithmetic**
2. **University Math Challenge**

The second category must contain clever questions suitable for BUET undergraduate students but still solvable entirely in the head.

Do not confuse advanced mathematics with lengthy calculations.

## 7.1 Core Gameplay Rules

Both players are shown the same mathematical question.

Every question has exactly **three multiple-choice options**.

Only one option is correct.

Scoring:

- First correct answer earns 1 point.
- An incorrect answer awards 1 point to the opponent.
- The question ends as soon as a valid scoring event occurs.
- First player to 10 points wins.

Make sure each question is resolved only once.

Prevent double scoring caused by rapid taps.

### Local Multiplayer Presentation

Split the screen into two clearly separated response areas.

Both players should be able to read the same question comfortably.

Each player must have three large answer buttons.

The layout can be mirrored or rotated where necessary so players sitting at opposite ends of a smartphone can answer comfortably.

Questions must remain legible on small screens.

### AI

Medium:
- Longer simulated reasoning time.
- Occasional incorrect answers.

Hard:
- Faster and more accurate.

Impossible:
- Very high answer accuracy and fast response time, but no responses before the question is displayed.

AI should not require external APIs.

For banked questions, use the validated correct answer plus calibrated response timing. Do not misrepresent this as a general-purpose symbolic reasoning engine.

---

## 7.2 CATEGORY A — BASIC ARITHMETIC

This is the casual category.

Topics:

- Addition.
- Subtraction.
- Multiplication.
- Division.
- Operator precedence.
- Simple fractions.
- Basic percentage calculations.

All questions should be solvable quickly.

### Example A1

Evaluate:

\[
12 \times 8
\]

A. \(86\)

B. \(96\)

C. \(108\)

**Correct answer: B**

### Example A2

Evaluate:

\[
48 \div 6 + 7
\]

A. \(15\)

B. \(13\)

C. \(14\)

**Correct answer: A**

### Example A3

Evaluate:

\[
15+6\times4
\]

A. \(84\)

B. \(39\)

C. \(36\)

**Correct answer: B**

Generate varied questions.

Avoid extremely large numbers and calculations requiring written working.

Validate generated questions programmatically.

---

## 7.3 CATEGORY B — UNIVERSITY MATH CHALLENGE

### Target Audience

Students comfortable with advanced HSC mathematics and introductory university-level mathematics, including BUET undergraduate students.

### Core Philosophy

**Conceptually tricky but mentally solvable.**

Every question should be answerable within approximately 10–30 seconds by a reasonably prepared student.

No notebook.

No rough paper.

No calculator.

No extensive symbolic manipulation.

Questions should reward:

- Recognition of mathematical identities.
- Familiarity with standard derivatives.
- Understanding of integration properties.
- Clever limits.
- Mathematical intuition.
- Simple conceptual reasoning.
- Recognition of patterns.

### Allowed Topics

#### Calculus

- Standard derivatives.
- Chain rule.
- Product and quotient rules.
- Simple definite integrals.
- Simple indefinite integrals.
- Symmetry of integrals.
- Standard limits.
- Basic exponential and logarithmic functions.
- Elementary trigonometric functions.
- Simple Taylor-series concepts.

#### Algebra

- Basic equations.
- Exponents.
- Logarithms.
- Mathematical identities.
- Simple sequences and series.

#### Matrices

- Basic \(2\times2\) matrices.
- Determinants.
- Basic matrix operations.
- Scalar multiplication of matrices.
- Simple properties of determinants.

#### Complex Numbers

- Powers of \(i\).
- Modulus.
- Basic algebraic identities.

#### Probability and Combinatorics

- Simple counting.
- Basic probability.
- Small factorial expressions.
- Elementary combinations.
- Intuitive probability tricks.

### Explicitly Prohibited Topics or Question Styles

Do not include:

- Eigenvalues.
- Eigenvectors.
- Diagonalization.
- Large matrices.
- Complicated differential equations.
- Long multivariable-calculus calculations.
- Difficult integration by parts.
- Complicated substitutions.
- Multi-page derivations.
- Decimal-heavy numerical calculations.
- Questions requiring a calculator.
- Questions requiring a notebook.
- Questions with excessively lengthy expressions.

Do not add questions simply because they contain advanced-looking symbols.

**Mental solvability is mandatory.**

---

## 7.4 UNIVERSITY MATH — EXAMPLE QUESTIONS

All examples below use LaTeX notation.

Store mathematical expressions as valid LaTeX strings in the question bank.

### Example 1 — Differentiation

Given

\[
f(x)=x^x,
\]

find

\[
f'(1).
\]

Options:

A. \(0\)

B. \(1\)

C. \(e\)

**Correct: B**

Reason:

\[
\frac{d}{dx}x^x=x^x(\ln x+1),
\]

so

\[
f'(1)=1.
\]

The player should recognize or mentally recall the logarithmic differentiation result.

### Example 2 — Definite Integration

Evaluate

\[
\int_0^\pi \sin x\,dx.
\]

Options:

A. \(0\)

B. \(1\)

C. \(2\)

**Correct: C**

Mental observation:

\[
[-\cos x]_0^\pi=2.
\]

### Example 3 — Standard Limit

Evaluate

\[
\lim_{x\to0}\frac{\sin 3x}{x}.
\]

Options:

A. \(1\)

B. \(3\)

C. \(0\)

**Correct: B**

Use

\[
\lim_{u\to0}\frac{\sin u}{u}=1.
\]

### Example 4 — Matrix Determinant

If \(A\) is a \(2\times2\) matrix and

\[
\det(A)=3,
\]

find

\[
\det(2A).
\]

Options:

A. \(6\)

B. \(12\)

C. \(9\)

**Correct: B**

Because

\[
\det(kA)=k^n\det(A)
\]

for an \(n\times n\) matrix, so

\[
\det(2A)=2^2\cdot3=12.
\]

### Example 5 — Complex Numbers

Evaluate

\[
i^{2026}.
\]

Options:

A. \(1\)

B. \(-1\)

C. \(i\)

**Correct: B**

Since powers of \(i\) repeat every four.

### Example 6 — Odd Function Trick

Evaluate

\[
\int_{-1}^{1}x^5\cos x\,dx.
\]

Options:

A. \(0\)

B. \(1\)

C. \(-1\)

**Correct: A**

The integrand is odd, so the integral vanishes over symmetric limits.

This is an excellent example of a tricky but mentally solvable question.

### Example 7 — Exponential Limit

Evaluate

\[
\lim_{x\to0}\frac{e^{2x}-1}{x}.
\]

Options:

A. \(1\)

B. \(2\)

C. \(e^2\)

**Correct: B**

### Example 8 — Trigonometric Derivative

Evaluate

\[
\left.\frac{d}{dx}\sin^2x\right|_{x=\pi/4}.
\]

Options:

A. \(0\)

B. \(1\)

C. \(2\)

**Correct: B**

Use

\[
\frac{d}{dx}\sin^2x=\sin2x.
\]

### Example 9 — Infinite Series

Evaluate

\[
\sum_{n=1}^{\infty}\frac{1}{2^n}.
\]

Options:

A. \(\frac12\)

B. \(1\)

C. \(2\)

**Correct: B**

### Example 10 — Probability

A fair coin is tossed twice.

What is the probability of getting at least one head?

A. \(\frac12\)

B. \(\frac34\)

C. \(\frac14\)

**Correct: B**

Use the complement:

\[
P(\text{at least one head})
=1-P(\text{no heads})
=1-\frac14
=\frac34.
\]

These examples establish the desired question style.

Generate additional problems of comparable or moderately greater conceptual difficulty.

---

## 7.5 QUESTION BANK REQUIREMENTS

Create at least **100 rigorously verified University Math Challenge questions**.

Each question must contain:

- Unique ID.
- Topic.
- Difficulty.
- LaTeX question statement.
- Exactly three LaTeX-compatible answer options.
- Correct answer index.
- Concise mathematical explanation.
- Estimated mental-solving time.

Suggested question-bank format:

```ts
type MathQuestion = {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionLatex: string;
  optionsLatex: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanationLatex: string;
  estimatedSeconds: number;
};
```

Do not embed mathematical expressions in raw HTML.

Use a math renderer such as KaTeX.

Ensure LaTeX backslashes are preserved correctly in TypeScript strings, preferably through `String.raw` template literals or properly escaped strings.

Do not create malformed LaTeX.

### Internal Difficulty Categories

**Easy — 5–10 seconds**

Immediate recognition of a standard identity or formula.

**Medium — 10–20 seconds**

One or two mental steps.

**Hard — 20–30 seconds**

A clever property, conceptual trap, or deeper observation.

Even Hard questions must require no written calculation.

### Validation

Before adding a question to the production bank, verify:

1. The mathematical expression is valid.
2. The question has exactly one correct answer.
3. The answer key is correct.
4. Distractors are mathematically distinct from the correct answer and one another.
5. No options are equivalent under algebraic simplification.
6. Any required assumptions or domains are specified.
7. The question is realistically solvable mentally.
8. The rendered expression fits on a mobile display.

Where possible, use development-time symbolic or numerical checks.

For questions that cannot be reliably verified automatically, mark them for manual mathematical review.

Do not falsely claim independent verification if the questions were only generated and never checked.

### Question Randomization

- Randomize question order.
- Avoid immediate repetition.
- Balance topics.
- Randomize answer positions.
- Avoid predictable correct-option patterns.
- Preserve mathematically valid answer mappings after shuffling.

### Math Rendering

Use a lightweight, lazy-loaded LaTeX renderer.

Support:

\[
\int_a^b f(x)\,dx
\]

\[
\lim_{x\to a}f(x)
\]

\[
\frac{dy}{dx}
\]

\[
\sum_{k=1}^{n}k
\]

\[
\begin{pmatrix}
a&b\\
c&d
\end{pmatrix}
\]

Render formulas sharply at different screen resolutions.

Do not use screenshots of mathematical expressions.

The quiz must be playable in both browsers and Capacitor Android.

---

## GAME 08 — DOTS AND BOXES

Reference: PDF page 18.

### Rules

- Display a rectangular grid of dots.
- Players take turns connecting adjacent dots.
- Lines may be horizontal or vertical.
- Completing a box claims it.
- The box receives the current player's color.
- Completing a box grants another turn.
- One line may complete two boxes.
- When all boxes are completed, the player controlling the most boxes wins.
- Equal totals produce a draw.

Start with a \(4\times4\) grid of boxes.

### AI

Medium:
- Simple placement heuristics.

Hard:
- Chain recognition and defensive strategy.

Impossible:
- Strong endgame search and strategic sacrifices.

### Sound

- Line placement.
- Square completion.
- Multiple-square capture.
- Final victory.

---

## GAME 09 — LUMBERJACK

Reference: PDF page 19.

### Gameplay

A fast-paced game where players chop a tree while avoiding falling branches.

### Rules

- The tree consists of vertically stacked segments.
- Some segments have branches extending left or right.
- Players tap the left or right side to chop.
- Every valid chop removes one segment and increases score.
- Branches move downward with each chop.
- A branch hitting the character ends the attempt.
- Each player gets three competitive rounds.
- Highest cumulative chop count wins.
- Ties trigger sudden death.

### Requirements

- Responsive controls.
- Increasing speed.
- Fair branch generation.
- No impossible unavoidable patterns.
- Accurate collision detection.

### AI

Medium: Occasionally chooses unsafe positions.

Hard: Strong prediction.

Impossible: Near-perfect chopping decisions.

### Sound

- Axe swing.
- Wood impact.
- Timber movement.
- Branch collision.
- Failure.

---

## GAME 10 — HAMMER HIT

Reference: PDF page 20.

### Gameplay

A needle oscillates across a timing gauge.

Players must tap when the needle approaches the ideal strike position.

### Rules

- Each player gets exactly three attempts.
- Tapping locks the timing needle.
- Accuracy determines strike power and score.
- The closer the needle is to the ideal position, the higher the score.
- The final result uses the **arithmetic mean of all three attempts**.
- Highest average wins.

### Critical Mathematical Requirement

For attempt scores \(S_1,S_2,S_3\),

\[
\boxed{\bar S=\frac{S_1+S_2+S_3}{3}}
\]

Use this formula.

**Do not use the highest attempt.**

### Example

Player 1:

\[
S_1=80,\quad S_2=60,\quad S_3=100
\]

\[
\bar S_1=\frac{80+60+100}{3}=80
\]

Player 2:

\[
S_1=75,\quad S_2=90,\quad S_3=90
\]

\[
\bar S_2=\frac{75+90+90}{3}=85
\]

Player 2 wins.

### Numerical Accuracy

Use exact integer totals internally when scores are integers.

Do not round averages before comparing winners.

Only round for display.

Equal averages produce a draw in Quick Play.

### AI

Medium: Imprecise timing.

Hard: Good accuracy.

Impossible: Near-perfect legal timing.

### Audio

- Hammer swing.
- Metal impact.
- Heavy strike.
- Perfect-hit effect.
- Score reveal.

Vary the impact sound according to strike strength.

---

## GAME 11 — FLAPPY JUMP

Reference: PDF page 21.

### Concept

A competitive basketball-inspired jumping game.

### Rules

- Tap to jump.
- The character moves according to gravity.
- Jump timing creates opportunities to shoot.
- Shooting occurs automatically at the valid shooting moment or position.
- Successfully scoring a basket gives one point.
- First to 10 points wins.

### Physics

Implement:

- Smooth gravity.
- Predictable jump height.
- Proper ball release.
- Ball/rim collisions.
- Reliable basket detection.

Count a successful basket only when the ball legitimately passes through the hoop.

Avoid accidental double scoring.

### AI

Medium: Basic jump timing.

Hard: Better shot prediction.

Impossible: Highly accurate legal timing.

### Audio

- Jump.
- Ball release.
- Rim impact.
- Net swish.
- Basket scored.

---

## GAME 12 — CHICKEN JUMP

Reference: PDF page 22.

### Concept

A block-stacking game involving timing and landing accuracy.

### Rules

- A chicken jumps upward.
- A block moves horizontally beneath it.
- Players tap to stop the moving block.
- The chicken must land on the block.
- A successful landing scores one point.
- The stack grows with successful attempts.
- Missing the block fails the attempt.
- First to 10 successful stacks wins.

### Physics and Fairness

- Determine collisions geometrically.
- Allow small realistic alignment tolerance.
- Gradually increase difficulty.
- Avoid impossible block speeds.
- Prevent overlapping or invalid block states.

### AI

Medium: Moderate timing errors.

Hard: Accurate alignment.

Impossible: Very precise placement.

### Sound

- Jump.
- Block sliding.
- Block lock.
- Landing.
- Failure.
- Victory.

---

## GAME 13 — SPIKE ATTACKS

Reference: PDF page 23.

### Concept

A survival game where players hide behind stones to avoid incoming spikes.

### Rules

- Spikes arrive in waves.
- Players can move around a constrained arena.
- Stones provide protection.
- Direct spike hits cause round loss.
- Last survivor wins the round.
- First player to win 5 rounds wins.

### Obstacle Requirements

- Stone collision must be reliable.
- Spikes should collide with protective obstacles before reaching players.
- Show warning cues for dangerous attacks.
- Generate fair survival patterns.
- Avoid unavoidable spike configurations.

### AI

Medium: Basic cover selection.

Hard: Predictive safe-position selection.

Impossible: Advanced threat avoidance.

### Audio

- Incoming spike warning.
- Projectile whoosh.
- Stone impact.
- Spike collision.
- Survival victory.

---

# 5. GLOBAL AI SYSTEM

Every new game must support the existing Pocket Rivals AI difficulty selection.

### Medium

- Relaxed pace.
- Reasonable mistakes.
- Suitable for casual play.

### Hard

- Intelligent and challenging.
- Better tactical decisions.
- Faster response times.
- Strong predictive behavior.

### Impossible

- Strongest practical strategy.
- Highly accurate input.
- Optimized search where suitable.
- No illegal movement or cheating.

The name "Impossible" describes intended difficulty, not a guarantee of unbeatable play.

### Important

Do not use the same simplistic AI algorithm for every game.

Use different approaches:

- Physics prediction for vehicle, ball, and projectile games.
- Timing models for reflex games.
- Search algorithms for strategy games.
- Obstacle lookahead for survival games.
- Validated answer selection with simulated response delays for Math Quiz.

Keep AI computation bounded.

Prevent AI logic from freezing animations.

---

# 6. GLOBAL SOUND EFFECT SYSTEM

## Important: No Music

I do not want any background soundtrack.

Do not add:

- Background music.
- Menu music.
- Continuous ambient music.
- Unnecessary musical loops.

I only want short, relevant sound effects.

### Sound Manager

Use or extend the existing Pocket Rivals SoundManager.

It must support:

- Global mute/unmute.
- Persisted volume settings.
- Event-triggered sound playback.
- Lazy-loaded effects.
- Simultaneous sound limits.
- Safe cleanup.
- Browser audio restrictions.
- Capacitor compatibility.
- Low latency.

### Global Sounds

- Button click.
- Menu opening.
- Game start.
- Countdown.
- Pause.
- Resume.
- Point scored.
- Victory.
- Defeat.
- Draw.

### Physics Sounds

- Metal collision.
- Soft bounce.
- Hard bounce.
- Wall impact.
- Sliding.
- Falling.
- Wood collision.
- Projectile impact.

### Audio Quality

Use brief, original or properly licensed effects.

Prefer lightweight audio assets or synthesized sounds.

Avoid overly loud and repetitive effects.

Small collisions should produce subtle sounds.

Heavy collisions should produce stronger effects.

Prevent repetitive collision events from triggering dozens of overlapping sounds.

### Existing Pocket Rivals Games

After implementing the 13 new games, audit existing games.

Add sound feedback to games already present, including:

- Pong.
- Air Hockey.
- Classic Tic-Tac-Toe.
- Ultimate Tic-Tac-Toe.
- Connect Four.
- Golf.
- Other existing modules where appropriate.

Do not rewrite their gameplay logic merely to add sounds.

---

# 7. GAME MODE SELECTION

Each new game should integrate with the existing mode-selection system.

Available modes:

### Local Two Player

Two friends share the same physical device.

For turn-based games, share one board.

For real-time games, use separated or opposite-side controls.

Support simultaneous multi-touch where required.

### One Player vs AI

Select:

- Medium.
- Hard.
- Impossible.

The game should then begin without unnecessary additional screens.

### Tournament

Games participate through their existing metadata and result contracts.

Do not hardcode individual games into the tournament manager.

---

# 8. VISUAL DESIGN

Every game must match Pocket Rivals' existing aesthetic.

Use:

- Pastel backgrounds.
- Orange and blue colors.
- Rounded rectangular buttons.
- Bold dark outlines.
- Clean vector drawings.
- Smooth animations.
- Consistent fonts.
- Compact score panels.
- Clear win/loss overlays.

Create original thumbnails for all games.

Examples:

- Car Duel: two small cars colliding.
- Archery: bow and moving target.
- Gravity Runner: two characters on opposite surfaces.
- Light Fingers: central glowing diamond.
- Fruit Duel: contrasting fruit symbols.
- Happy Birds: two small birds near obstacles.
- Math Quiz: mathematical symbols and answer cards.
- Dots and Boxes: partially completed grid.
- Lumberjack: tree and axe.
- Hammer Hit: hammer and impact gauge.
- Flappy Jump: basketball hoop and jumping character.
- Chicken Jump: chicken and stacked blocks.
- Spike Attacks: character protected behind stone.

Use original vector assets.

Avoid unnecessarily large images.

Animations should feel playful but immediate.

---

# 9. MODULAR GAME ARCHITECTURE

I want the application to eventually support 50+ games.

The addition of these 13 games must not increase startup time unnecessarily.

Each game should remain independently maintainable.

Suggested conceptual structure:

```text
src/
  core/
    GameRegistry.ts
    GameLoader.ts
    GameManager.ts
    TournamentManager.ts
    ScoreManager.ts
    SoundManager.ts

  shared/
    contracts/
    input/
    audio/
    physics/
    components/
    theme/
    utilities/

  games/
    car-duel/
    archery-duel/
    gravity-runner/
    light-fingers/
    fruit-duel/
    happy-birds/

    math-quiz/
      index.ts
      MathQuizGame.ts
      MathQuizAI.ts
      questions/
        arithmetic/
        university/
      validation/

    dots-and-boxes/
    lumberjack/
    hammer-hit/
    flappy-jump/
    chicken-jump/
    spike-attacks/

  tournament/
  scenes/
  assets/
```

Use the existing architecture when it already satisfies these requirements.

### Module Isolation

Each game owns:

- Its rules.
- Its AI.
- Its rendering.
- Its input handlers.
- Its game-specific assets.
- Its state.
- Its lifecycle.

Core systems should not contain game-specific rules.

Adding another game in the future should require creating a compatible folder and rebuilding the app.

### Resource Management

When a game exits:

- Remove event listeners.
- Stop game-specific timers.
- Stop audio loops if any.
- Release unnecessary resources.
- Dispose of physics objects.
- Cancel AI tasks.
- Prevent inactive scenes from continuing updates.

### Lazy Loading

Use dynamic imports or the existing automatic game-discovery mechanism.

Only load a game when needed.

Do not eagerly initialize all 13 games.

Main-menu thumbnails and metadata may be loaded separately.

---

# 10. CROSS-PLATFORM COMPATIBILITY

The application must use one common codebase for:

- Desktop web browsers.
- Mobile web browsers.
- Vercel.
- Capacitor Android.

### Input

Support:

- Mouse.
- Keyboard.
- Touch.
- Multi-touch.

Ensure proper coordinate transformation under different screen sizes.

Do not let CSS scaling or camera zoom break input accuracy.

### Mobile

- Prevent page scrolling during gameplay.
- Prevent accidental zoom.
- Respect safe-area insets.
- Keep controls large enough.
- Ensure smooth simultaneous touches.
- Support device orientation requirements.

### Desktop

- Proper keyboard input.
- Mouse support.
- Responsive game canvas.
- Clear controls.

### Performance

Target smooth 60 FPS on suitable devices.

Use stable delta-time or fixed-step simulation where appropriate.

Keep expensive AI computations bounded.

Avoid duplicate render loops.

---

# 11. GAME-BY-GAME IMPLEMENTATION PROCESS

Complete each game before moving forward.

For each game:

1. Inspect the rule specification.
2. Write game logic.
3. Implement gameplay and input.
4. Implement score calculation.
5. Implement victory and draw conditions.
6. Implement AI difficulties.
7. Add sound effects.
8. Implement How to Play.
9. Create its original thumbnail.
10. Integrate with GameRegistry.
11. Integrate with TournamentManager.
12. Test desktop controls.
13. Test responsive mobile controls.
14. Verify cleanup and restart.
15. Run the production build.
16. Fix any discovered regressions.
17. Update progress documentation.

Do not consider a game complete if it only displays an interface but cannot be played properly.

---

# 12. RECOMMENDED IMPLEMENTATION ORDER

### Phase 1 — Foundation

- Inspect architecture.
- Extend SoundManager.
- Prepare common interfaces.
- Validate the tournament contract.
- Confirm lazy loading.

### Phase 2 — Simple Games

1. Dots and Boxes.
2. Hammer Hit.
3. Light Fingers.

### Phase 3 — Quiz and Reflex

4. Fruit Duel.
5. Math Quiz — both categories, LaTeX rendering, validated question banks.
6. Lumberjack.
7. Chicken Jump.

### Phase 4 — Precision and Survival

8. Archery Duel.
9. Gravity Runner.
10. Happy Birds.
11. Spike Attacks.

### Phase 5 — More Complex Physics

12. Flappy Jump.
13. Car Duel.

### Phase 6 — Existing Game Audio

Audit existing games and introduce relevant effects.

### Phase 7 — Final Integration

- Verify all 13 mini-games.
- Check AI difficulties.
- Check tournament results.
- Check sound effects.
- Check responsive layouts.
- Check resource cleanup.
- Verify existing games remain functional.
- Run production build.
- Perform measured optimization.

---

# 13. TESTING REQUIREMENTS

Introduce targeted automated tests wherever feasible.

### Global

- Correct registration.
- Correct game launch.
- Correct resource cleanup.
- Correct pause/resume.
- Correct input handling.
- Correct scoring.
- Correct tournament results.
- Sound toggle functionality.
- Production build.

### Math Quiz — Special Testing

Math Quiz requires unusually rigorous validation.

Verify:

- Every question has three options.
- Exactly one option is correct.
- Every LaTeX expression renders.
- Every answer key is correct.
- No equivalent distractors exist.
- No question is mathematically ambiguous.
- No question requires a calculator.
- No question exceeds reasonable mental calculation complexity.
- Question randomization preserves answer mapping.
- Rapid tapping cannot score twice.
- Incorrect answers award the opponent correctly.

Use independent mathematical verification wherever possible.

### Hammer Hit — Special Testing

Verify:

\[
\bar S=\frac{S_1+S_2+S_3}{3}
\]

Test:

- Three valid attempts.
- Correct mean.
- Correct winner.
- Correct draw handling.
- No premature result announcement.

### Physics Games

Test:

- High-speed collisions.
- Frame-rate consistency.
- Corner cases.
- Object overlap.
- Collision recovery.
- Restarting mid-motion.
- Scene exit during physics updates.

### Real-Time Multiplayer

Test actual simultaneous controls.

Sequential automated clicks alone are not sufficient to verify multi-touch behavior.

### AI

Check:

- No illegal inputs.
- No impossible movements.
- Difficulty distinctions.
- Acceptable decision time.
- No frozen main thread.
- Correct game-over behavior.

---

# 14. PERFORMANCE AND OPTIMIZATION

Performance should be monitored throughout implementation.

### Architectural Requirements

- Lazy loading.
- Independent modules.
- Shared reusable systems.
- Proper disposal.
- Efficient physics.
- Bounded AI.
- Minimal asset duplication.
- Efficient audio management.

### Measurements

Where tooling permits, measure:

- Main-menu load time.
- FPS.
- Frame time.
- Memory usage.
- AI computation time.
- Initial JavaScript bundle size.
- Lazy-loaded chunk sizes.

Do not perform speculative micro-optimization unless profiling identifies a meaningful issue.

Prioritize working gameplay.

Conduct a deeper optimization review after implementing all 13 games.

Ensure any improvements preserve gameplay behavior.

---

# 15. DOCUMENTATION AND CONTEXT MANAGEMENT

This is a large implementation project.

Maintain a concise progress document in the repository.

Track:

- Games completed.
- Games pending.
- AI implementations finished.
- Tests run.
- Known issues.
- Architectural changes.
- Outstanding verification.

Update AGENTS.md where necessary.

Keep each game's implementation self-contained so future Codex sessions do not need to load unrelated game files.

Avoid giant files combining multiple game implementations.

Document the process of adding future mini-games.

The project must remain easy to extend.

---

# 16. COMPLETION CRITERIA

The project is complete when:

1. All 13 games are present.
2. Each game is genuinely playable.
3. Every game supports local two-player gameplay.
4. Every game supports AI gameplay.
5. All three AI difficulties are implemented.
6. Every game has correct scoring.
7. Win and draw detection work.
8. Every game integrates with tournament mode.
9. Every game has appropriate sound effects.
10. Existing games receive basic sound feedback.
11. No background music is added.
12. Math Quiz offers Basic Arithmetic and University Math Challenge.
13. University Math Challenge has at least 100 verified questions.
14. Advanced questions are mentally solvable.
15. Mathematical expressions render correctly using LaTeX.
16. No eigenvalue/eigenvector questions appear.
17. Hammer Hit uses the average of three attempts.
18. All 13 game thumbnails fit Pocket Rivals' visual identity.
19. Navigation remains smooth.
20. Desktop controls work.
21. Mobile touch interactions are implemented correctly.
22. Games load independently.
23. Resources are released on exit.
24. Existing games remain unaffected.
25. The production web build succeeds.

Do not claim a test has passed without actually running it.

Do not claim physical Android compatibility has been verified unless tested on an appropriate device.

---

# 17. FINAL EXECUTION INSTRUCTIONS

**Do not stop after generating an implementation plan.**

Start working in the existing local Pocket Rivals repository.

Implement the games sequentially according to the specified phases.

After each game:

- Run tests.
- Fix errors.
- Verify the build.
- Update progress.
- Proceed to the next game.

Preserve the existing visual theme and modular architecture.

Do not automatically push to GitHub.

Do not automatically deploy to Vercel.

Do not introduce a backend, advertisements, online multiplayer networking, or paid external AI services.

Do not use copyrighted sound or graphics without appropriate permission.

### Final Report

When finished, report:

1. Games implemented.
2. Gameplay features completed.
3. AI algorithms used.
4. Sound effects added.
5. Mathematics question-bank validation results.
6. Testing performed.
7. Performance measurements.
8. Existing regressions discovered and corrected.
9. Remaining limitations.
10. Web and Android build readiness.

### FINAL PRIORITY

**RUNNABILITY > CORRECTNESS > RESPONSIVENESS > GAME FEEL > VISUAL POLISH > MICRO-OPTIMIZATION**

I want a serious, scalable, polished game collection.

A player should be able to open Pocket Rivals, choose any of the 13 new games, understand the rules immediately, and enjoy a complete competitive match.

Build reliable games rather than incomplete demonstrations.

Maintain professional code quality and fully functional gameplay.

Continue through all specified implementation stages, preserving progress and clearly reporting any genuine environmental limitations.