# CLAUDE.md: rules for working on TraceType

Read `docs/PLAN.md` first. It has the full design, the lesson format and the milestone checklists.

## Owner
Aditya Dev (Adi). Python beginner, so lesson content must be beginner level. macOS (M2 Pro), zsh.

## Books (very important)
- Reference books live in `books/`. That folder is git-ignored and must **never** be committed or pushed.
  - `books/learning-python.pdf` (Lutz)
  - `books/python-for-data-analysis.pdf` (McKinney)
  - `books/data-science-from-scratch.pdf` (Grus)
  - `books/hands-on-ml.pdf` (Geron)
- Start with each book's table of contents to build `content/syllabus.md` (overall topic order).
- Then read chapter by chapter, just in time: before writing lessons on a topic, read the matching chapter(s) fully. Do not read whole books up front.
- Write your own notes first in `content/notes/<topic>.md`: key ideas, common beginner mistakes, what order to teach things. Your own words only.
- Then write the lessons from your notes. All code, explanations, tasks and quizzes must be original.
- Never copy or closely paraphrase the books' text, code, exercises or datasets. Never quote them.
- In lessons, `bookRefs` may contain chapter titles only, so the learner knows where to read more.

## Don't make things up
- Every value in a lesson's `trace` must come from `scripts/trace_lesson.py` (or the Pyodide tracer), never typed by hand.
- If you are unsure about a Python behavior, run it with `python3` and check before writing an explanation.
- If something in docs/PLAN.md is unclear or seems wrong, ask Adi instead of guessing.

## Git
- Branch: `main`. Remote: `origin` (github.com/AdityaDev12/tracetype).
- Before **every** commit run `git status` and confirm nothing under `books/` is staged.
- Commit at the end of each milestone (smaller commits inside a milestone are fine). Clear messages, e.g. `M1: typing engine + trace mode`.
- Push to `origin main` after each milestone.
- Never force-push. Never rewrite history.
- Never add Co-Authored-By or 'Generated with Claude Code' lines to commit messages or PRs.

## Quality bar before each commit
- `npm run build` passes
- `npm test` passes
- `npm run validate` passes (once it exists)
- If you can, start the dev server and check the page loads without console errors

## Working style
- Work milestone by milestone, in order, ticking checkboxes in docs/PLAN.md as you go.
- At the **end of each milestone**: commit, push, then STOP and tell Adi in a short message what was built, the live URL, and 3 to 5 things to test. Wait for him to say "continue" before starting the next milestone.
- Keep the UI clean, dark theme, readable on a laptop and on a phone.
- No em dashes anywhere (UI text, lessons, README, commit messages).
