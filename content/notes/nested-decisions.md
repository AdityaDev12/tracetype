# Notes: nested decisions and the one-line if

Source chapter read: Learning Python, "if Tests and Syntax Rules" (nested
blocks, the if/else ternary expression). My own summary, for py-13.

## Key ideas
- An if can sit inside another if's block. The inner one is only reached when
  the outer test is true. Each level is indented 4 more spaces.
- Deep nesting gets hard to read. Often `and` or elif flattens it.
- The one-line if (conditional expression): `value_if_true if test else
  value_if_false`. It gives a value, so it can go on the right of = or inside
  print. Only the chosen side is worked out.
- Use it for short choices of a value; use a full if for actions.

## Order to teach
1. An if inside an if. 2. Flattening with and/elif. 3. The one-line if.

## Common beginner mistakes
- Wrong indentation puts a line in the wrong block.
- The one-line if without else (SyntaxError).
- Writing the one-line if in the wrong order (`if test x else y`).

## Visuals
branch ladder (inner and outer), expr for the one-line if, timeline.
