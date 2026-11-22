# Notes: split and join

Source chapters read: Learning Python, "String Fundamentals" (string methods:
split and join, the list-to-string round trip). My own summary, for py-31.

## Key ideas
- `text.split()` cuts text at runs of spaces (also tabs and new lines) and gives
  a list of strings. Extra spaces at the ends or between words are ignored.
- `text.split(",")` cuts at every comma exactly. Two commas in a row give an
  empty string item; spaces after the comma stay in the items (strip them).
- `split("")` is a ValueError (empty separator).
- The items are always strings, even when they look like numbers: `"3 4".split()`
  is `['3', '4']`. Turn each into int in a loop to add them.
- `sep.join(words)` glues a list of strings into one string, with sep between
  them. It is called on the separator, not on the list.
- join only takes strings: a list with numbers gives TypeError (sequence item 0:
  expected str instance, int found).
- split and join are opposites: `" ".join(s.split())` tidies the spaces.
- Typical use: read a line of input, split it, work on the words, join back.

## Order to teach
1. split() on a sentence (cut marks on the cells). 2. split(",") on a CSV-like
line, and the leftover spaces. 3. Numbers in text: split then int. 4. join with
different separators. 5. Round trip: split, change the list, join.

## Common beginner mistakes
- `words.join(" ")` (join is a string method: AttributeError on list).
- Joining numbers without str().
- Forgetting the items from split are strings ("3" + "4" is "34").
