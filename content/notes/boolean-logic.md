# Notes: and, or, not, and truthy values

Source chapter read: Learning Python, "if Tests and Syntax Rules" (truth
values and Boolean tests) and the None part of "Tuples, Files, and Everything
Else". My own summary, for py-12.

## Key ideas
- `a and b` is true only if both are true. `a or b` is true if at least one is.
  `not a` flips it.
- Short-circuit: `and` stops at the first false part, `or` stops at the first
  true part. The rest is never worked out. Useful to avoid errors:
  `count > 0 and total / count > 5`.
- Every value can be used as a test. False-like ("falsy"): False, 0, 0.0, "",
  None (and empty collections later). Everything else is truthy, including
  "0" and " ".
- None is Python's value for "nothing yet". Its type is NoneType.
- and/or actually give back one of their two values, not always True or False.
  Mention only lightly; in tests it does not matter.
- Precedence: not, then and, then or. Use brackets when mixing and/or.

## Order to teach
1. and. 2. or. 3. not. 4. Short-circuit. 5. Truthy and falsy, None.

## Common beginner mistakes
- `if x == 1 or 2:` (always true, because 2 is truthy). Write `x == 1 or x == 2`.
- Mixing and/or without brackets.
- Thinking "0" or " " is falsy.
- Writing && or || from other languages.

## Visuals
expr stepper with the skipped part greyed out, knobs on the values.
