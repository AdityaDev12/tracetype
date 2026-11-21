# Python track syllabus (approved)

Main book: *Learning Python*, 5th edition (Lutz). Order is rebuilt for a total beginner: the most useful things first, depth later.

- **Core units 1 to 12 plus a capstone project** take a learner from zero to everything needed before Track 2 (Python for Data Analysis). Cross-checked against what Track 2's opening chapters assume: tuples, lists, dicts, sets, `enumerate`/`zip`/`sorted`, comprehensions, functions, scope, lambda, generators, exceptions, files, imports and objects with methods.
- **Advanced units A1 to A9 (optional)** cover the rest of the book. A learner can jump to Track 2 after Unit 12 and come back any time.
- Every lesson has all v2 steps (docs/PLAN.md section 3), a mini project and a unit review per unit.
- Every lesson only uses ideas from earlier lessons. Where an idea is used early in a simple form (for example `None` in Unit 2) the full lesson comes later.

## Totals

| Part | Units | Lessons | Time (lessons + projects + reviews) |
|---|---|---|---|
| Core | 12 + capstone | 71 | about 37 hours |
| Advanced (optional) | 9 | 39 | about 21.5 hours |
| **Whole track** | **21 + capstone** | **110** | **about 58 hours** |

Estimate: 20 minutes per lesson on average (15 for small ones, 25 for big ones), 40 minutes per mini project, 15 minutes per unit review. At 45 minutes a day the core takes about 7 weeks. Lessons marked "beyond the book" teach modern Python (3.8 to 3.14) that the 2013 book does not have.

---

## Visuals: what the engine needs

Today the engine has one visual: **memory boxes** plus the **output** terminal. The lesson picks it with `"visual": "memory"`. For this track every lesson gets at least one concept-specific visual. These are the new ones.

### Controls (on every lesson)

| Id | What the learner sees and does |
|---|---|
| `timeline` | A scrubbable slider under the code. One tick per executed step, a dot where something was printed, a red tick where an error happened. Drag it, or press left/right arrow, to move back and forth through execution. Every panel follows it. Clicking a code line jumps to the last time that line ran. |
| `knobs` | "Change this value and watch." The lesson marks a literal in the code (a number, a word, an index) as a knob: a slider, number box or text box. Changing it reruns the code in Pyodide and every panel updates live. The default run is still pre-traced offline, so the page works before Pyodide loads. |
| `hover-link` | Hover or tap a name in the code and its box lights up in the visual (and the other way round). |

### Panels (chosen per example, not per page)

| Id | Shows | First used |
|---|---|---|
| `memory` | Name boxes with type badge, "was X" when a value changes (exists today) | Lesson 1 |
| `output` | The terminal output, new text flashes (exists today) | Lesson 1 |
| `history` | Each variable as a row of its past values over time (`x: 3 → 4 → 8`), linked to the timeline | U1 |
| `expr` | Expression stepper: an expression reduces one operation at a time (`2 + 3 * 4` → `2 + 12` → `14`). Shows precedence, comparisons ending in True/False, and short-circuit (the skipped side greys out) | U1 |
| `halt` | Where the program stopped: the error line in red, every later line greyed "never ran" | U1 |
| `types` | Type badges and a conversion pipe: `"42"` → `int()` → `42`, with the error card when a conversion fails | U1 |
| `stdin` | Input tape: the values the "user" will type, queued; each `input()` call takes the next one and crosses it off | U1 |
| `branch` | If/elif/else path map: each test with its value (True/False), the taken block lit, the others dimmed | U2 |
| `loop` | Loop panel: iteration counter ("round 3 of 5"), the loop variable as a row of chips, the condition check each round, break/continue marks, skipped body lines greyed | U3 |
| `tracetable` | Trace table: one row per loop round, one column per variable. The classic paper trace table, built live | U3 |
| `grid` | 2D grid: nested loops light up (row, col) cells as they are visited; also a list of lists | U3 |
| `cells` | Sequence cells for str, list, tuple and range: one cell per item with positive and negative index numbers, the accessed cell highlighted, a slice window bracket, items sliding when inserted or removed | U3 |
| `format` | f-string filler: the template with holes, each hole fills with its value, then the format spec (`:.2f`, `>8`) is applied | U4 |
| `refs` | Reference diagram: names on the left, objects on the right, arrows between. Two names on one list show two arrows, so a change through one is visible through both | U4 |
| `dict` | Key/value table: lookup highlights the key row, new keys slide in, a missing key shows the KeyError | U6 |
| `venn` | Set bubbles: unique items, union / intersection / difference shaded | U6 |
| `tree` | Nested data as a tree (list of dicts, dict of lists) with the access path `data[0]["name"]` lit step by step | U6 |
| `stack` | Call stack: one frame per active call with its local names; arguments flow into parameters with arrows; a frame pops and its return value bubble flies back to the calling line | U7 |
| `scope` | Scope rings: local inside enclosing inside global inside built-in; a name lookup walks outward until it finds the name | U7 |
| `pipeline` | Pipeline: source cells → filter gate → transform → result cells (comprehensions, map, filter, sorted with key). For iterators and generators: a conveyor where `next()` pulls one item and a generator frame shows "paused at line N" | U8 |
| `errorflow` | Exception flow: where the error was raised, frames unwinding, which `except` caught it, and the try/except/else/finally path that ran. Includes an annotated traceback (file, line, type, message circled by the tutor) | U9 |
| `tests` | Test checklist: each check or `assert` as a row turning green or red, with the values compared | U9 |
| `files` | Virtual file panel: file contents, open/closed light, mode badge (`r`, `w`, `a`), a read cursor moving line by line, written text appearing | U10 |
| `modules` | Module boxes: `import` creates a module box with its names; `from x import y` copies one name across; a folder tree for packages and the search path ladder | U11 |
| `objects` | Class and instance diagram: instance boxes with their attributes, arrows to the class box with its methods, `self` arrows inside method frames, and the attribute lookup path (instance → class → parent classes) | U12 |
| `bits` | Bit cells: an int as binary digits; bitwise operations line two rows up and compute the third | A1 |
| `calltree` | Recursion tree: every call as a node, the active path lit, return values written on the edges | A2 |
| `bytes` | Text to bytes: each character → code point → UTF-8 byte cells (hex) | A7 |
| `eventloop` | Async lanes: one lane per task, showing running, waiting and done, with turns on the timeline | A9 |
| `wrap` | Wrapper diagram for decorators: the original function inside its wrapper, the call passing through the layers | A8 |

### What the tracer must record for these

The offline tracer (`scripts/trace_lesson.py`) and the Pyodide tracer must both produce the same new shape:

1. **Structured values with object ids** (a small heap): list/tuple/str/range items, dict pairs, set items, instance attributes and class, function and module objects. Needed by `cells`, `refs`, `dict`, `venn`, `tree`, `objects`.
2. **The full call stack** on every step (today only the innermost frame), plus call and return events with the return value. Needed by `stack`, `scope`, `calltree`, `wrap`.
3. **Test results on `if`/`elif`/`while` lines** and loop round numbers. Needed by `branch`, `loop`, `tracetable`.
4. **Expression reduction steps** for lines the lesson marks (computed from the AST with the real values). Needed by `expr`, `format`.
5. **Exception events**: raised at, caught at, finally ran. Needed by `errorflow`, `halt`.
6. **stdin** (queued inputs, how many used) and a **virtual file system** snapshot (seeded per item). Needed by `stdin`, `files`.
7. A size cap (steps, items per value) so traces stay small.

Lesson format change: `visual` stays as the lesson default; each example, predict and investigate item can set its own `visuals: [...]` list and `knobs: [...]`.

Plan: build each visual just in time, in the unit that first needs it (column "First used"), with its tests, then reuse it everywhere after.

---

## Core units

### Unit 1: First steps (py-u1)
Store values, do math, read input. About 3.25 hours (7 lessons + project + review).

**1. py-01 Variables and print** (done)
- Concepts: `=`, names, `print`, str vs int, several values in one print
- Visuals: `memory`, `output`, `timeline`
- Also in: Chapter 6. The Dynamic Typing Interlude; Chapter 11. Assignments, Expressions, and Prints
- Docs: [Tutorial: numbers](https://docs.python.org/3/tutorial/introduction.html#numbers), [print()](https://docs.python.org/3/builtins/functions.html#print)

**2. py-02 How Python runs your code**
- Concepts: top to bottom, one line at a time; comments with `#`; an error stops the program (NameError, SyntaxError); running Python on your own Mac (`python3 file.py`, the `>>>` prompt) as a short aside
- Visuals: `timeline` (scrub to see order), `halt` (where it stopped, lines that never ran), `output`
- Also in: Chapter 2. How Python Runs Programs; Chapter 3. How You Run Programs; Chapter 10. Introducing Python Statements
- Docs: [Using the interpreter](https://docs.python.org/3/tutorial/interpreter.html), [Tutorial: informal introduction (comments)](https://docs.python.org/3/tutorial/introduction.html#an-informal-introduction-to-python)

**3. py-03 Numbers and math**
- Concepts: int and float, `+ - * /`, `//`, `%`, `**`, order of operations, parentheses, `/` always gives a float
- Visuals: `expr` stepper; `knobs` on the numbers ("change 7 to 8 and watch `//` and `%`")
- Also in: Chapter 5. Numeric Types
- Docs: [Tutorial: numbers](https://docs.python.org/3/tutorial/introduction.html#numbers), [Numeric types](https://docs.python.org/3/builtins/stdtypes.html#numeric-types-int-float-complex)

**4. py-04 Changing variables**
- Concepts: reassigning, `x = x + 1` (right side first), `+= -= *=`, swapping with a temporary name, naming rules (letters, digits, `_`, case matters, reserved words)
- Visuals: `history` (value trail per name), `memory` with "was X", `timeline`
- Also in: Chapter 11. Assignments, Expressions, and Prints; Chapter 6. The Dynamic Typing Interlude
- Docs: [Augmented assignment](https://docs.python.org/3/reference/simple_stmts.html#augmented-assignment-statements), [Keywords](https://docs.python.org/3/reference/lexical_analysis.html#keywords)

**5. py-05 Text values**
- Concepts: str, single vs double quotes, `+` to join, `*` to repeat, `len()`, escapes `\n` and `\t`, the empty string
- Visuals: `cells` (each character in its own cell with its position), `expr` for joins
- Also in: Chapter 7. String Fundamentals
- Docs: [Tutorial: text](https://docs.python.org/3/tutorial/introduction.html#text), [String literals](https://docs.python.org/3/reference/lexical_analysis.html#string-and-bytes-literals)

**6. py-06 Types and converting**
- Concepts: `type()`, `int()`, `float()`, `str()`, `round()`, why `"3" + 4` is a TypeError, ValueError for `int("hi")`
- Visuals: `types` conversion pipe and error card; `knobs` on the text being converted
- Also in: Chapter 4. Introducing Python Object Types; Chapter 5. Numeric Types
- Docs: [int()](https://docs.python.org/3/builtins/functions.html#int), [float()](https://docs.python.org/3/builtins/functions.html#float), [type()](https://docs.python.org/3/builtins/functions.html#type)

**7. py-07 Asking the user**
- Concepts: `input()` with a prompt, it always gives a str, converting the answer, simple calculators
- Visuals: `stdin` input tape (exercises supply the typed answers), `types`, `memory`
- Also in: Chapter 10. Introducing Python Statements (A Quick Example: Interactive Loops)
- Docs: [input()](https://docs.python.org/3/builtins/functions.html#input)

**Mini project:** Trip cost calculator (distance, fuel use and price in, cost out, nicely printed).

### Unit 2: Making decisions (py-u2)
Let the program choose. About 2.9 hours (6 lessons + project + review).

**8. py-08 True, False and comparisons**
- Concepts: bool, `== != < > <= >=`, chained `1 < x < 5`, comparing strings, `=` vs `==`
- Visuals: `expr` stepper ending in True/False; `knobs` on the compared values
- Also in: Chapter 12. if Tests and Syntax Rules; Chapter 5. Numeric Types
- Docs: [Comparisons](https://docs.python.org/3/builtins/stdtypes.html#comparisons), [Truth value testing](https://docs.python.org/3/builtins/stdtypes.html#truth-value-testing)

**9. py-09 if and else**
- Concepts: `if`, `else`, the colon, indented blocks, indentation errors
- Visuals: `branch` path map; `knobs` ("change age to 12 and watch the path move")
- Also in: Chapter 12. if Tests and Syntax Rules; Chapter 10. Introducing Python Statements
- Docs: [Tutorial: if statements](https://docs.python.org/3/tutorial/controlflow.html#if-statements), [The if statement](https://docs.python.org/3/reference/compound_stmts.html#the-if-statement)

**10. py-10 elif: one of many**
- Concepts: `elif` chains, tests checked in order, the first True wins, order bugs
- Visuals: `branch` as a ladder with a check or cross on each test; `knobs`
- Also in: Chapter 12. if Tests and Syntax Rules
- Docs: [Tutorial: if statements](https://docs.python.org/3/tutorial/controlflow.html#if-statements)

**11. py-11 match and case** (beyond the book)
- Concepts: `match` on a value, `case` with literals, `case "a" | "b"`, the `case _` catch-all, when match reads better than elif
- Visuals: `branch` showing each case tried in order and the one that matched; `knobs` on the value
- Also in: none (added in Python 3.10)
- Docs: [Tutorial: match statements](https://docs.python.org/3/tutorial/controlflow.html#match-statements), [The match statement](https://docs.python.org/3/reference/compound_stmts.html#the-match-statement)

**12. py-12 and, or, not, and truthy values**
- Concepts: `and`, `or`, `not`, short-circuit, truthy and falsy (`0`, `""`, `None` as "no value yet")
- Visuals: `expr` with short-circuit (the skipped side greys out), truth table panel; `knobs`
- Also in: Chapter 12. if Tests and Syntax Rules (Truth Values and Boolean Tests); Chapter 9. Tuples, Files, and Everything Else
- Docs: [Boolean operations](https://docs.python.org/3/builtins/stdtypes.html#boolean-operations-and-or-not), [Truth value testing](https://docs.python.org/3/builtins/stdtypes.html#truth-value-testing)

**13. py-13 Nested decisions and the one-line if**
- Concepts: ifs inside ifs, flattening with `and`/`elif`, `a if test else b`
- Visuals: `branch` with nested blocks outlined; `expr` for the one-line if
- Also in: Chapter 12. if Tests and Syntax Rules (The if/else Ternary Expression; Python Syntax Revisited)
- Docs: [Conditional expressions](https://docs.python.org/3/reference/expressions.html#conditional-expressions)

**Mini project:** Ticket price rules (age, day and member discounts).

### Unit 3: Loops (py-u3)
Repeat work. About 3.25 hours (7 lessons + project + review).

**14. py-14 while loops**
- Concepts: `while`, the condition checked every round, counters, the infinite loop (and the time limit that saves you)
- Visuals: `loop` (round counter, condition True/True/False), `timeline` with one tick per round; `knobs` on the start and stop values
- Also in: Chapter 13. while and for Loops
- Docs: [The while statement](https://docs.python.org/3/reference/compound_stmts.html#the-while-statement)

**15. py-15 for loops and range()**
- Concepts: `for`, `range(stop)`, `range(start, stop)`, `range(start, stop, step)`, stop is not included
- Visuals: `cells` for the range numbers with the current one lit, `loop`; `knobs` on start/stop/step
- Also in: Chapter 13. while and for Loops; Chapter 14. Iterations and Comprehensions
- Docs: [Tutorial: for statements](https://docs.python.org/3/tutorial/controlflow.html#for-statements), [range()](https://docs.python.org/3/tutorial/controlflow.html#the-range-function)

**16. py-16 Running totals and counters**
- Concepts: accumulator pattern (total, count, biggest so far), start values, average
- Visuals: `tracetable` (one row per round), `history`
- Also in: Chapter 13. while and for Loops (Loop Coding Techniques)
- Docs: [Tutorial: for statements](https://docs.python.org/3/tutorial/controlflow.html#for-statements)

**17. py-17 break, continue and loop else**
- Concepts: `break`, `continue`, `pass`, `else` on a loop (runs when no break happened)
- Visuals: `loop` with break/continue marks and greyed skipped lines, `branch`
- Also in: Chapter 13. while and for Loops (break, continue, pass, and the Loop else)
- Docs: [Tutorial: break and continue](https://docs.python.org/3/tutorial/controlflow.html#break-and-continue-statements), [pass](https://docs.python.org/3/tutorial/controlflow.html#pass-statements)

**18. py-18 Assign and test at once: the walrus :=** (beyond the book)
- Concepts: `:=` gives a name a value inside an expression, `while (answer := input(...)) != "quit":`, when it helps and when a plain line is clearer
- Visuals: `expr` stepper (the assignment happens mid-expression, the box appears in `memory`), `stdin`, `loop`
- Also in: Chapter 13. while and for Loops (the old "loop and a half" pattern it replaces)
- Docs: [Assignment expressions](https://docs.python.org/3/reference/expressions.html#assignment-expressions)

**19. py-19 Loops inside loops**
- Concepts: nested loops, the inner loop restarts each outer round, rows and columns, printing patterns
- Visuals: `grid` lighting (row, col) cells, two counters in `loop`; `knobs` on the sizes
- Also in: Chapter 13. while and for Loops
- Docs: [Tutorial: for statements](https://docs.python.org/3/tutorial/controlflow.html#for-statements)

**20. py-20 Looping over text**
- Concepts: `for ch in word`, counting letters, building a new string, `in` for one letter
- Visuals: `cells` with a pointer moving through the characters, `history` for the string being built
- Also in: Chapter 13. while and for Loops; Chapter 7. String Fundamentals
- Docs: [Tutorial: for statements](https://docs.python.org/3/tutorial/controlflow.html#for-statements)

**Mini project:** Number guessing game (the guesses come from the input tape).

### Unit 4: Strings in depth (py-u4)
Work with text like a pro. About 2.6 hours (5 lessons + project + review).

**21. py-21 Indexing**
- Concepts: positions from 0, negative positions, `len(s) - 1`, IndexError
- Visuals: `cells` with both index rows; `knobs` on the index ("drag it past the end and see the error")
- Also in: Chapter 7. String Fundamentals
- Docs: [Tutorial: text](https://docs.python.org/3/tutorial/introduction.html#text), [Common sequence operations](https://docs.python.org/3/builtins/stdtypes.html#common-sequence-operations)

**22. py-22 Slicing**
- Concepts: `[start:stop]`, missing start or stop, `[::step]`, reversing with `[::-1]`, slices never raise IndexError
- Visuals: `cells` with a slice window; `knobs` for start, stop and step as sliders
- Also in: Chapter 7. String Fundamentals
- Docs: [Common sequence operations](https://docs.python.org/3/builtins/stdtypes.html#common-sequence-operations)

**23. py-23 Strings never change**
- Concepts: immutability, methods make new strings: `upper`, `lower`, `strip`, `replace`, `title`; chaining methods; forgetting to save the result
- Visuals: `refs` (the name moves to a new string, the old one is untouched), `cells` before and after
- Also in: Chapter 7. String Fundamentals (String Methods); Chapter 6. The Dynamic Typing Interlude
- Docs: [String methods](https://docs.python.org/3/builtins/stdtypes.html#string-methods)

**24. py-24 Searching text**
- Concepts: `in`, `find`, `count`, `startswith`, `endswith`, `isdigit`, `isalpha`
- Visuals: `cells` with matches highlighted; `knobs` on the search word
- Also in: Chapter 7. String Fundamentals
- Docs: [String methods](https://docs.python.org/3/builtins/stdtypes.html#string-methods)

**25. py-25 Formatting output**
- Concepts: f-strings, `{price:.2f}`, width and alignment, `print(sep=..., end=...)`, `f"{total=}"` for quick debugging (beyond the book)
- Visuals: `format` filler; `knobs` on the value and the spec
- Also in: Chapter 7. String Fundamentals (String Formatting Method Calls); Chapter 11. Assignments, Expressions, and Prints (Print Operations)
- Docs: [Tutorial: f-strings](https://docs.python.org/3/tutorial/inputoutput.html#formatted-string-literals), [Format spec mini-language](https://docs.python.org/3/library/string.html#format-specification-mini-language), [f-strings reference (including `=`)](https://docs.python.org/3/reference/lexical_analysis.html#f-strings)

**Mini project:** Receipt printer (items, prices, tax, aligned columns).

### Unit 5: Lists (py-u5)
Keep many values in one place. About 2.9 hours (6 lessons + project + review).

**26. py-26 Making lists**
- Concepts: `[]`, indexing and negative indexing (same as strings), `len`, `in`, mixed values
- Visuals: `cells` with indexes; `knobs` on the index
- Also in: Chapter 8. Lists and Dictionaries; Chapter 4. Introducing Python Object Types
- Docs: [Tutorial: lists](https://docs.python.org/3/tutorial/introduction.html#lists)

**27. py-27 Changing lists**
- Concepts: `items[i] = x`, `append`, `insert`, `pop`, `remove`, `del`, lists are mutable (unlike strings)
- Visuals: `cells` with items sliding and indexes renumbering on insert/remove; `timeline`
- Also in: Chapter 8. Lists and Dictionaries (Lists in Action)
- Docs: [More on lists](https://docs.python.org/3/tutorial/datastructures.html#more-on-lists), [Mutable sequence types](https://docs.python.org/3/builtins/stdtypes.html#mutable-sequence-types)

**28. py-28 Looping over lists**
- Concepts: `for item in items`, list slices, `sum`, `min`, `max`, building a new list with `append` in a loop
- Visuals: `cells` with a loop pointer, `tracetable`
- Also in: Chapter 8. Lists and Dictionaries; Chapter 13. while and for Loops
- Docs: [More on lists](https://docs.python.org/3/tutorial/datastructures.html#more-on-lists), [sum()](https://docs.python.org/3/builtins/functions.html#sum)

**29. py-29 Sorting and list tools**
- Concepts: `sort()` vs `sorted()`, `reverse`, `index`, `count`, why `x = x.sort()` gives None
- Visuals: `cells` before and after, `refs` (sorted makes a new list, sort changes the same one)
- Also in: Chapter 8. Lists and Dictionaries
- Docs: [Sorting techniques](https://docs.python.org/3/howto/sorting.html), [sorted()](https://docs.python.org/3/builtins/functions.html#sorted)

**30. py-30 Two names, one list**
- Concepts: names point to objects, `b = a` does not copy, changing through one name shows through the other, copying with `a[:]` or `list(a)`, `is` vs `==`
- Visuals: `refs` arrows (the star visual of this lesson); `knobs` toggle "copy or share"
- Also in: Chapter 6. The Dynamic Typing Interlude (Shared References); Chapter 9. Tuples, Files, and Everything Else (Built-in Type Gotchas)
- Docs: [Programming FAQ: why did changing list y also change x?](https://docs.python.org/3/faq/programming.html#why-did-changing-list-y-also-change-list-x)

**31. py-31 split and join**
- Concepts: `split()`, `split(",")`, `" ".join(words)`, turning a sentence into words and back
- Visuals: `cells` for the string with cut marks, then `cells` for the list
- Also in: Chapter 7. String Fundamentals (String Methods)
- Docs: [str.split](https://docs.python.org/3/builtins/stdtypes.html#str.split), [str.join](https://docs.python.org/3/builtins/stdtypes.html#str.join)

**Mini project:** Class scores (store scores, add and drop students, print the top three and the average).

### Unit 6: Tuples, dictionaries and sets (py-u6)
The right container for the job. About 2.6 hours (5 lessons + project + review).

**32. py-32 Tuples and unpacking**
- Concepts: tuples, they cannot change, `a, b = pair`, swapping with `a, b = b, a`, `first, *rest = items`
- Visuals: `cells` (locked tuple), unpacking arrows into `memory`
- Also in: Chapter 9. Tuples, Files, and Everything Else; Chapter 11. Assignments, Expressions, and Prints (Assignment Statements)
- Docs: [Tuples and sequences](https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences)

**33. py-33 Dictionaries**
- Concepts: key → value, `d[key]`, adding and changing, KeyError, `in` checks keys
- Visuals: `dict` table with the looked-up key lit; `knobs` on the key
- Also in: Chapter 8. Lists and Dictionaries (Dictionaries)
- Docs: [Tutorial: dictionaries](https://docs.python.org/3/tutorial/datastructures.html#dictionaries), [Mapping types](https://docs.python.org/3/builtins/stdtypes.html#typesmapping)

**34. py-34 Working with dictionaries**
- Concepts: `get` with a default, `keys`, `values`, `items`, looping over items, `del`, counting things with a dict
- Visuals: `dict` with a loop pointer on rows, `tracetable` while counting
- Also in: Chapter 8. Lists and Dictionaries (Dictionaries in Action)
- Docs: [Looping techniques](https://docs.python.org/3/tutorial/datastructures.html#looping-techniques), [dict.get](https://docs.python.org/3/builtins/stdtypes.html#dict.get)

**35. py-35 Sets**
- Concepts: unique items, `set()`, `add`, `in`, removing duplicates, `|`, `&`, `-`
- Visuals: `venn` bubbles; `knobs` on the items
- Also in: Chapter 5. Numeric Types (Other Numeric Types: Sets); Chapter 4. Introducing Python Object Types
- Docs: [Tutorial: sets](https://docs.python.org/3/tutorial/datastructures.html#sets), [Set types](https://docs.python.org/3/builtins/stdtypes.html#set-types-set-frozenset)

**36. py-36 Nested data**
- Concepts: lists of dicts, dicts of lists, `data[0]["name"]`, looping over records, the `[[0] * 3] * 3` trap
- Visuals: `tree` with the access path lit, `grid` for a list of lists, `refs` for the trap
- Also in: Chapter 8. Lists and Dictionaries; Chapter 9. Tuples, Files, and Everything Else (Built-in Type Gotchas)
- Docs: [Tutorial: nested lists](https://docs.python.org/3/tutorial/datastructures.html#nested-list-comprehensions)

**Mini project:** Contact book (dict of people, each with a list of phone numbers; add, look up, list).

### Unit 7: Functions (py-u7)
Name a piece of work and reuse it. About 3.25 hours (7 lessons + project + review).

**37. py-37 Defining and calling functions**
- Concepts: `def`, calling, the body runs only when called, why functions help
- Visuals: `stack` (a frame pushes on call and pops at the end), jump arrows in the code
- Also in: Chapter 16. Function Basics
- Docs: [Defining functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

**38. py-38 Parameters and arguments**
- Concepts: parameters, positional arguments, several parameters, wrong number of arguments (TypeError)
- Visuals: `stack` with arguments flowing into parameter boxes; `knobs` on the arguments
- Also in: Chapter 16. Function Basics; Chapter 18. Arguments (Argument-Passing Basics)
- Docs: [Defining functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

**39. py-39 return values**
- Concepts: `return`, return vs print, functions give back None by default, early return
- Visuals: `stack` with the return value bubble flying back to the calling line, `expr` for `total = add(2, 3) * 10`
- Also in: Chapter 16. Function Basics
- Docs: [Defining functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions), [The return statement](https://docs.python.org/3/reference/simple_stmts.html#the-return-statement)

**40. py-40 Default and keyword arguments**
- Concepts: default values, keyword arguments, mixing them, the mutable default trap (`def f(items=[])`)
- Visuals: `stack` showing which parameters the caller filled and which used defaults; `refs` for the trap
- Also in: Chapter 18. Arguments (Special Argument-Matching Modes); Chapter 21. The Benchmarking Interlude (Function Gotchas)
- Docs: [Default argument values](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values), [Keyword arguments](https://docs.python.org/3/tutorial/controlflow.html#keyword-arguments)

**41. py-41 Local and global names**
- Concepts: local names vanish after the call, reading a global, UnboundLocalError, the `global` statement (and why to avoid it)
- Visuals: `scope` rings (local inside global), `stack`
- Also in: Chapter 17. Scopes (Python Scope Basics; The global Statement)
- Docs: [Python scopes and namespaces](https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces), [Naming and binding](https://docs.python.org/3/reference/executionmodel.html#naming-and-binding)

**42. py-42 Functions that call functions**
- Concepts: breaking a problem into small functions, several frames on the stack, reading code top-down
- Visuals: `stack` several levels deep, `timeline`
- Also in: Chapter 16. Function Basics; Chapter 19. Advanced Function Topics (Function Design Concepts)
- Docs: [Defining functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

**43. py-43 Returning several values, docstrings and help()**
- Concepts: `return a, b` gives a tuple, unpacking the result, docstrings, `help()`
- Visuals: `stack` with a tuple bubble unpacking into names
- Also in: Chapter 16. Function Basics; Chapter 15. The Documentation Interlude
- Docs: [Documentation strings](https://docs.python.org/3/tutorial/controlflow.html#documentation-strings), [help()](https://docs.python.org/3/builtins/functions.html#help)

**Mini project:** Text statistics (functions for word count, longest word, average length, put together in `main()`).

### Unit 8: Working with collections (py-u8)
The power tools data work uses all the time. About 2.9 hours (6 lessons + project + review).

**44. py-44 enumerate and zip**
- Concepts: `enumerate(items)` and `start=1`, `zip(a, b)`, building a dict with `dict(zip(keys, values))`
- Visuals: `cells` pairing up two lists, index chips, `loop`
- Also in: Chapter 13. while and for Loops (Loop Coding Techniques); Chapter 14. Iterations and Comprehensions
- Docs: [Looping techniques](https://docs.python.org/3/tutorial/datastructures.html#looping-techniques), [zip()](https://docs.python.org/3/builtins/functions.html#zip)

**45. py-45 List comprehensions**
- Concepts: `[x * 2 for x in nums]`, with `if`, the same thing as a loop with `append`
- Visuals: `pipeline` (source → filter gate → transform → result); `knobs` on the condition
- Also in: Chapter 14. Iterations and Comprehensions; Chapter 20. Comprehensions and Generations
- Docs: [List comprehensions](https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions)

**46. py-46 Dict and set comprehensions**
- Concepts: `{k: v for ...}`, `{x for ...}`, flipping a dict, filtering a dict
- Visuals: `pipeline` ending in a `dict` or `venn`
- Also in: Chapter 14. Iterations and Comprehensions; Chapter 20. Comprehensions and Generations (Comprehension Syntax Summary)
- Docs: [Tutorial: dictionaries](https://docs.python.org/3/tutorial/datastructures.html#dictionaries), [Tutorial: sets](https://docs.python.org/3/tutorial/datastructures.html#sets)

**47. py-47 Sorting by a key and lambda**
- Concepts: `sorted(items, key=len)`, `key=lambda r: r["age"]`, `reverse=True`, `min`/`max` with a key
- Visuals: `pipeline` with a key column next to each item, then the items reorder
- Also in: Chapter 19. Advanced Function Topics (Anonymous Functions: lambda); Chapter 18. Arguments (The min Wakeup Call!)
- Docs: [Sorting techniques: key functions](https://docs.python.org/3/howto/sorting.html#key-functions), [Lambda expressions](https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions)

**48. py-48 Functions are values**
- Concepts: a function is an object, passing a function to a function, `map` and `filter`, they give lazy results (`list(...)` to see them)
- Visuals: `refs` (a name pointing to a function object), `pipeline`
- Also in: Chapter 19. Advanced Function Topics (Functional Programming Tools); Chapter 14. Iterations and Comprehensions (New Iterables in Python 3.X)
- Docs: [map()](https://docs.python.org/3/builtins/functions.html#map), [filter()](https://docs.python.org/3/builtins/functions.html#filter)

**49. py-49 Generators: one item at a time**
- Concepts: generator expressions `sum(x * x for x in nums)`, `yield` in a function, values made only when asked, a generator is used up after one pass
- Visuals: `pipeline` conveyor with the generator frame "paused at line N", `stack`
- Also in: Chapter 20. Comprehensions and Generations (Generator Functions and Expressions)
- Docs: [Generators](https://docs.python.org/3/tutorial/classes.html#generators), [Generator expressions](https://docs.python.org/3/tutorial/classes.html#generator-expressions)

**Mini project:** Word frequency counter (clean text, count with a dict, top words with `sorted` and a key).

### Unit 9: Errors and exceptions (py-u9)
Expect problems and handle them. About 2.6 hours (5 lessons + project + review).

**50. py-50 Reading error messages**
- Concepts: traceback parts (file, line, type, message), the most common errors and what they mean, reading from the bottom up
- Visuals: `errorflow` annotated traceback, `stack` unwinding
- Also in: Chapter 33. Exception Basics; Chapter 35. Exception Objects (Built-in Exception Classes); Chapter 15. The Documentation Interlude (Common Coding Gotchas)
- Docs: [Tutorial: errors and exceptions](https://docs.python.org/3/tutorial/errors.html), [Built-in exceptions](https://docs.python.org/3/builtins/exceptions.html)

**51. py-51 try and except**
- Concepts: `try`/`except ValueError`, catching a specific error, `except ... as e`, asking again until the input is valid
- Visuals: `errorflow` (jump from the failing line to the except block), `stdin`
- Also in: Chapter 33. Exception Basics; Chapter 34. Exception Coding Details (The try/except/else Statement)
- Docs: [Handling exceptions](https://docs.python.org/3/tutorial/errors.html#handling-exceptions)

**52. py-52 else and finally**
- Concepts: `else` runs when nothing failed, `finally` always runs, the order of the blocks
- Visuals: `errorflow` path map of try/except/else/finally; `knobs` ("make it fail / make it work")
- Also in: Chapter 34. Exception Coding Details (The try/finally Statement; Unified try/except/finally)
- Docs: [Defining clean-up actions](https://docs.python.org/3/tutorial/errors.html#defining-clean-up-actions)

**53. py-53 raise: your own errors**
- Concepts: `raise ValueError("...")`, checking arguments in a function, errors travelling up to the caller's except
- Visuals: `errorflow` across `stack` frames
- Also in: Chapter 34. Exception Coding Details (The raise Statement)
- Docs: [Raising exceptions](https://docs.python.org/3/tutorial/errors.html#raising-exceptions)

**54. py-54 assert and testing your functions**
- Concepts: `assert`, writing small checks for your own functions, testing edge cases
- Visuals: `tests` checklist
- Also in: Chapter 34. Exception Coding Details (The assert Statement); Chapter 36. Designing with Exceptions (Core Language Summary)
- Docs: [The assert statement](https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement)

**Mini project:** Safe calculator (keeps asking until the input is valid, never crashes).

### Unit 10: Files (py-u10)
Read and save data. About 2.9 hours (6 lessons + project + review). Files live in a small virtual folder inside the browser, so nothing touches the learner's computer.

**55. py-55 Reading a text file**
- Concepts: `open`, `read`, `for line in f`, `strip()` the newline, `readlines`, FileNotFoundError
- Visuals: `files` with a read cursor moving line by line, `loop`
- Also in: Chapter 9. Tuples, Files, and Everything Else (Files); Chapter 14. Iterations and Comprehensions (file iterators)
- Docs: [Reading and writing files](https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files), [Methods of file objects](https://docs.python.org/3/tutorial/inputoutput.html#methods-of-file-objects)

**56. py-56 Writing and appending**
- Concepts: modes `"w"` and `"a"`, `write` does not add a newline, `"w"` wipes the file
- Visuals: `files` with text appearing and the mode badge; `knobs` on the mode
- Also in: Chapter 9. Tuples, Files, and Everything Else (Files)
- Docs: [Reading and writing files](https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files)

**57. py-57 with blocks**
- Concepts: `with open(...) as f`, the file closes by itself, even after an error
- Visuals: `files` open/closed light with the with-block outlined, `errorflow`
- Also in: Chapter 34. Exception Coding Details (with/as Context Managers)
- Docs: [Reading and writing files](https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files), [The with statement](https://docs.python.org/3/reference/compound_stmts.html#the-with-statement)

**58. py-58 Paths and folders: pathlib** (beyond the book)
- Concepts: `Path("notes.txt")`, `read_text` and `write_text`, `exists()`, joining with `/`, `.name`, `.suffix`, `.stem`, listing a folder with `glob("*.csv")`
- Visuals: `files` showing the virtual folder as a tree, with the path being built piece by piece
- Also in: none (pathlib is newer than the book's file chapter)
- Docs: [pathlib basic use](https://docs.python.org/3/library/pathlib.html#basic-use), [pathlib: reading and writing files](https://docs.python.org/3/library/pathlib.html#reading-and-writing-files)

**59. py-59 Table data: CSV**
- Concepts: lines to fields with `split(",")`, the `csv` module reader and writer, converting fields to numbers
- Visuals: `files` lines turning into table rows (`tree`/`grid`)
- Also in: Chapter 9. Tuples, Files, and Everything Else (Files)
- Docs: [csv module](https://docs.python.org/3/library/csv.html)

**60. py-60 Saving structured data: JSON**
- Concepts: `json.dumps` / `json.loads`, `json.dump` / `json.load` with files, what JSON can hold, a word on `pickle`
- Visuals: `tree` on the left, the JSON text in `files` on the right
- Also in: Chapter 9. Tuples, Files, and Everything Else (Files: storing objects)
- Docs: [Saving structured data with json](https://docs.python.org/3/tutorial/inputoutput.html#saving-structured-data-with-json), [json module](https://docs.python.org/3/library/json.html)

**Mini project:** Grade report (read a CSV of scores, compute averages, write a report file).

### Unit 11: Modules (py-u11)
Use code from other files and from Python's library. About 2.6 hours (5 lessons + project + review).

**61. py-61 import**
- Concepts: `import math`, `math.sqrt`, `from math import sqrt`, `import ... as ...`, what an import does
- Visuals: `modules` (a module box with its names, `from` copying one name)
- Also in: Chapter 22. Modules: The Big Picture; Chapter 23. Module Coding Basics; Chapter 25. Advanced Module Topics (The as Extension for import and from)
- Docs: [Tutorial: modules](https://docs.python.org/3/tutorial/modules.html), [math module](https://docs.python.org/3/library/math.html)

**62. py-62 Handy modules: random, math, statistics**
- Concepts: `random.choice`, `random.randint`, `random.seed` (so runs repeat), `statistics.mean`/`median`, `math.floor`/`ceil`
- Visuals: `modules`, `output`; `knobs` on the seed
- Also in: Chapter 5. Numeric Types (Numbers in Action)
- Docs: [random module](https://docs.python.org/3/library/random.html), [statistics module](https://docs.python.org/3/library/statistics.html), [Standard library tour](https://docs.python.org/3/tutorial/stdlib.html)

**63. py-63 Your own module**
- Concepts: two files, importing your own file, a module runs once, `if __name__ == "__main__":`
- Visuals: two file tabs, `modules` showing the module box made on first import
- Also in: Chapter 23. Module Coding Basics; Chapter 25. Advanced Module Topics (Mixed Usage Modes: __name__ and __main__)
- Docs: [Executing modules as scripts](https://docs.python.org/3/tutorial/modules.html#executing-modules-as-scripts)

**64. py-64 Exploring with dir() and help()**
- Concepts: `dir(module)`, `help(function)`, namespaces, finding what a module offers
- Visuals: `modules` namespace listing
- Also in: Chapter 15. The Documentation Interlude; Chapter 23. Module Coding Basics (Module Namespaces)
- Docs: [The dir() function](https://docs.python.org/3/tutorial/modules.html#the-dir-function)

**65. py-65 Installing packages: pip and venv** (beyond the book)
- Concepts: the standard library vs third-party packages (numpy, pandas), what `pip install` does, a virtual environment per project, the real commands for macOS and zsh (`python3 -m venv .venv`, `source .venv/bin/activate`, `pip install pandas`, `pip list`, `deactivate`), and how this site loads packages in the browser instead
- Visuals: `modules` with a "where packages live" diagram (project folder → `.venv` → `site-packages`); a terminal panel replaying each command and its effect. Code that runs in the lesson checks what is installed (`import sys`, `sys.prefix`, `importlib.util.find_spec`); the shell commands are shown, not run
- Also in: none
- Docs: [Virtual environments and packages](https://docs.python.org/3/tutorial/venv.html), [Installing Python modules](https://docs.python.org/3/installing/index.html)

**Mini project:** Dice statistics (roll with a fixed seed, count results, print mean and a text bar chart).

### Unit 12: Classes and objects (py-u12)
Make your own types. pandas and every ML library are built from objects, so this is core. About 2.9 hours (6 lessons + project + review).

**66. py-66 Objects you already use**
- Concepts: everything is an object, methods are functions attached to an object, `type()`, the dot
- Visuals: `objects` (a value box with its type and some methods), `refs`
- Also in: Chapter 4. Introducing Python Object Types; Chapter 26. OOP: The Big Picture
- Docs: [Tutorial: a first look at classes](https://docs.python.org/3/tutorial/classes.html#a-first-look-at-classes)

**67. py-67 Your first class**
- Concepts: `class`, `__init__`, `self`, attributes, making several instances
- Visuals: `objects` (class box, instance boxes with arrows to the class), `stack` showing `self` inside `__init__`
- Also in: Chapter 27. Class Coding Basics; Chapter 28. A More Realistic Example (Step 1: Making Instances)
- Docs: [Class objects](https://docs.python.org/3/tutorial/classes.html#class-objects), [Instance objects](https://docs.python.org/3/tutorial/classes.html#instance-objects)

**68. py-68 Methods**
- Concepts: methods, `self` is the object before the dot, methods that change the object, methods that return values
- Visuals: `objects` with the `self` arrow in the method frame, `stack`
- Also in: Chapter 27. Class Coding Basics; Chapter 28. A More Realistic Example (Step 2: Adding Behavior Methods)
- Docs: [Method objects](https://docs.python.org/3/tutorial/classes.html#method-objects)

**69. py-69 Printing objects: __str__ and __repr__**
- Concepts: why print shows `<... object at 0x...>`, `__str__`, `__repr__`
- Visuals: `objects` → print → text
- Also in: Chapter 30. Operator Overloading (String Representation: __repr__ and __str__); Chapter 28. A More Realistic Example (Step 3: Operator Overloading)
- Docs: [object.__str__](https://docs.python.org/3/reference/datamodel.html#object.__str__), [object.__repr__](https://docs.python.org/3/reference/datamodel.html#object.__repr__)

**70. py-70 Inheritance**
- Concepts: subclasses, overriding a method, `super().__init__`, `isinstance`
- Visuals: `objects` with the lookup path (instance → class → parent) lit
- Also in: Chapter 27. Class Coding Basics; Chapter 28. A More Realistic Example (Steps 4 and 5); Chapter 29. Class Coding Details (Inheritance)
- Docs: [Tutorial: inheritance](https://docs.python.org/3/tutorial/classes.html#inheritance), [super()](https://docs.python.org/3/builtins/functions.html#super)

**71. py-71 Objects inside objects**
- Concepts: composition ("has a" vs "is a"), a list of objects inside an object, choosing between them
- Visuals: `objects` nested, `refs`
- Also in: Chapter 31. Designing with Classes (OOP and Composition: "Has-a" Relationships; OOP and Inheritance: "Is-a" Relationships)
- Docs: [Tutorial: classes](https://docs.python.org/3/tutorial/classes.html)

**Mini project:** Library system (Book and Library classes, borrow and return, a report).

### Core capstone (py-capstone)
A bigger project that uses everything from the core. About 2 hours.

**Expense tracker**
- Classes (`Expense`, `Ledger`), loading and saving a JSON file, custom checks that raise errors on bad data, try/except around file and input problems, and a formatted monthly report with aligned columns and totals per category
- 80 to 150 lines, split into 6 to 8 steps. Each step has its own hidden tests and revealable hints (first a nudge, then a bigger hint, then the step's code)
- Visuals: `objects`, `files`, `errorflow`, `output`
- Counts as finished when every step's tests pass

> After Unit 12 and the capstone the learner is ready for Track 2. The units below are optional.

---

## Advanced units (optional)

### Unit A1: Numbers in depth (py-a1)
About 1.9 hours (3 lessons + project + review).

**72. py-72 Float surprises and exact numbers**
- Concepts: why `0.1 + 0.2` is not `0.3`, `round`, `math.isclose`, `decimal.Decimal` for money, `fractions.Fraction`
- Visuals: `expr` with the exact stored value revealed; `knobs`
- Also in: Chapter 5. Numeric Types (Other Numeric Types)
- Docs: [Floating point arithmetic](https://docs.python.org/3/tutorial/floatingpoint.html), [decimal](https://docs.python.org/3/library/decimal.html), [fractions](https://docs.python.org/3/library/fractions.html)

**73. py-73 Integers: bases and big numbers**
- Concepts: `bin`, `hex`, `oct`, `int("ff", 16)`, ints have no size limit, `divmod`, bool is a kind of int
- Visuals: `bits`; `knobs` on the number
- Also in: Chapter 5. Numeric Types (Numbers in Action)
- Docs: [Integer methods](https://docs.python.org/3/builtins/stdtypes.html#additional-methods-on-integer-types), [bin()](https://docs.python.org/3/builtins/functions.html#bin)

**74. py-74 Bitwise operators**
- Concepts: `& | ^ ~ << >>`, flags packed in one number
- Visuals: `bits` with rows lined up
- Also in: Chapter 5. Numeric Types
- Docs: [Bitwise operations on integers](https://docs.python.org/3/builtins/stdtypes.html#bitwise-operations-on-integer-types)

**Mini project:** Money splitter with Decimal (split a bill fairly, no lost cents).

### Unit A2: Functions in depth (py-a2)
About 2.9 hours (6 lessons + project + review).

**75. py-75 *args and **kwargs**
- Concepts: collecting extra positional and keyword arguments, writing your own `print`-like or `min`-like function
- Visuals: `stack` with extra arguments packing into a tuple and a dict
- Also in: Chapter 18. Arguments (Special Argument-Matching Modes; The min Wakeup Call!; Generalized Set Functions; Emulating the Python 3.X print Function)
- Docs: [Arbitrary argument lists](https://docs.python.org/3/tutorial/controlflow.html#arbitrary-argument-lists)

**76. py-76 Keyword-only arguments and unpacking calls**
- Concepts: `def f(a, *, b)`, `/` positional-only, calling with `f(*items)` and `f(**options)`
- Visuals: `stack` with unpack arrows
- Also in: Chapter 18. Arguments
- Docs: [Special parameters](https://docs.python.org/3/tutorial/controlflow.html#special-parameters), [Unpacking argument lists](https://docs.python.org/3/tutorial/controlflow.html#unpacking-argument-lists)

**77. py-77 Nested functions and closures**
- Concepts: functions inside functions, the enclosing scope, a returned function remembering values, the full LEGB rule
- Visuals: `scope` rings with the enclosing ring kept alive after its call ended
- Also in: Chapter 17. Scopes (Scopes and Nested Functions)
- Docs: [Python scopes and namespaces](https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces)

**78. py-78 nonlocal and keeping state**
- Concepts: `nonlocal`, counters made with closures, other ways to keep state (globals, function attributes, classes)
- Visuals: `scope` with the write path, `history`
- Also in: Chapter 17. Scopes (The nonlocal Statement in 3.X; Why nonlocal? State Retention Options)
- Docs: [The nonlocal statement](https://docs.python.org/3/reference/simple_stmts.html#the-nonlocal-statement)

**79. py-79 Recursion**
- Concepts: a function calling itself, base case, recursion on nested lists, RecursionError, when a loop is better
- Visuals: `calltree` and a deep `stack`; `knobs` on n
- Also in: Chapter 19. Advanced Function Topics (Recursive Functions)
- Docs: [sys.getrecursionlimit()](https://docs.python.org/3/library/sys.html#sys.getrecursionlimit)

**80. py-80 Function objects, annotations and type hints**
- Concepts: `__name__`, `__doc__`, attributes on functions, annotations `def f(x: int) -> str`, type hints are not checked at run time
- Visuals: `objects` for the function object
- Also in: Chapter 19. Advanced Function Topics (Function Objects: Attributes and Annotations)
- Docs: [Function annotations](https://docs.python.org/3/tutorial/controlflow.html#function-annotations)

**Mini project:** Tiny event system (register handler functions, call them with any arguments).

### Unit A3: Iteration in depth (py-a3)
About 2.6 hours (5 lessons + project + review).

**81. py-81 How for really works: iter() and next()**
- Concepts: iterables vs iterators, `iter`, `next`, StopIteration, why a file or a map can only be read once
- Visuals: `pipeline` conveyor with `next()` pulling items
- Also in: Chapter 14. Iterations and Comprehensions (Iterations: A First Look; Other Iteration Contexts)
- Docs: [Tutorial: iterators](https://docs.python.org/3/tutorial/classes.html#iterators), [Glossary: iterator](https://docs.python.org/3/glossary.html#term-iterator)

**82. py-82 Generator functions in depth**
- Concepts: several `yield`s, state kept between calls, endless generators, `send` (lightly)
- Visuals: `pipeline` with a paused generator frame, `stack`
- Also in: Chapter 20. Comprehensions and Generations (Generator Functions and Expressions)
- Docs: [Yield expressions](https://docs.python.org/3/reference/expressions.html#yield-expressions)

**83. py-83 Generator pipelines and yield from**
- Concepts: chaining generators, `yield from`, processing a big file lazily
- Visuals: `pipeline` with several conveyors in a row
- Also in: Chapter 20. Comprehensions and Generations
- Docs: [Functional programming HOWTO: generators](https://docs.python.org/3/howto/functional.html#generators)

**84. py-84 itertools, any, all and reduce**
- Concepts: `any`, `all`, `functools.reduce`, `itertools.count`, `chain`, `islice`, `groupby`
- Visuals: `pipeline`
- Also in: Chapter 19. Advanced Function Topics (Functional Programming Tools); Chapter 14. Iterations and Comprehensions (Other Iteration Topics)
- Docs: [itertools](https://docs.python.org/3/library/itertools.html), [functools.reduce](https://docs.python.org/3/library/functools.html#functools.reduce)

**85. py-85 Measuring speed**
- Concepts: `timeit`, comparing a loop, a comprehension and `map`, why measuring beats guessing
- Visuals: live bar chart measured in the browser. Predict and quiz items ask which is faster in general, never exact times, because timings change every run
- Also in: Chapter 21. The Benchmarking Interlude (Timing Iteration Alternatives; Timing Iterations and Pythons with timeit)
- Docs: [timeit](https://docs.python.org/3/library/timeit.html)

**Mini project:** Log reader (a generator pipeline that filters and counts lines of a big log).

### Unit A4: Modules and packages in depth (py-a4)
About 2.25 hours (4 lessons + project + review).

**86. py-86 How import finds modules**
- Concepts: the module search path `sys.path`, import runs a file once and caches it (`sys.modules`), `__pycache__`, `importlib.reload`
- Visuals: `modules` search path ladder
- Also in: Chapter 22. Modules: The Big Picture (How Imports Work; The Module Search Path; Byte Code Files); Chapter 23. Module Coding Basics (Reloading Modules)
- Docs: [The module search path](https://docs.python.org/3/tutorial/modules.html#the-module-search-path), [importlib.reload](https://docs.python.org/3/library/importlib.html#importlib.reload)

**87. py-87 Packages**
- Concepts: folders of modules, `__init__.py`, dotted imports `from shop.cart import total`
- Visuals: `modules` folder tree
- Also in: Chapter 24. Module Packages (Package Import Basics; Why Use Package Imports?)
- Docs: [Tutorial: packages](https://docs.python.org/3/tutorial/modules.html#packages)

**88. py-88 Relative imports and namespace packages**
- Concepts: `from . import x`, `from .. import y`, packages without `__init__.py`
- Visuals: `modules` folder tree with relative arrows
- Also in: Chapter 24. Module Packages (Package Relative Imports; Python 3.3 Namespace Packages)
- Docs: [Intra-package references](https://docs.python.org/3/tutorial/modules.html#intra-package-references), [Namespace packages](https://docs.python.org/3/reference/import.html#namespace-packages)

**89. py-89 Module design**
- Concepts: `_private` names, `__all__`, modules are objects, `importlib.import_module` by name
- Visuals: `modules` with hidden names greyed
- Also in: Chapter 25. Advanced Module Topics (Data Hiding in Modules; Example: Modules Are Objects; Importing Modules by Name String; Module Gotchas)
- Docs: [Importing * from a package](https://docs.python.org/3/tutorial/modules.html#importing-from-a-package), [importlib.import_module](https://docs.python.org/3/library/importlib.html#importlib.import_module)

**Mini project:** A small package (a `shop` package with two modules and a script that uses it).

### Unit A5: OOP in depth (py-a5)
About 3.25 hours (7 lessons + project + review).

**90. py-90 Class and instance attributes**
- Concepts: attributes on the class shared by all, on the instance just for one, shadowing, namespaces of objects
- Visuals: `objects` with the lookup path
- Also in: Chapter 29. Class Coding Details (The class Statement; Namespaces: The Conclusion; Classes Versus Modules)
- Docs: [Class and instance variables](https://docs.python.org/3/tutorial/classes.html#class-and-instance-variables)

**91. py-91 Operator overloading**
- Concepts: `__add__`, `__eq__`, `__lt__`, `__len__`, `__bool__`, `__radd__`, `__iadd__`
- Visuals: `expr` where `a + b` turns into `a.__add__(b)`, `objects`
- Also in: Chapter 30. Operator Overloading (The Basics; Right-Side and In-Place Uses; Comparisons; Boolean Tests)
- Docs: [Emulating numeric types](https://docs.python.org/3/reference/datamodel.html#emulating-numeric-types), [Rich comparisons](https://docs.python.org/3/reference/datamodel.html#object.__lt__)

**92. py-92 Objects that act like containers**
- Concepts: `__getitem__`, `__setitem__`, `__iter__`/`__next__`, `__contains__`, `__call__`
- Visuals: `cells` for the object, `pipeline` conveyor for iteration
- Also in: Chapter 30. Operator Overloading (Indexing and Slicing; Index Iteration; Iterable Objects; Membership; Call Expressions)
- Docs: [Emulating container types](https://docs.python.org/3/reference/datamodel.html#emulating-container-types)

**93. py-93 Properties, class methods and static methods**
- Concepts: `@property` and setters, `@classmethod` as another constructor, `@staticmethod`, bound methods
- Visuals: `objects` with method kind badges and the property getter arrow
- Also in: Chapter 32. Advanced Class Topics (Static and Class Methods); Chapter 38. Managed Attributes (Properties); Chapter 31. Designing with Classes (Methods Are Objects: Bound or Unbound)
- Docs: [property()](https://docs.python.org/3/builtins/functions.html#property), [classmethod()](https://docs.python.org/3/builtins/functions.html#classmethod)

**94. py-94 Attribute hooks: __getattr__ and __setattr__**
- Concepts: running code when an attribute is missing or set, delegation to a wrapped object (proxy)
- Visuals: `objects` with the fallback hook in the lookup path
- Also in: Chapter 30. Operator Overloading (Attribute Access); Chapter 31. Designing with Classes (OOP and Delegation: "Wrapper" Proxy Objects); Chapter 38. Managed Attributes (__getattr__ and __getattribute__)
- Docs: [Customizing attribute access](https://docs.python.org/3/reference/datamodel.html#customizing-attribute-access)

**95. py-95 Multiple inheritance and super()**
- Concepts: mix-in classes, method resolution order (`__mro__`), how `super()` follows it, abstract base classes
- Visuals: `objects` with the MRO chain lit in order
- Also in: Chapter 31. Designing with Classes (Multiple Inheritance: "Mix-in" Classes); Chapter 32. Advanced Class Topics (The super Built-in Function); Chapter 29. Class Coding Details (Abstract superclasses)
- Docs: [Multiple inheritance](https://docs.python.org/3/tutorial/classes.html#multiple-inheritance), [abc](https://docs.python.org/3/library/abc.html)

**96. py-96 Class design toolbox**
- Concepts: subclassing built-ins (`class Stack(list)`), name mangling `__secret`, `__slots__`, classes as factories, dataclasses as a shortcut
- Visuals: `objects`
- Also in: Chapter 32. Advanced Class Topics (Extending Built-in Types; New-Style Class Extensions; Class Gotchas); Chapter 31. Designing with Classes (Pseudoprivate Class Attributes; Classes Are Objects: Generic Object Factories)
- Docs: [Private variables](https://docs.python.org/3/tutorial/classes.html#private-variables), [dataclasses](https://docs.python.org/3/library/dataclasses.html)

**Mini project:** Vector and Matrix classes with operators (`+`, `*`, `==`, printing, indexing).

### Unit A6: Exceptions in depth (py-a6)
About 1.9 hours (3 lessons + project + review).

**97. py-97 Your own exception classes**
- Concepts: `class OutOfStock(Exception)`, hierarchies, catching a parent class catches its children, order of except blocks
- Visuals: `objects` class tree with the caught branch lit, `errorflow`
- Also in: Chapter 35. Exception Objects (Why Exception Hierarchies?; Built-in Exception Classes)
- Docs: [User-defined exceptions](https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions), [Exception hierarchy](https://docs.python.org/3/builtins/exceptions.html#exception-hierarchy)

**98. py-98 Exception objects and chaining**
- Concepts: `e.args`, custom data and messages on exceptions, `raise ... from ...`, re-raising
- Visuals: `objects` for the exception object, `errorflow`
- Also in: Chapter 35. Exception Objects (Custom Print Displays; Custom Data and Behavior); Chapter 34. Exception Coding Details (The raise Statement)
- Docs: [Exception chaining](https://docs.python.org/3/tutorial/errors.html#exception-chaining)

**99. py-99 Designing with exceptions and context managers**
- Concepts: nested handlers, exceptions as signals (not only errors), writing a context manager with `__enter__`/`__exit__` and `contextlib.contextmanager`
- Visuals: `errorflow` through nested try boxes, `files` open/closed light
- Also in: Chapter 36. Designing with Exceptions (Nesting Exception Handlers; Exception Idioms; Exception Design Tips and Gotchas); Chapter 34. Exception Coding Details (with/as Context Managers)
- Docs: [contextlib](https://docs.python.org/3/library/contextlib.html), [With statement context managers](https://docs.python.org/3/reference/datamodel.html#with-statement-context-managers)

**Mini project:** Order processor (custom errors for each failure, a summary of what worked and what did not).

### Unit A7: Text and bytes (py-a7)
About 2.25 hours (4 lessons + project + review).

**100. py-100 Other formatting styles: format() and %**
- Concepts: `"{} {}".format(a, b)`, `"%s is %d" % (name, age)`, reading older code
- Visuals: `format`
- Also in: Chapter 7. String Fundamentals (String Formatting Expressions; String Formatting Method Calls)
- Docs: [str.format](https://docs.python.org/3/builtins/stdtypes.html#str.format), [printf-style formatting](https://docs.python.org/3/builtins/stdtypes.html#printf-style-string-formatting)

**101. py-101 Unicode: characters and code points**
- Concepts: `ord`, `chr`, code points, `encode` and `decode`, UTF-8 uses 1 to 4 bytes, UnicodeDecodeError
- Visuals: `bytes`; `knobs` on the text
- Also in: Chapter 37. Unicode and Byte Strings (String Basics; Coding Unicode Strings)
- Docs: [Unicode HOWTO](https://docs.python.org/3/howto/unicode.html)

**102. py-102 bytes and bytearray**
- Concepts: `b"..."`, bytes are numbers 0 to 255, bytearray can change
- Visuals: `bytes` cells, `cells`
- Also in: Chapter 37. Unicode and Byte Strings (Using 3.X bytes Objects; Using 3.X/2.6+ bytearray Objects)
- Docs: [Binary sequence types](https://docs.python.org/3/builtins/stdtypes.html#binary-sequence-types-bytes-bytearray-memoryview)

**103. py-103 Text files vs binary files**
- Concepts: `open(..., encoding="utf-8")`, `"rb"`/`"wb"`, why the encoding matters
- Visuals: `files` with a text view and a bytes view side by side
- Also in: Chapter 37. Unicode and Byte Strings (Using Text and Binary Files; Using Unicode Files; Other String Tool Changes in 3.X)
- Docs: [Unicode HOWTO: reading and writing Unicode data](https://docs.python.org/3/howto/unicode.html#reading-and-writing-unicode-data)

**Mini project:** Text inspector (read a file, report characters, bytes and any non-English letters).

### Unit A8: Decorators and metaprogramming (py-a8)
About 2.6 hours (5 lessons + project + review).

**104. py-104 Decorators**
- Concepts: a function that takes a function and returns a new one, the `@` syntax, timing and logging decorators
- Visuals: `wrap` diagram, `stack` passing through the wrapper
- Also in: Chapter 39. Decorators (What's a Decorator?; The Basics; Coding Function Decorators)
- Docs: [Glossary: decorator](https://docs.python.org/3/glossary.html#term-decorator), [Function definitions](https://docs.python.org/3/reference/compound_stmts.html#function-definitions)

**105. py-105 Decorators with arguments and functools.wraps**
- Concepts: a decorator factory (three levels), keeping the name and docstring with `wraps`, validating arguments
- Visuals: `wrap` with three layers
- Also in: Chapter 39. Decorators (Example: Validating Function Arguments)
- Docs: [functools.wraps](https://docs.python.org/3/library/functools.html#functools.wraps)

**106. py-106 Class decorators**
- Concepts: decorating a class, registering classes, adding methods
- Visuals: `wrap`, `objects`
- Also in: Chapter 39. Decorators (Coding Class Decorators; Managing Functions and Classes Directly; Example: "Private" and "Public" Attributes)
- Docs: [Class definitions](https://docs.python.org/3/reference/compound_stmts.html#class-definitions)

**107. py-107 Descriptors and __getattribute__**
- Concepts: how `property` works underneath, `__get__`/`__set__`, validated attributes, `__getattribute__` and its loop trap
- Visuals: `objects` with the lookup path through the descriptor
- Also in: Chapter 38. Managed Attributes (Descriptors; __getattr__ and __getattribute__; Example: Attribute Validations)
- Docs: [Descriptor HOWTO](https://docs.python.org/3/howto/descriptor.html)

**108. py-108 Metaclasses**
- Concepts: classes are objects made by `type`, `type(name, bases, dict)`, a simple metaclass, when not to use one
- Visuals: `objects` chain type → class → instance
- Also in: Chapter 40. Metaclasses
- Docs: [Metaclasses](https://docs.python.org/3/reference/datamodel.html#metaclasses)

**Mini project:** Plugin registry (a class decorator and a validated attribute).

### Unit A9: Async basics (py-a9)
Beyond the book. About 1.5 hours (2 lessons + project + review).

**109. py-109 Coroutines: async def and await**
- Concepts: what "waiting without blocking" means, `async def`, `await`, `asyncio.run`, `asyncio.sleep`, a coroutine does nothing until awaited
- Visuals: `stack` with a paused coroutine frame and an event loop lane showing who is waiting and who is running
- Also in: none (async arrived after the book)
- Docs: [Coroutines and tasks](https://docs.python.org/3/library/asyncio-task.html#coroutines), [Awaitables](https://docs.python.org/3/library/asyncio-task.html#awaitables)

**110. py-110 Running tasks together: asyncio.gather**
- Concepts: `asyncio.gather`, tasks taking turns, results come back in order, when async helps (waiting on networks and files) and when it does not (heavy math)
- Visuals: event loop lanes, one per task, with turns marked on the `timeline`
- Also in: none
- Docs: [Running tasks concurrently](https://docs.python.org/3/library/asyncio-task.html#running-tasks-concurrently), [asyncio](https://docs.python.org/3/library/asyncio.html)
- Note: the browser runs Python on a different event loop, so this unit is checked against Pyodide before it is written. If `asyncio.run` does not work there, the lessons use the browser's own loop and say so

**Mini project:** Fake downloader (several "downloads" that sleep for different times, run together, report in order).

---

## Coverage table: every chapter of Learning Python

| Book chapter | Covered by | Notes |
|---|---|---|
| Preface | skipped | About the book itself |
| Ch 1. A Python Q&A Session | Track intro text | Why Python, in two sentences on the track page. No code to practise |
| Ch 2. How Python Runs Programs | py-02 | Byte code and implementations (PyPy, Jython) skipped as not useful to a beginner; `__pycache__` in py-86 |
| Ch 3. How You Run Programs | py-02, py-63 | The `>>>` prompt and `python3 file.py` in py-02; imports in py-63, reload in py-86. Skipped: Windows file clicking, IDLE and other IDEs, `exec` (the site is the editor; `exec` is risky and rare) |
| Ch 4. Introducing Python Object Types | py-06, py-26, py-35, py-66 | A quick tour in the book; each type gets its own lesson here |
| Ch 5. Numeric Types | py-03, py-06, py-08, py-35, py-62, py-72, py-73, py-74 | Skipped: complex numbers (rare outside engineering; Track 2 meets them if needed), numeric extensions (that is NumPy, Track 2) |
| Ch 6. The Dynamic Typing Interlude | py-01, py-04, py-23, py-30 | Shared references are the star of py-30. Garbage collection gets one sentence, no lesson |
| Ch 7. String Fundamentals | py-05, py-20 to py-25, py-31, py-100 | f-strings first (py-25); `%` and `.format` later (py-100) |
| Ch 8. Lists and Dictionaries | py-26 to py-29, py-33, py-34, py-36 | |
| Ch 9. Tuples, Files, and Everything Else | py-12, py-30, py-32, py-36, py-55 to py-57, py-59, py-60 | Includes the built-in type gotchas (py-30, py-36) and storing objects (json, pickle in py-60) |
| Ch 10. Introducing Python Statements | py-02, py-07, py-09 | Statement syntax and indentation, the interactive loop example |
| Ch 11. Assignments, Expressions, and Prints | py-01, py-04, py-25, py-32 | Naming rules py-04, print options py-25, sequence and extended unpacking py-32 |
| Ch 12. if Tests and Syntax Rules | py-08 to py-10, py-12, py-13 | |
| Ch 13. while and for Loops | py-14 to py-17, py-19, py-20, py-28, py-44 | |
| Ch 14. Iterations and Comprehensions | py-15, py-44, py-45, py-48, py-55, py-81, py-84 | |
| Ch 15. The Documentation Interlude | py-43, py-64, mistakes steps | `#` comments py-02, docstrings py-43, `dir`/`help` py-64; the "common coding gotchas" feed the Common mistakes steps. Skipped: PyDoc HTML server and Sphinx (tools, not language) |
| Ch 16. Function Basics | py-37 to py-39, py-42, py-43 | |
| Ch 17. Scopes | py-41, py-77, py-78 | |
| Ch 18. Arguments | py-38, py-40, py-47, py-75, py-76 | The book's example programs (min, set functions, print emulation) become Make tasks in py-75 |
| Ch 19. Advanced Function Topics | py-42, py-47, py-48, py-79, py-80, py-84 | |
| Ch 20. Comprehensions and Generations | py-45, py-46, py-49, py-82, py-83 | |
| Ch 21. The Benchmarking Interlude | py-40, py-85 | Function gotchas (mutable defaults) in py-40. Skipped: pystones and comparing Python implementations (not useful to a beginner) |
| Ch 22. Modules: The Big Picture | py-61, py-86 | |
| Ch 23. Module Coding Basics | py-61, py-63, py-64, py-86 | |
| Ch 24. Module Packages | py-87, py-88 | |
| Ch 25. Advanced Module Topics | py-61, py-63, py-89 | Skipped: `__future__` (a Python 2 era tool), transitive reloads (rarely needed) |
| Ch 26. OOP: The Big Picture | py-66 | |
| Ch 27. Class Coding Basics | py-67, py-68, py-70 | |
| Ch 28. A More Realistic Example | py-67 to py-71 | Its steps map to lessons. Step 7 (shelve database) skipped in favour of json in py-60; introspection tools in py-66 |
| Ch 29. Class Coding Details | py-70, py-90, py-95 | Docstrings revisited py-43 |
| Ch 30. Operator Overloading | py-69, py-91, py-92, py-94 | Skipped: `__del__` (runs at unpredictable times, rarely the right tool; a one-line note in py-96) |
| Ch 31. Designing with Classes | py-71, py-93, py-94, py-95, py-96 | |
| Ch 32. Advanced Class Topics | py-93, py-95, py-96 | Skipped: the Python 2 "classic vs new-style" class history (all classes are new-style in Python 3) |
| Ch 33. Exception Basics | py-50, py-51 | |
| Ch 34. Exception Coding Details | py-51 to py-54, py-57, py-98, py-99 | |
| Ch 35. Exception Objects | py-50, py-97, py-98 | |
| Ch 36. Designing with Exceptions | py-54, py-99 | The language summary's testing tools: `assert` checks in py-54 |
| Ch 37. Unicode and Byte Strings | py-101 to py-103 | Python 2 string differences skipped |
| Ch 38. Managed Attributes | py-93, py-94, py-107 | |
| Ch 39. Decorators | py-104 to py-106 | |
| Ch 40. Metaclasses | py-108 | |
| Ch 41. All Good Things | skipped | Closing thoughts, no new language content. The track's last page links to Track 2 instead |
| Appendix A. Installation and Configuration | py-02 aside | Short "run Python on your Mac" aside. Full setup is not needed because the course runs in the browser |
| Appendix B. The Python 3.3 Windows Launcher | skipped | Windows only |
| Appendix C. Python Changes and This Book | skipped | Python 2 history; the course is Python 3 only |
| Appendix D. Solutions to End-of-Part Exercises | skipped | The book's own exercises; all course exercises are original |

## Beyond the book

Modern Python that *Learning Python* (2013, Python 3.3) does not cover. The site runs Python 3.14 in Pyodide.

| Topic | Python version | Covered by | Docs |
|---|---|---|---|
| `match` / `case` | 3.10 | py-11 | [Tutorial: match statements](https://docs.python.org/3/tutorial/controlflow.html#match-statements) |
| Walrus `:=` | 3.8 | py-18 | [Assignment expressions](https://docs.python.org/3/reference/expressions.html#assignment-expressions) |
| f-strings | 3.6 | py-25 | [Formatted string literals](https://docs.python.org/3/tutorial/inputoutput.html#formatted-string-literals) |
| `f"{x=}"` debugging | 3.8 | py-25 | [f-strings reference](https://docs.python.org/3/reference/lexical_analysis.html#f-strings) |
| `pathlib` | 3.4 | py-58 | [pathlib](https://docs.python.org/3/library/pathlib.html) |
| pip and venv | 3.3 / 3.4 | py-65 | [Virtual environments and packages](https://docs.python.org/3/tutorial/venv.html) |
| Positional-only `/` | 3.8 | py-76 | [Special parameters](https://docs.python.org/3/tutorial/controlflow.html#special-parameters) |
| Type hints | 3.5 | py-80 | [Function annotations](https://docs.python.org/3/tutorial/controlflow.html#function-annotations) |
| dataclasses | 3.7 | py-96 | [dataclasses](https://docs.python.org/3/library/dataclasses.html) |
| async / await | 3.5 | py-109, py-110 | [Coroutines and tasks](https://docs.python.org/3/library/asyncio-task.html#coroutines) |
| Dicts keep insertion order | 3.7 | py-33, py-34 | [Mapping types](https://docs.python.org/3/builtins/stdtypes.html#typesmapping) |

## Decisions (approved by Adi)

- All 71 core lessons stay core.
- `input()` lessons use an input tape filled by the lesson, plus a box to type your own answers when you run code yourself.
- File lessons use a small virtual folder in the browser.
- Both tracers are upgraded to the full new trace format before Unit 1. Visuals are built just in time.
