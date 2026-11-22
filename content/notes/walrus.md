# Notes: the walrus operator := (beyond the book)

Source: the Python language reference on assignment expressions (added in
Python 3.8, after Learning Python). My own summary, for py-18.

## Key ideas
- `name := value` stores a value and also gives it back, inside a bigger
  expression. A normal `=` cannot be used inside an expression.
- Main use: a while loop that reads and tests in one line:
  `while (answer := input("? ")) != "quit":`. The brackets are needed because
  := has a very low priority.
- It replaces the pattern: read once before the loop, then read again at the end
  of the block (or while True with break).
- `x := 5` on its own line is a SyntaxError; plain `=` is for that.
- Use it when it removes a repeated line; otherwise a plain = is clearer.

## Order to teach
1. The repeated-input loop without walrus. 2. The same with :=. 3. Using the
stored value inside the loop. 4. When not to use it.

## Common beginner mistakes
- Forgetting the brackets: `while answer := input() != "q"` stores a bool.
- Using := as a statement.

## Visuals
expr stepper (the value is stored mid-expression), stdin tape, loop panel.
