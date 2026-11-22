# Notes: break, continue, pass and loop else

Source chapter read: Learning Python, "while and for Loops" (break, continue,
pass, and the loop else). My own summary, for py-17.

## Key ideas
- `break` leaves the loop at once. The rest of the block and the remaining
  rounds are skipped.
- `continue` skips the rest of this round and jumps to the next round.
- They act on the innermost loop they are in, and usually sit inside an if.
- `while True:` with a break inside is a common pattern for "repeat until".
- `pass` does nothing. It fills a spot where Python needs a statement.
- A loop can have an `else:`. It runs when the loop ends normally, but not when
  it was left with break. Handy for searches: break when found, else = not found.
- Use continue sparingly; an if around the code is often clearer.

## Order to teach
1. break in a search. 2. continue to skip. 3. while True with break. 4. pass.
5. loop else.

## Common beginner mistakes
- break outside a loop (SyntaxError).
- Thinking loop else runs when the loop body did not run any "if".
- continue in a while loop before the counter update (infinite loop).

## Visuals
loop panel with break and continue marks, branch, trace table.
