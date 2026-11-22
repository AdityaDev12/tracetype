# Notes: sorting and list tools

Source chapters read: Learning Python, "Lists and Dictionaries" (sorting lists,
other list methods). My own summary, for py-29.

## Key ideas
- `xs.sort()` sorts the SAME list in place and gives back None.
- `sorted(xs)` makes a NEW sorted list and leaves xs alone. It works on any
  sequence, even a string (gives a list of characters).
- `reverse=True` (on either) sorts from big to small.
- `xs.reverse()` flips the order in place (no sorting). `xs[::-1]` makes a new
  reversed list.
- Numbers sort by size. Strings sort letter by letter, and all capitals come
  before all small letters ("Zoe" before "amy").
- Mixed numbers and strings cannot be sorted in Python 3: TypeError ('<' not
  supported between instances of 'str' and 'int').
- `xs.index(x)`: position of the first x (ValueError if missing).
  `xs.count(x)`: how many times x appears. Neither changes the list.
- The classic trap: `xs = xs.sort()` makes xs None.
- key=... is left for later (needs functions).

## Order to teach
1. sort() changes the list. 2. sorted() makes a new one (refs: two objects).
3. reverse=True. 4. The None trap. 5. index and count. 6. Top three with
sorted(..., reverse=True)[:3].

## Common beginner mistakes
- `xs = xs.sort()` or `print(xs.sort())` (None).
- Expecting sorted(xs) to change xs.
- Sorting a list of mixed types.
- Capital letters sorting first.
