# Notes: how Python runs your code

Source chapters read: Learning Python, "How Python Runs Programs", the
interactive prompt and command line parts of "How You Run Programs", and the
opening of "Introducing Python Statements". My own summary, written to plan py-02.

## Key ideas

- A Python program is a plain text file of statements. Running it means Python
  goes through the file from the first line to the last, one statement at a time.
- Order matters: a line can only use names that earlier lines already made.
- Behind the scenes Python first translates the file into a simpler form, then
  runs that. A beginner does not need this, except for one visible effect: some
  mistakes (a missing quote or bracket) are found before anything runs, so
  nothing prints at all. Other mistakes are only found when that line runs, so
  the earlier lines still print.
- When a line fails while running, Python stops right there. Later lines never
  run. The last line of the error message names the kind of error and why.
- `#` starts a comment. Python ignores everything from `#` to the end of the line.
  Comments are notes for people.
- Statements start at the left edge. A space at the start of a line (when no
  block is open) is an IndentationError.
- On a Mac you can run a file with `python3 file.py` in Terminal, or type
  `python3` to get the `>>>` prompt, which runs one line at a time and shows the
  value of expressions without print. In a file you must use print to see things.

## Order to teach

1. Top to bottom (timeline makes the order visible).
2. Comments are skipped.
3. A runtime error stops the program; lines after it never run.
4. A syntax error stops it before anything runs.
5. Aside: running Python on your own Mac.

## Common beginner mistakes

- Using a name before the line that makes it (NameError).
- A typo in a name such as `pritn` (NameError with a "Did you mean" hint).
- Forgetting a closing quote or bracket (SyntaxError, nothing runs).
- A stray space at the start of a line (IndentationError).
- Expecting a value to show without print when running a file.

## Visuals

timeline (order), halt (where it stopped, what never ran), output.
