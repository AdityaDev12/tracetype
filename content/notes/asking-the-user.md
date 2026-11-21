# Notes: asking the user with input()

Source chapters read: Learning Python, "Introducing Python Statements" (the
interactive loop example, doing math on user inputs) and the conversion parts
of "String Fundamentals". My own summary, for py-07.

## Key ideas

- `input("prompt ")` shows the prompt, waits for the user to type a line and
  press Enter, and gives back what they typed.
- What comes back is always a str, even if they typed digits. "7" + "3" is "73".
- To do math, convert: `age = int(input("Age? "))`. Inner part runs first.
- The prompt does not add a space; put one at the end of the prompt text.
- Each input() call takes the next line the user types, in order.
- In this course the "user" is the input tape: the typed answers are listed
  in order and each input() takes the next one. When running your own code you
  type the answers in a box, one per line.
- If there is nothing left to read, Python raises EOFError.
- If the text cannot be converted, int() raises ValueError (handling that
  gracefully is Unit 9).

## Order to teach

1. input() returns text (show the type badge).
2. Prompts and the trailing space.
3. Converting with int()/float() for math.
4. Several inputs in order.
5. A tiny calculator.

## Common beginner mistakes

- Doing math on the raw input ("5" * 2 is "55").
- Forgetting the space in the prompt.
- Converting in the wrong place: int(input) without calling input.
- Converting text that is not a number (ValueError).

## Visuals

stdin input tape, types, memory, output (shows the typed answer after the prompt).
