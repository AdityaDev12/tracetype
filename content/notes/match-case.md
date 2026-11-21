# Notes: match and case (beyond the book)

Source: the Python tutorial on match statements and the language reference
(Python 3.10 and later; not in Learning Python, which predates it). My own
summary, for py-11.

## Key ideas
- `match value:` then `case` lines. Python compares the value with each case
  from the top and runs the first one that matches. Only one runs.
- `case "stop":` matches that exact value. Numbers work too.
- `case "a" | "b":` matches either one.
- `case _:` matches anything, so it goes last, like else.
- If nothing matches and there is no `case _`, nothing happens.
- match reads well when one value is compared against several fixed values.
  For ranges like score >= 90, use if/elif instead.
- Trap: a plain name in a case (like `case limit:`) does not compare with a
  variable; it matches everything and stores the value in that name. Python
  stops with a SyntaxError if cases come after it.

## Order to teach
1. One value, several literal cases. 2. `_` as the default. 3. `|` for several values.
4. When match is better than elif and when it is not.

## Common beginner mistakes
- Forgetting `case _:` and expecting a default.
- Using a variable name in a case (captures everything).
- Using match for ranges (it cannot do `case > 5`).

## Visuals
branch ladder for cases (no match / matches / not checked), knobs on the value.
