# TraceType

Learn Python by **typing over real code** while a side panel shows what each line does.

Live site: https://adityadev12.github.io/tracetype/

Every lesson walks through the same steps: an intro, predict then run, three worked examples (step through, then type over), investigate, fill the blanks, put lines in order, fix a bug, modify code, write an example from memory, make your own program, a quiz, and common mistakes. Code is checked by real Python running in your browser (Pyodide in a Web Worker).

Finished exercises come back for review after 1, 3, 7, 14, 30 and 60 days. Progress, XP and streaks are saved in your browser (`localStorage`) and can be exported and imported in Settings.

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
| `npm run trace -- <file.json>` | Runs every program in a lesson and writes its generated data (use `--all` for everything) |

Pushing to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## Add a lesson

Lessons use format v2 (see docs/PLAN.md section 3 and `src/engine/types.ts`). Copy `content/lessons/python/py-01-variables.json` as a starting point.

1. Write the authored fields: intro, predict, examples, investigate, faded, parsons, fix, modify, recall, make, quiz, mistakes, links and bookRefs. Leave out every `gen` field.
2. Add the lesson id to its unit in `content/units/<track>.json`.
3. Generate everything that comes from running code:
   ```sh
   npm run trace -- content/lessons/python/<id>.json
   ```
   This runs every program with the same runtime the browser uses (`src/languages/python/runtime.py`) and writes the `gen` fields. It also refuses exercises that do not make sense (a bug that does not fail its tests, a solution that does not pass, a predict answer that is not the real output). Never edit `gen` by hand.
4. Run `npm run validate` (checks minimum counts per step and that no generated data is stale) and `npm run check-links`.

## Project layout

```
content/          tracks.json, units/, lessons/, projects/, demos/, notes/
scripts/          trace_lesson.py, validate_lessons.ts, check_links.ts, brand/
src/engine/       language neutral logic: types, validation, grading, typing, traces
src/languages/    language packs (Python: coloring, runtime.py, Pyodide worker, errors)
src/lesson/       lesson page and every exercise type
src/pages/        dashboard, course, track tree, review, project, settings
src/landing/      landing page and the live hero demo
src/design/       terminal panels, the tutor's hand-drawn pen, memory boxes
src/progress/     progress, XP, streak, review scheduling, export and import
e2e/              browser tests (Playwright), including a full lesson with real Python
```

Reference books are kept locally in `books/`, which is git-ignored and never committed.

## License

- Code: [MIT](LICENSE).
- Lesson content in `content/` (lessons, projects, notes, syllabus): [CC BY 4.0](LICENSE-CONTENT). You may share and adapt it, with credit to TraceType.
