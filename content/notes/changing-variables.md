# Notes: changing variables

Source chapters read: Learning Python, "Assignments, Expressions, and Prints"
(assignment forms, augmented assignment, variable name rules) and "The Dynamic
Typing Interlude". My own summary, for py-04.

## Key ideas

- `=` works right side first: Python computes the value on the right using the
  current values, then points the name on the left at the result.
- So `score = score + 5` is fine: read the old score, add 5, store the new one.
  The name must already exist, or it is a NameError.
- Augmented assignment is shorthand: `x += 3` means `x = x + 3`. Same for
  `-=`, `*=`, `/=`, `//=`, `%=`, `**=`. With text, `+=` adds text to the end.
- There is no `x++` in Python.
- Swapping two values needs care: `a = b` then `b = a` loses a's old value.
  Use a temporary name (the tuple swap `a, b = b, a` comes later).
- Name rules: start with a letter or `_`, then letters, digits, `_`. No spaces
  or dashes. Case matters. Reserved words such as `class`, `if`, `for`, `True`
  cannot be names. Convention: lowercase with underscores, like `total_price`.
- Names do not have types, values do. A name can point at an int and later at
  a str. Possible but usually confusing.

## Order to teach

1. Reassigning (recap of lesson 1).
2. Right side first: `x = x + 1`.
3. Shorthand `+=` and friends.
4. Swapping with a temporary name.
5. Naming rules and conventions.

## Common beginner mistakes

- Reading `x = x + 1` as a maths equation that cannot be true.
- Using `+=` on a name that was never made (NameError).
- The swap that loses a value.
- Names with spaces, dashes or a leading digit (SyntaxError).
- Using a reserved word as a name.

## Visuals

history (value trail per name), memory with "was X", timeline, expr.
