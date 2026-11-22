# Notes: changing lists

Source chapters read: Learning Python, "Lists and Dictionaries" (changing lists
in place, index assignment, list method calls, del). My own summary, for py-27.

## Key ideas
- Lists are mutable: the same list object can be changed. Strings could not.
- `xs[i] = value` replaces the item at a position. The position must exist,
  otherwise IndexError "list assignment index out of range".
- `append(x)` adds one item at the end. The most common way to grow a list.
- `insert(i, x)` puts x at position i; the items from i onward slide right and
  their positions go up by one.
- `pop()` takes the last item out and gives it back; `pop(i)` takes the item at
  i. Items after it slide left.
- `remove(x)` takes out the first item equal to x (by value, not position).
  ValueError if x is not there.
- `del xs[i]` deletes by position, like pop but gives nothing back.
- These methods change the list and give back None (except pop, which gives the
  item). So never write `xs = xs.append(4)`.
- `extend(other)` adds every item of another list, `append(other)` adds the list
  as ONE item. Mention briefly.
- Empty list: `pop()` gives IndexError "pop from empty list".

## Order to teach
1. Replace one item (contrast with the string TypeError). 2. append to grow.
3. insert and the sliding positions. 4. pop by position and its result.
5. remove by value. 6. del. 7. The None trap.

## Common beginner mistakes
- `xs = xs.append(x)` then xs is None.
- Confusing pop(i) (a position) with remove(x) (a value).
- remove only takes out the first match.
- Setting `xs[len(xs)] = x` to add at the end (IndexError): use append.
