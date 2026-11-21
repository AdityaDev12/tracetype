# TraceType: Universal Platform Plan (future, not now)

Status: **idea for later.** Finish the Python to ML course (PLAN.md, Milestones 1 to 6) first. This file exists so the design stays open for it.

## Goal

One platform where anyone can learn **any topic that is learned by writing and memorizing**, using the same loop:

**Learn → Trace → Recall → Quiz**, with a visual panel showing what each line does.

Examples beyond Python:
- Other programming languages: JavaScript, SQL, C, C++, Java, Haskell
- Command line: Linux/zsh commands, git
- Non-code: math formulas, definitions, language vocabulary

## Rules to follow NOW so this stays possible later

These cost almost nothing today and avoid a rewrite later:

- [ ] Keep the engine **topic-agnostic**: `src/engine/` must not assume Python. Language-specific parts (syntax coloring, running code, tracing) go behind a small interface.
- [ ] Every lesson declares its language: add a `"language": "python"` field to the lesson format.
- [ ] Every track has a `tracks.json` entry with id, title, language, description, so new tracks appear without code changes.
- [ ] Visual panels are chosen by the lesson's `"visual"` field, never hardcoded per page.
- [ ] Nothing in the UI text says "Python" except inside Python lessons.

## Architecture for multiple languages

Each language gets a **language pack**:

| Part | What it does |
|---|---|
| `highlight` | Syntax coloring rules |
| `tracer` (offline) | Script that runs lesson code and writes the `trace` field |
| `runner` (in browser, optional) | Runs user code live for Recall and Playground |
| `visuals` | Extra panels the language needs (e.g. memory/pointers for C, tables for SQL) |

Lessons without a live runner still work fully: Learn, Trace, Recall and Quiz use the pre-generated trace. The live runner is a bonus.

### Language runners (to research when the time comes)

| Language | In-browser runner | Difficulty |
|---|---|---|
| Python | Pyodide (already planned in M3) | Done by then |
| JavaScript | Native in the browser, in a Web Worker | Easy |
| SQL | SQLite compiled to WebAssembly (e.g. sql.js) | Easy to medium |
| C / C++ | Needs research (WebAssembly-based options) | Hard |
| Java | Needs research | Hard |
| Haskell | Needs research | Hard |
| Non-code topics | No runner needed | Easy |

Do not pick a C/C++/Java/Haskell runner until it has been tested. Offline traces work without one.

## Community contributions

- [ ] `CONTRIBUTING.md`: how to write a lesson, run the tracer, run `npm run validate`, open a pull request
- [ ] Lesson template file per language
- [ ] GitHub Actions check on every pull request: build, tests, lesson validation
- [ ] Content rule for contributors: original work only, no copied book text or code
- [ ] Later: a lesson editor UI in the site so non-coders can write lessons without touching JSON

## Licensing (decide before inviting contributors)

- Code: an open source license (e.g. MIT)
- Lessons: a content license (e.g. a Creative Commons license) so others can reuse and share them
- Decide this with care before the first outside contribution, since changing it later is hard

## Users at scale (only if people actually use it)

- Accounts + progress sync across devices (needs a backend or a hosted auth/database service)
- Search and filter tracks by language and level
- Spaced repetition across all tracks
- Translations of lesson text (UI strings kept in one file from the start makes this easier)
- Analytics on which lines people get wrong most, to improve lessons

## Suggested order

1. Finish Python → ML (PLAN.md)
2. Refactor into language packs, add `language` + `tracks.json` if not already done
3. Add **JavaScript** and **SQL** tracks (easiest runners)
4. Add license + CONTRIBUTING.md, open to contributors
5. Add a non-code track (e.g. Linux commands) to prove it works beyond programming
6. Harder languages (C, Java, Haskell) once a runner is tested
7. Accounts, sync, lesson editor if there is real demand
