# Notes: types and converting

Source chapters read: Learning Python, "Introducing Python Object Types"
(overview), the conversion parts of "Numeric Types" and "String Fundamentals".
My own summary, for py-06.

## Key ideas

- Every value has a type: int, float, str, bool. `type(x)` tells you which.
- Python never converts between text and numbers by itself. "3" + 4 is a
  TypeError. You convert on purpose:
  - `int("42")` gives 42. Spaces around are allowed (" 42 " works). Text that
    is not a whole number ("3.5", "hi", "") is a ValueError.
  - `float("3.5")` gives 3.5. `float(3)` gives 3.0.
  - `str(42)` gives "42". Everything can become text.
  - `int(3.9)` gives 3: it drops the fraction, it does not round.
- `round(x)` rounds to the nearest whole number; `round(x, 2)` keeps 2 digits.
  Ties go to the even number (round(2.5) is 2, round(3.5) is 4). Mention once
  as a curiosity, do not build exercises on it.
- int and float mix freely in math; the result is a float if either is a float.
- print with commas converts for you; + with text does not.

## Order to teach

1. type() for each kind.
2. The TypeError when mixing text and numbers.
3. int() and float() from text, and the ValueError when it cannot.
4. str() to join numbers into text.
5. int() of a float drops the fraction; round() rounds.

## Common beginner mistakes

- "Total: " + 5 (TypeError). Fix: str(5) or a comma in print.
- int("3.5") (ValueError). Fix: float first, or int(float(...)).
- Expecting int(2.9) to be 3.
- Forgetting to store the result: int(x) on its own line changes nothing.

## Visuals

types (type badges, conversion pipe, error card), expr, knobs on the text.
