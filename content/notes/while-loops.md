# Notes: while loops

Source chapter read: Learning Python, "while and for Loops" (while loops,
general format, examples). My own summary, for py-14.

## Key ideas
- `while test:` repeats its indented block as long as the test is True. The
  test is checked before every round, including the first.
- If the test is False at the start, the block never runs.
- Something inside the loop must change so the test eventually becomes False,
  usually a counter (`n += 1`). Otherwise it is an infinite loop. Here the time
  limit stops it; on a real computer you press Ctrl-C.
- Counter pattern: start before the loop, test at the top, update at the end of
  the block.
- A while is the right loop when you do not know how many rounds you need
  (keep asking until the answer is valid).

## Order to teach
1. A counting loop. 2. The test checked each round (and a final False). 3. A
loop that never runs. 4. Infinite loops. 5. Repeating until an answer.

## Common beginner mistakes
- Forgetting to change the counter (infinite loop).
- Off by one: `< 5` vs `<= 5`.
- Updating the counter before using it, so the first value is skipped.
- Missing colon or indentation.

## Visuals
loop panel (round counter, test True/False each round), trace table, knobs.
