# Notes: two names, one list

Source chapters read: Learning Python, "The Dynamic Typing Interlude" (shared
references, in-place changes, equality) and "Tuples, Files, and Everything Else"
(built-in type gotchas). My own summary, for py-30.

## Key ideas
- A name points at an object. `b = a` makes b point at the same object; nothing
  is copied.
- With strings and numbers this never matters, because they cannot change.
  With a list it matters: a change made through a (append, a[0] = ...) is seen
  through b, because there is only one list.
- Giving a a NEW object (`a = [9]`) moves only a. b keeps the old list. Changing
  the object and moving the name are different things.
- To get a separate list, copy it: `a[:]`, `list(a)` or `a.copy()`. Then the two
  names point at two objects with the same items.
- `==` asks "same items?"; `is` asks "the very same object?". Two copies are ==
  but not is.
- The copy is one level deep: a list inside a list is still shared (mention
  only; nested lists later).
- `[[0] * 3] * 2` style repetition shares the inner list. Skip for beginners or
  one quiz at most. Skip cycles.
- Small numbers and short strings may be `is` the same by caching: never use
  `is` to compare values.

## Order to teach
1. b = a, then append through a, both see it (refs: two arrows to one box).
2. Moving a name vs changing the object. 3. Copy with [:], list(), copy().
4. == vs is. 5. A list stored inside another list is shared too.

## Common beginner mistakes
- `backup = scores` and expecting a safe backup.
- Using `is` to compare values.
- Thinking `b = a` links the names forever (moving a does not move b).
