# Notes: variables and print

Source chapters read: Learning Python, "The Dynamic Typing Interlude" and the
assignment and print parts of "Assignments, Expressions, and Prints".
These notes are my own summary, written to plan the lesson.

## Key ideas

- A variable is a name that points at a value. Writing `name = value` makes the
  name if it does not exist yet, then points it at the value.
- You never announce a variable ahead of time. The first assignment creates it.
- The value has a type (text is `str`, whole numbers are `int`). The name itself
  has no type. The same name can later point at a different kind of value.
- Reading a name before it was ever assigned is an error (`NameError`). Python
  does not invent a default value.
- Assigning again replaces what the name points at. The old value is not kept.
- `b = a` makes `b` point at the same value that `a` points at right now. It does
  not tie the two names together. Changing `a` later with a new assignment does
  not change `b`. (The surprising case with lists comes later, once lists are taught.)
- Names: letters, digits and underscores, cannot start with a digit, case
  matters (`age` and `Age` are different), and Python keywords such as `if` or
  `for` cannot be used.
- `print(...)` shows values on screen. It takes several values separated by
  commas and puts one space between them, then moves to a new line.
- `print` shows text without the quotes. The quotes in code only mark where the
  text starts and ends.

## Common beginner mistakes

- Thinking `=` means "is equal to" as in maths. It means "make this name point at
  this value". Reading it as "gets" helps: `age = 14` reads "age gets 14".
- Putting quotes around a variable name in print: `print("name")` shows the word
  name, not the value stored in the variable.
- Expecting `b = a` to keep the two in sync forever.
- Using a variable before the line that creates it.
- Expecting print to remember things. Printing never changes a variable.

## Teaching order for the first lesson

1. Make a text variable, then a number variable.
2. Print each one on its own.
3. Print several things in one call to show the automatic spaces.
4. Reassign a variable and watch the old value disappear ("was" in the panel).
5. Copy one name into another and show both point at the same value.
6. Leave name rules, keywords and the list surprise for later lessons or the quiz.

## Things checked by running python3

- `print("a", 4, "b")` prints `a 4 b`.
- After `x = 4`, `y = x`, `x = 3`, y is still 4.
- `type("hi").__name__` is `str`, `type(4).__name__` is `int`.
