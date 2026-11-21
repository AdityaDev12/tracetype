# Notes: text values (strings)

Source chapter read: Learning Python, "String Fundamentals" (literals, escape
sequences, basic operations, conversion tools). My own summary, for py-05.

## Key ideas

- Text is a `str`. Single or double quotes mean the same thing. Use the other
  kind when the text contains a quote: "it's" or 'say "hi"'. Or escape with \.
- `+` joins two strings into a new one. No space is added for you.
- `*` with a whole number repeats: "ab" * 3 is "ababab". Handy for lines: "-" * 20.
- `len(text)` counts characters, including spaces and punctuation.
- Escapes: `\n` is one character (a new line), `\t` is a tab, `\\` is one
  backslash, `\'` and `\"` are quotes. They count as one character each in len.
- "" is the empty string, length 0. " " is one space, length 1.
- A string of digits is still text: "12" + "3" is "123", not 15.
- Each character has a position starting at 0 (indexing itself is Unit 4;
  here only shown in the cells visual so the idea is familiar).

## Order to teach

1. Quotes and the two kinds.
2. Joining with + (and the missing space).
3. Repeating with *.
4. len.
5. Escapes \n and \t.

## Common beginner mistakes

- Forgetting the space when joining: "Hi" + name gives "HiAda".
- Mixing quote kinds: "hello' (SyntaxError).
- Joining text and a number with + (TypeError, fixed in the next lesson).
- Thinking "5" * 3 is 15 (it is "555").
- Counting \n as two characters.

## Visuals

cells (each character in a box with its position), expr for joins, memory.
