# Notes: True, False and comparisons

Source chapters read: Learning Python, "if Tests and Syntax Rules" (truth values)
and the comparison part of "Numeric Types". My own summary, for py-08.

## Key ideas
- A comparison asks a yes/no question and gives back a bool: True or False
  (capital T and F, no quotes).
- `==` equal, `!=` not equal, `<`, `>`, `<=`, `>=`. One `=` stores, two `==` compare.
- Comparisons can be chained: `1 < x < 5` means 1 < x and x < 5.
- Ints and floats compare by value: 3 == 3.0 is True.
- Text compares letter by letter, by character code: "apple" < "banana",
  but every capital letter comes before every lowercase one ("Zebra" < "apple"),
  and "10" < "9" because "1" comes before "9". Case matters for ==.
- Comparing text with a number using < or > is a TypeError. == just says False.
- A bool can be stored in a variable like any value.

## Order to teach
1. True and False as values. 2. == and !=. 3. < > <= >=. 4. Chained. 5. Text.

## Common beginner mistakes
- Using = instead of == (SyntaxError inside an if, from next lesson on).
- Writing true instead of True (NameError).
- Comparing text from input() with a number (TypeError).
- Expecting "Apple" == "apple".

## Visuals
expr stepper ending in True/False, knobs on the compared values.
