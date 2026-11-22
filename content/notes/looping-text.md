# Notes: looping over text

Source chapters read: Learning Python, "while and for Loops" (iterating over a
string) and "String Fundamentals" (basic operations, in). My own summary, for py-20.

## Key ideas
- `for ch in word:` gives each character in turn, from left to right.
- Counting letters: a counter that goes up when the character matches.
- `ch in "aeiou"` asks whether one character is one of several.
- Building a new string: start with "" and add with `+=`. Adding in front
  (`new = ch + new`) reverses it.
- Strings never change; building means making a new string each round.
- `len(word)` rounds happen.

## Order to teach
1. Print each letter. 2. Count a letter. 3. Vowels with in. 4. Build a new
string. 5. Reverse.

## Common beginner mistakes
- Forgetting to start the new string as "".
- Comparing with the wrong case ("A" vs "a").
- Expecting the original string to change.

## Visuals
cells with a pointer on the current character, history of the string being built, loop panel.
