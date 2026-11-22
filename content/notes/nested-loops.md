# Notes: loops inside loops

Source chapter read: Learning Python, "while and for Loops" (nested loop
examples). My own summary, for py-19.

## Key ideas
- A loop inside another loop: the inner loop runs completely for every round
  of the outer loop. Rounds multiply: 3 outer times 4 inner is 12 inner rounds.
- Think rows and columns: outer loop = rows, inner loop = columns.
- Printing a row: build a string in the inner loop, print it after the inner
  loop (still inside the outer one).
- break only leaves the inner loop.
- The inner loop can use the outer loop's variable (triangles).

## Order to teach
1. Pairs of numbers. 2. A times table. 3. Building rows of a pattern. 4. A
triangle where the inner range depends on the outer variable.

## Common beginner mistakes
- Wrong indentation puts a print in the wrong loop.
- Reusing the same variable name for both loops.
- Expecting break to leave both loops.

## Visuals
grid (outer rounds as rows, inner as columns), loop panel, knobs on the sizes.
