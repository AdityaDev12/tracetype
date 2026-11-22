# Notes: for loops and range()

Source chapter read: Learning Python, "while and for Loops" (for loops,
counter loops with range). My own summary, for py-15.

## Key ideas
- `for name in something:` gives name each item in turn and runs the block once
  per item. No counter to manage, no infinite loop.
- `range(stop)` gives 0, 1, ... stop-1. The stop number itself is never included.
- `range(start, stop)` starts somewhere else. `range(start, stop, step)` jumps
  by step; a negative step counts down.
- range(n) gives exactly n numbers: the easy way to repeat something n times.
- After the loop, the loop variable keeps its last value.
- range only takes whole numbers.

## Order to teach
1. range(5) and the missing 5. 2. Repeat n times. 3. start and stop. 4. step,
counting down. 5. for vs while.

## Common beginner mistakes
- Expecting range(5) to include 5, or to start at 1.
- range(1, 10, -1) gives nothing (step goes the wrong way).
- `for i in 5:` (TypeError, needs range(5)).
- Floats in range.

## Visuals
loop panel with the loop variable per round, cells for the range numbers, knobs on start/stop/step.
