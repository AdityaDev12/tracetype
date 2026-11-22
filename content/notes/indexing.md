# Notes: indexing

Source chapters read: Learning Python, "String Fundamentals" (indexing and
slicing, basic operations). My own summary, for py-21.

## Key ideas
- A string is a row of characters in a fixed order. Each one has a position.
- Positions start at 0, so the last one is `len(s) - 1`.
- `s[i]` gives back a one-character string. Python has no separate "char" type.
- Negative positions count from the right: `-1` is the last character, `-2` the
  one before it. Python adds the length: `s[-2]` is `s[len(s) - 2]`.
- There is no -0, so the left end is 0 and the right end is -1.
- A position past either end raises IndexError (string index out of range).
- The index can be any expression that gives a whole number: a variable, `len(s) - 1`,
  `n // 2`. A float index is a TypeError.

## Order to teach
1. First character with `[0]`. 2. Other positions, counting from 0. 3. The last
character with `len(s) - 1`, then the shortcut `[-1]`. 4. Negative positions in
general. 5. Going past the end and reading the IndexError.

## Common beginner mistakes
- Counting from 1 (`s[1]` for the first letter).
- `s[len(s)]` for the last letter: one too far.
- Using round brackets `s(0)`: TypeError, str is not callable.
- Thinking `s[-0]` is the last character (it is the first).
- Index from a division: `s[len(s) / 2]` is a float, so TypeError. Use `//`.
