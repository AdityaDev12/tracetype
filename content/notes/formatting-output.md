# Notes: formatting output

Source chapters read: Learning Python, "String Fundamentals" (string formatting
method calls, the format spec, the format built-in) and "Assignments,
Expressions, and Prints" (print operations: sep and end, already met). My own
summary, for py-25. The book teaches % and .format(); the lesson teaches
f-strings, which use the same spec after the colon.

## Key ideas
- An f-string is a string with an f in front. Each `{...}` hole runs the code
  inside and puts the result's text there.
- After a colon comes the format spec: how to show the value.
- `:.2f` shows a float with exactly 2 digits after the point (rounded). Works on ints
  too.
- A number alone is a width: `{name:10}` fills to 10 characters. Text lines up on
  the left by default, numbers on the right.
- `<`, `>`, `^` choose left, right, centre: `{name:>10}`. Width and decimals combine:
  `{price:>8.2f}`.
- `,` adds thousands separators: `{big:,}`.
- `{total=}` prints `total=` and the value, handy for checking your code.
- `print(a, b, sep="-")` changes what goes between the values, `end=""` changes
  what goes at the end (no new line).
- Formatting never changes the number; it only makes text.

## Order to teach
1. f-string holes with names and maths. 2. `:.2f`. 3. Width and alignment.
4. Width plus decimals for columns. 5. `sep` and `end`. 6. `{x=}`.

## Common beginner mistakes
- Forgetting the f: the braces are printed as they are.
- `{price:2f}` (missing dot) is a width of 2, not 2 decimals.
- `:.2f` on a string: ValueError (Unknown format code 'f' for object of type 'str').
- Width too small: the value is never cut, the column just breaks.
