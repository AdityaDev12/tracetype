# Notes: searching text

Source chapters read: Learning Python, "String Fundamentals" (basic operations:
in, string methods: find, count, startswith, endswith, content tests). My own
summary, for py-24.

## Key ideas
- `part in text` answers True or False; it works for one letter or a longer piece.
  `not in` is the opposite.
- `text.find(part)` gives the position where `part` first starts, or -1 if it is not
  there. -1 is a real number, so check it with `== -1`, not with `if pos:`.
- `text.count(part)` says how many times `part` appears (matches do not overlap).
- `startswith` and `endswith` check the two ends and give True or False.
- `isdigit()` is True when every character is a digit 0 to 9 (and there is at least
  one). Useful before `int(...)`. `"-5".isdigit()` is False.
- `isalpha()` is True when every character is a letter (spaces make it False).
- Everything is case sensitive: "Cat" is not "cat". Lower both first.
- find plus slicing pulls a piece out: everything after "@" is
  `text[text.find("@") + 1:]`.

## Order to teach
1. `in`. 2. `find`, the -1 case. 3. `count`. 4. startswith/endswith. 5. isdigit and
isalpha as checks before converting. 6. find plus a slice.

## Common beginner mistakes
- `if text.find("x"):` is False when the match is at position 0, and True for -1.
- Forgetting case: searching "Tea" in "green tea".
- Calling `isdigit` on a number instead of a string.
- `"3.5".isdigit()` is False because of the dot.
