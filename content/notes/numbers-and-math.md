# Notes: numbers and math

Source chapter read: Learning Python, "Numeric Types" (basics, operators,
precedence, division, built-in numeric tools). My own summary, for py-03.

## Key ideas

- Two everyday number types: `int` (whole numbers, no size limit) and `float`
  (numbers with a decimal point, such as 2.5).
- Operators: `+ - *`, `/` (division, always gives a float, even 10 / 2 is 5.0),
  `//` (floor division: divide and drop the fraction, rounding down), `%`
  (remainder), `**` (power).
- Precedence: `**` first, then `* / // %`, then `+ -`. Same level goes left to
  right. Parentheses go first and make intent clear. `**` groups right to left
  (2 ** 3 ** 2 is 2 ** 9), rarely needed.
- Mixing an int and a float gives a float (3 * 1.5 is 4.5).
- `//` and `%` are a pair: 17 // 5 is 3 (how many whole fives), 17 % 5 is 2
  (what is left). Classic uses: minutes and seconds, even or odd (n % 2).
- With negatives, `//` rounds down (toward minus infinity), so -7 // 2 is -4.
  Mention only lightly; beginners mostly use positives.
- Dividing by zero is a ZeroDivisionError for `/`, `//` and `%`.
- Floats are stored in binary, so 0.1 + 0.2 shows 0.30000000000000004. Mention
  as a curiosity; the full story is in the Advanced numbers unit.

## Order to teach

1. + - * with ints, results stored in variables.
2. / always gives a float.
3. // and % as a pair (sharing sweets, minutes and seconds).
4. ** for powers.
5. Precedence and parentheses (expression stepper makes it visible).

## Common beginner mistakes

- Expecting 7 / 2 to be 3 (it is 3.5).
- Expecting 10 / 2 to be 5 (it is 5.0, a float).
- Writing 2 + 3 * 4 and expecting 20.
- Using ^ for power (that is a bitwise operator in Python, ** is power).
- Dividing by zero.

## Visuals

expr stepper with knobs on the numbers, memory.
