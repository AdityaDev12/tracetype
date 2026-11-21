# TraceType: Project Plan

Learn Python, data analysis and ML by **typing over real code** while a side panel shows what each line does.

Every lesson follows the same loop:

1. **Learn**: read a short intro, step through the code line by line, and watch the visual panel change.
2. **Trace**: type over faded "ghost" code. Correct characters turn normal, wrong ones turn red. Enter moves to the next line once it matches.
3. **Recall**: the code is hidden. Each line shows only a task ("Store 22 in age"). Write it from memory. Peek is allowed but counted.
4. **Quiz**: 3 to 5 multiple choice questions, one at a time, each with a one-line "why".

Target learner: a complete beginner (no Python yet). Plain language, short lessons, no jargon without explaining it.

---

## Tech stack

| Part | Choice |
|---|---|
| App | React + TypeScript + Vite |
| Routing | Hash routing (`#/lesson/py-01`) so GitHub Pages works without server config |
| Styling | Plain CSS modules or one global CSS file with CSS variables (dark theme) |
| Code font | JetBrains Mono (Google Fonts) |
| Tests | Vitest |
| Python in browser (Milestone 3) | Pyodide, loaded lazily from the jsDelivr CDN only when needed |
| Lesson trace generation | Local Python 3 script (`scripts/trace_lesson.py`) |
| Hosting | GitHub Pages, deployed by GitHub Actions on every push to `main` |
| Progress | `localStorage` (wrapped in try/catch, app must work without it) |

Vite `base` must be `/tracetype/` for GitHub Pages.

---

## Repo structure

```
tracetype/
  books/                  # reference PDFs, git-ignored, NEVER committed
  prototype/index.html    # optional: the original single-file prototype, for UI reference
  content/
    syllabus.md           # full course outline, built from the books' tables of contents
    lessons/
      python-basics/
        py-01-variables.json
        ...
  scripts/
    trace_lesson.py       # runs a lesson's code and writes the "trace" field
    validate_lessons.ts   # checks every lesson JSON against the schema
  src/
    engine/               # pure logic: typing state, scoring, WPM, trace stepping
    components/           # Editor, ExplainBox, ModeTabs, Quiz, LessonList, ...
    visuals/              # MemoryPanel, OutputPanel (more visual types later)
    pyodide/              # Milestone 3: loader + runner
    App.tsx
  .github/workflows/deploy.yml
  PLAN.md
  CLAUDE.md
  README.md
```

---

## Lesson format

One JSON file per lesson. Authors write `code`, `explain`, `task` and `quiz`. The `trace` field is **generated** by `scripts/trace_lesson.py`, never written by hand, so every value shown on screen comes from a real run.

```json
{
  "id": "py-01-variables",
  "track": "python-basics",
  "order": 1,
  "title": "Variables and print",
  "summary": "Store values in named boxes and show them on screen.",
  "intro": "A **variable** is a labeled box that stores a value...",
  "links": [
    { "title": "Python tutorial: numbers and variables", "url": "https://docs.python.org/3/tutorial/introduction.html#numbers" }
  ],
  "bookRefs": [
    { "book": "learning-python", "chapter": "<chapter title copied from the book's table of contents>" }
  ],
  "visual": "memory",
  "lines": [
    {
      "code": "name = \"Adi\"",
      "explain": "Makes a box called **name** and puts the text \"Adi\" inside...",
      "task": "Store the text Adi in a variable called name."
    }
  ],
  "quiz": [
    {
      "q": "After `x = 5` then `print(x + 2)`, what is stored in x?",
      "options": ["5", "7", "2", "Error"],
      "answer": 0,
      "why": "print only shows 7. Nothing was saved back into x."
    }
  ],
  "trace": [
    { "line": 1, "vars": { "name": { "repr": "'Adi'", "type": "str" } }, "stdout": "" }
  ]
}
```

Rules for `links` and `bookRefs`:
- `links` (required, at least one): free official pages that cover the same topic, mainly docs.python.org. Shown as "Read more". Only use URLs that were opened and confirmed to exist and match the topic (`npm run check-links`).
- `bookRefs`: chapter titles only, shown as small "Also in" text.

Rules for `trace`:
- One entry per **executed** step, in execution order (a loop body appears once per iteration).
- `vars` is the full set of user variables **after** that step ran.
- `stdout` is only the new text that step printed.
- Learn mode steps through `trace` (execution order). Trace and Recall modes go through `lines` (source order). Both are needed once loops appear.

---

## Milestone 1: Engine

Goal: the full app shell working end to end with **one** lesson (variables and print), deployed live.

- [x] Vite + React + TS project, ESLint, Vitest
- [x] Lesson loader + schema validation script (`npm run validate`)
- [x] `scripts/trace_lesson.py`: reads a lesson JSON, runs the code with `sys.settrace`, captures variables and stdout per executed line, writes `trace` back into the file
- [x] Home page: track list and lesson list with completion checkmarks
- [x] Lesson page layout: editor + explain box on the left, visual panel on the right, stacks on mobile
- [x] **Learn** mode: step forward/back (buttons and arrow keys), current line highlighted, explanation for that step
- [x] **Trace** mode: ghost text, red wrong chars, Backspace, Enter to submit a line, auto-indent next line, Tab = 4 spaces, shake + message on a wrong submit
- [x] **Recall** mode: hidden code, task shown, Peek (1.5 s, counted)
- [x] **Quiz** mode: one question at a time, right/wrong colors, "why" line, score at the end
- [x] Stats: WPM, accuracy, line X/Y, peeks
- [x] Memory panel (variable boxes with name, value, type, "was X" when changed, highlight on change) and Output panel
- [x] Syntax coloring for Python (strings, numbers, keywords, builtins, operators)
- [x] Progress saved per lesson per mode in `localStorage`
- [x] Unit tests for the typing engine (correct/wrong chars, backspace, submit, accuracy, WPM)
- [x] GitHub Actions workflow that builds and deploys to Pages
- [x] README: what it is, how to run locally, how to add a lesson
- [x] Commit + push, confirm the live site loads

**Done when:** lesson 1 works in all 4 modes on the live GitHub Pages URL, tests pass.

---

## Milestone 2: Python basics track

Goal: a complete beginner track, roughly 8 to 12 lessons.

- [ ] Read the **tables of contents** of all 4 books. Write `content/syllabus.md` covering the whole course (basics, then data, then ML), with each lesson mapped to chapter titles from the books.
- [ ] For each basics topic: read the matching *Learning Python* chapter(s), write `content/notes/<topic>.md` in your own words, then write the lessons from the notes.
- [ ] Python basics lessons, in roughly this order (adjust to the syllabus): variables and print, numbers and math, strings, lists, if/else, for loops, while loops, functions, dictionaries, a mini project that combines them
- [ ] Each lesson: 6 to 15 lines of **original** code, an explanation per line, a task per line, 3 to 5 quiz questions
- [ ] Run `trace_lesson.py` on every lesson, then `npm run validate`
- [ ] "Next lesson" button at the end of each quiz, lessons unlock in order (but allow skipping)
- [ ] Commit + push

**Done when:** all basics lessons are live, traced, validated, and playable in order.

---

## Milestone 3: Real Python in the browser

Goal: run actual Python on the page with Pyodide.

- [ ] Lazy-load Pyodide only when a user first needs it, with a loading indicator
- [ ] In-browser tracer (same idea as `trace_lesson.py`) that returns the same `trace` shape, so the existing Memory/Output panels render it
- [ ] **Recall** mode: after finishing, a "Run my code" button runs what the user typed and shows real variables/output. Compare against the lesson's expected final output and say if it matches
- [ ] New **Playground** mode per lesson: the lesson code in an editable box, a Run button, the visual panel updates from the real run. Users can change values and see what happens
- [ ] Errors show the Python error message in plain words (e.g. NameError: "you used a name that does not exist yet")
- [ ] Time limit on runs so an infinite loop cannot freeze the page (run Pyodide in a Web Worker)
- [ ] If Pyodide fails to load, the rest of the site still works and the Run buttons explain why
- [ ] Commit + push

**Done when:** a user can type their own version of a lesson in Recall or Playground, run it, and see real variables and output.

---

## Later milestones (roadmap, not now)

- **M4: NumPy + pandas track** (from *Python for Data Analysis*): new visuals for arrays (grid of boxes) and DataFrames (table with highlighted rows/columns)
- **M5: ML from scratch track** (from *Data Science from Scratch*): vectors, linear regression, loss, gradient descent, a single neuron, a tiny neural network, backprop. Visuals: scatter plot + fitted line, loss curve, network diagram
- **M6: Real ML tools track** (from *Hands-On Machine Learning*): scikit-learn and Keras versions of what was built by hand
- Spaced repetition (bring back lessons you are forgetting), daily streak, lesson editor UI, light theme

---

## Content rules (apply to every lesson)

- The books are read chapter by chapter to understand each topic deeply, then lessons are written from Claude's own notes.
- Never copy text, code examples, exercises, or datasets from the books. Write everything original.
- Never quote the books in lessons. `bookRefs` contains only chapter titles, so the learner knows where to read more.
- Plain words, short sentences, no em dashes.
- One new idea per lesson. If a line needs a concept that has not been taught yet, change the code or add a lesson before it.
