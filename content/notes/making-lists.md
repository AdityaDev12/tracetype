# Notes: making lists

Source chapters read: Learning Python, "Lists and Dictionaries" (lists, basic
list operations, indexing and slicing) and the list part of "Introducing Python
Object Types". My own summary, for py-26.

## Key ideas
- A list holds many values in one name, in order: `[3, 8, 5]`. Square brackets,
  commas between items. `[]` is an empty list.
- Items can be any type, and can be mixed: `["pen", 2, 1.5, True]`. Usually a
  list holds one kind of thing, which keeps code simple.
- Positions work exactly like text: first item at 0, last at `len(xs) - 1` or
  `-1`. Past the end is an IndexError ("list index out of range").
- `xs[1]` gives back the item itself (a number, a string...), not a list.
- `len(xs)` counts items, not characters. `len(["hello"])` is 1.
- `in` checks whole items: `"an" in ["banana"]` is False (no item equals "an"),
  while `"an" in "banana"` is True. Big difference from text.
- `print(xs)` shows brackets and quotes around strings: `['a', 'b']`.
- `+` joins two lists into a new one; `*` repeats a list. Both make new lists.
- Lists can span several lines inside the brackets.

## Order to teach
1. A shopping list: one name, many values. 2. Positions and negative positions
(same rule as text). 3. len. 4. in on items, compared with in on text.
5. Mixed values and how print shows a list. 6. + and * make new lists.

## Common beginner mistakes
- Asking for `xs[len(xs)]` (IndexError, off by one).
- Forgetting the commas: `[1 2 3]` is a SyntaxError.
- Expecting `in` to find part of an item.
- `[1, 2] + 3` (TypeError, + needs a list on both sides).
