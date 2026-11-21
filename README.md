# TraceType

Learn Python by **typing over real code** while a side panel shows what each line does.

Live site: https://adityadev12.github.io/tracetype/

Every lesson has four modes:

1. **Learn**: step through the code line by line and watch variables and output change.
2. **Trace**: type over faded code in a real editor (arrow keys, mouse, undo, auto-closing brackets and quotes). Wrong characters turn red. Enter checks the line.
3. **Recall**: the code is hidden and each line shows a task. Write it from memory. Peeking is allowed but counted.
4. **Quiz**: a few multiple choice questions, each with a short explanation.

Progress is saved in your browser (`localStorage`).

## Run it locally

Needs Node 20+ and Python 3.

```sh
npm install
npm run dev        # http://localhost:5173/tracetype/
```

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Unit tests (typing engine, trace stepping, syntax colors, lesson schema) |
| `npm run test:e2e` | Browser tests with Playwright (run `npm run build` first) |
| `npm run check-links` | Opens every "Read more" link and checks the page and #section exist (needs internet) |
| `npm run validate` | Checks every lesson file against the schema |
| `npm run lint` | ESLint |
| `npm run build` | Production build into `dist/` |
| `npm run trace -- <lesson.json>` | Runs a lesson's code and writes its `trace` (use `--all` for every lesson) |

Pushing to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## Add a lesson

1. Create `content/lessons/<track>/<id>.json`, where the file name matches `id`. Copy an existing lesson as a starting point.
2. Fill in `title`, `summary`, `intro`, `links`, `bookRefs`, and the `lines` (each with `code`, `explain` and `task`), plus 3 to 5 `quiz` questions. Leave `trace` as `[]` and `traceHash` as `""`.
3. Generate the trace from a real run of the code:
   ```sh
   npm run trace -- content/lessons/<track>/<id>.json
   ```
   Never edit `trace` by hand. If you change any `code` later, run this again. `npm run validate` fails if the trace is out of date.
4. Run `npm run validate` and `npm run check-links`, then check the lesson in `npm run dev`.

`links` are free official pages (mainly docs.python.org) shown as "Read more". Only add a URL after opening it and confirming it covers the topic. `bookRefs` hold book chapter titles only and are shown as small "Also in" text.

Text in `intro`, `explain`, `task` and quiz fields supports `**bold**` and `` `code` ``. Blank lines in `intro` start a new paragraph.

### Lesson format

```json
{
  "id": "py-01-variables",
  "track": "python-basics",
  "order": 1,
  "title": "Variables and print",
  "summary": "One line shown on the lesson list.",
  "intro": "Shown at the top of Learn mode.",
  "links": [{ "title": "Python tutorial: numbers and variables", "url": "https://docs.python.org/3/tutorial/introduction.html#numbers" }],
  "bookRefs": [{ "book": "learning-python", "chapter": "Chapter title" }],
  "visual": "memory",
  "lines": [{ "code": "x = 1", "explain": "...", "task": "..." }],
  "quiz": [{ "q": "...", "options": ["a", "b"], "answer": 0, "why": "..." }],
  "trace": [{ "line": 1, "vars": { "x": { "repr": "1", "type": "int" } }, "stdout": "" }],
  "traceHash": "written by trace_lesson.py"
}
```

## Project layout

```
content/          lessons (JSON), tracks.json, syllabus and topic notes
scripts/          trace_lesson.py, validate_lessons.ts
src/engine/       pure logic: typing, trace stepping, syntax colors, schema checks
src/components/   pages and mode views
src/visuals/      memory and output panels
```

Reference books are kept locally in `books/`, which is git-ignored and never committed.
