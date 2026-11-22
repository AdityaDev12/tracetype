# Notes: looping over lists

Source chapters read: Learning Python, "Lists and Dictionaries" (iteration and
membership) and "while and for Loops" (for over sequences, building lists).
My own summary, for py-28.

## Key ideas
- `for item in items:` gives each item in order, one per round. No positions
  needed. The loop variable is a copy of the name, not a link: changing `item`
  does not change the list.
- Running totals work like with range: start at 0, add each item.
- `sum(xs)`, `min(xs)`, `max(xs)` do the common totals in one call. Empty list:
  sum gives 0, min and max raise ValueError.
- Average = `sum(xs) / len(xs)`; guard against an empty list first.
- Building a new list: start with `[]`, `append` inside the loop, often behind
  an if (keep only some items).
- Slices of a list are new lists: `xs[:3]` first three, `xs[1:]` all but the
  first, `xs[::-1]` reversed. Loop over a slice to skip items.
- When the position is needed, `for i in range(len(xs))` still works; enumerate
  comes later (Unit 8).

## Order to teach
1. for over a list, the loop pointer moving cell to cell. 2. Totals by hand,
then sum. 3. min and max. 4. Filter into a new list with append. 5. Loop over a
slice. 6. Changing the loop variable does nothing to the list.

## Common beginner mistakes
- `for i in xs: print(xs[i])` (uses items as positions: wrong item or IndexError).
- Putting `result = []` inside the loop, so it resets each round.
- Average of an empty list (ZeroDivisionError).
- Expecting `item = item * 2` to change the list.
