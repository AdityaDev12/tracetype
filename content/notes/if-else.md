# Notes: if and else

Source chapter read: Learning Python, "if Tests and Syntax Rules" (if
statements, block delimiters and indentation rules). My own summary, for py-09.

## Key ideas
- `if test:` runs the indented block under it only when the test is true.
- `else:` runs its block when the test is false. Exactly one of the two runs.
- The colon ends the header line. The block is the lines indented under it,
  4 spaces by convention. The block ends at the first line indented less.
- Lines after the whole if/else (back at the left edge) always run.
- Python decides blocks only by indentation, so it must be consistent.
- An if without else is fine: when false, nothing extra happens.

## Order to teach
1. if alone. 2. else. 3. The block can have several lines. 4. Code after the if always runs.

## Common beginner mistakes
- Missing colon (SyntaxError: expected ':').
- Forgetting to indent the block (IndentationError: expected an indented block).
- Indenting a line that should run always, so it only runs when the test is true.
- Using = in the test.
- else with its own test (else takes no test).

## Visuals
branch ladder (which way), knobs to move the path, timeline.
