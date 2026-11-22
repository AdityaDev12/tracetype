# Notes: strings never change

Source chapters read: Learning Python, "String Fundamentals" (changing strings,
string methods) and "The Dynamic Typing Interlude" (shared references). My own
summary, for py-23.

## Key ideas
- A string object can never be changed. `s[0] = "J"` is a TypeError
  ('str' object does not support item assignment).
- A method like `upper()` builds a brand new string and gives it back. The old
  one is untouched. To keep the result, store it: `s = s.upper()`.
- `s = s.upper()` does not change the old string. It makes a new one and moves
  the name `s` to it. If no name points at the old one any more, Python throws it
  away later.
- Two names can point at the same string (`b = a`). Giving `a` a new string later
  moves only `a`; `b` still points at the old one.
- Methods for this lesson: `upper`, `lower`, `strip` (spaces at both ends),
  `replace(old, new)` (all matches), `title`.
- Methods can be chained left to right: `s.strip().lower()`; each one works on
  the new string from the one before.
- "Changing" by hand: build a new string from slices and `+`, e.g.
  `s[:2] + "X" + s[3:]`.

## Order to teach
1. Try to change one letter, read the error. 2. `upper()` returns a new string,
the old one stays. 3. Forgetting to save the result. 4. `s = s.method()` and the
arrow moving (refs picture). 5. Two names, one string. 6. strip, replace, title.
7. Chaining.

## Common beginner mistakes
- `name.upper()` on its own line and expecting `name` to change.
- `s[0] = ...` to fix one letter.
- Chaining in the wrong order: `s.lower().replace("A", "b")` never finds "A".
- `strip` only removes spaces at the ends, not in the middle.
