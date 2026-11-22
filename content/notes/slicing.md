# Notes: slicing

Source chapters read: Learning Python, "String Fundamentals" (indexing and
slicing, extended slicing). My own summary, for py-22.

## Key ideas
- `s[start:stop]` gives a new string from `start` up to, not including, `stop`.
- How many characters: `stop - start` (when both are in range and positive).
- Leave out start and it begins at 0. Leave out stop and it goes to the end.
  `s[:]` is the whole thing.
- `s[:n]` is the first n characters, `s[n:]` is everything after them. Together
  they rebuild `s`.
- Negative positions work in slices too: `s[-3:]` is the last three, `s[:-1]` drops
  the last one.
- A third number is the step: `s[::2]` is every second character.
- A negative step goes right to left: `s[::-1]` is the string reversed. With a
  negative step the start must be on the right of the stop.
- Slices never raise IndexError. Out-of-range ends are cut to fit, and an empty
  string comes back if nothing is inside.

## Order to teach
1. `[start:stop]` with the window picture, stop not included. 2. Missing start or
stop. 3. Negative positions in slices. 4. Step. 5. Reverse with `[::-1]`.
6. Slices past the end are safe.

## Common beginner mistakes
- Expecting `stop` to be included.
- `s[2:2]` and wondering why it is empty.
- `s[5:1]` (start right of stop with a positive step) gives "" not an error.
- Mixing up `s[-1]` (one char) and `s[-1:]` (a string of the last char; same text
  here, but `s[-1:]` on an empty string is "" while `s[-1]` is an error).
