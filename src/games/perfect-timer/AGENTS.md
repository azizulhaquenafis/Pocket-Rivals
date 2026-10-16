# Perfect Timer

Preserve Antigravity’s original layout/renderer. Rules own integer precision, submissions, idempotent resolution and five-round/sudden-death progression; reject nonfinite input. AI is seeded per match and stays inside this folder. Controllers own scene objects; host input subscriptions are automatically removed. Pause/terminal guards must prevent actions after completion. Active matches restart after process closure.

TimerClock is foreground monotonic time; both AI deadlines and human events use its elapsed milliseconds. Never use raw performance.now minus an unadjusted start time. Impossible targets exact visible durations; no fabricated minimum error.

Keep the target duration prominent, the round counter small, and the action buttons concise. This is simultaneous play: do not rotate the shared timer on individual stops.

Timing uses a quiet clockTick once per foreground half-second and clockStop for human/AI stops; countdown/start/reveal keep their existing feedback. Suppress catch-up sound bursts by comparing the current tick index once per update. All effects honor shared mute/volume and pause.
