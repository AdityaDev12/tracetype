# Notes: running totals and counters

Source chapter read: Learning Python, "while and for Loops" (basic for usage:
sum and product loops, loop coding techniques). My own summary, for py-16.

## Key ideas
- Accumulator pattern: make a variable before the loop with a starting value,
  update it inside the loop, use it after the loop.
- Sum: start at 0, `total += x`. Product: start at 1. Count: start at 0,
  `count += 1` when something is true.
- Biggest so far: start with the first value (or a very small one), and replace
  it when a bigger one comes along.
- Average: total divided by count, after the loop.
- The start value must be set before the loop, not inside it.

## Order to teach
1. Sum. 2. Count with a condition. 3. Product (start at 1). 4. Biggest so far.
5. Average.

## Common beginner mistakes
- Setting total = 0 inside the loop (it resets every round).
- Starting a product at 0.
- Printing inside the loop instead of after it.
- Dividing by a count of 0.

## Visuals
trace table (one row per round), history, loop panel.
