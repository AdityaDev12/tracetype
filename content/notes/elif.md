# Notes: elif

Source chapter read: Learning Python, "if Tests and Syntax Rules" (multiway
branching). My own summary, for py-10.

## Key ideas
- `elif test:` adds another test. Python checks the tests from the top and runs
  only the first block whose test is true. The rest are not even checked.
- else, if present, catches everything else and must come last.
- Order matters: with `if score >= 50:` first, a score of 90 never reaches
  `elif score >= 80:`. Put the strictest test first (or use ranges).
- Many ifs in a row are different from one if/elif chain: separate ifs are all
  checked and several can run.

## Order to teach
1. One extra test with elif. 2. Several elifs. 3. Order matters. 4. if/elif vs separate ifs.

## Common beginner mistakes
- Tests in the wrong order (a wide test catches everything first).
- Writing separate ifs when only one answer should be printed.
- elif after else (SyntaxError).
- `elif` spelt `else if` (SyntaxError).

## Visuals
branch ladder with a mark on each test and the first True winning.
