# TraceType: Project Plan (v2)

Learn Python, data analysis and ML by **reading, predicting, typing and writing real code** while a side panel shows what every line does.

This is v2 of the plan. v1 (Milestone 1 and the two fixes) is done and live. v2 replaces the old Milestones 2 and 3 with a stronger lesson design, so lessons are built **once, completely**, and never need to be revisited to add more practice.

---

## 1. Course structure: 4 tracks, learned in order

| # | Track | Main book | Status |
|---|---|---|---|
| 1 | **Python** | *Learning Python* (Lutz) | Build fully now |
| 2 | **Python for Data Analysis** (NumPy, pandas, plotting) | *Python for Data Analysis* (McKinney) | Coming soon |
| 3 | **Data Science from Scratch** (math, stats, ML built by hand) | *Data Science from Scratch* (Grus) | Coming soon |
| 4 | **Hands-On Machine Learning** (scikit-learn, Keras) | *Hands-On ML* (Geron) | Coming soon |

Why this order: language first, then the data tools, then how ML works from scratch using those tools, then the real ML frameworks.

- The home page shows all 4 tracks from day 1. Tracks 2 to 4 show "Coming soon" with a one-line description.
- Each track is made of **units**, and each unit is made of **lessons**. Each unit ends with a **mini project** and a **unit review**.
- Lessons have a recommended order. Next lessons are highlighted, but nothing is hard-locked: the learner can skip ahead.

---

## 2. Teaching method (research-based)

The lesson design combines four well-studied ideas:

1. **PRIMM** (Predict, Run, Investigate, Modify, Make), a lesson structure from computing education research (Sentance and Waite). Read and predict code before writing it, then change it, then write new code.
2. **Worked examples and fading**: show complete examples first, then examples with parts blanked out, then a blank page. Trace and Recall already do this.
3. **Faded Parsons problems** (Weinman, Fox, Hearst, CHI 2021): put shuffled lines in order and fill in blanks. Low friction, and found to build code-writing skill.
4. **Spaced, interleaved retrieval practice**: things learned come back for review after growing gaps, mixed with other topics, instead of being studied once.

Plus one product lesson from **Execute Program**: machine grading creates annoying false failures from harmless typos. So:
- Wrong tries never count as failing. Retry as many times as you want.
- After 2 wrong tries a "Show answer" button appears. Only using it ("giving up") marks the item as weak, so it comes back for review sooner.
- Code is checked by **meaning, not formatting** (see grading below).

---

## 3. Lesson format v2: every lesson has ALL of these

One lesson = one concept, about 15 to 25 minutes. Steps run in this order, shown as a progress bar at the top of the lesson. The validator (`npm run validate`) **fails** any lesson that is missing a required step or is under the minimum counts.

| Step | What the learner does | Minimum per lesson |
|---|---|---|
| **Intro** | Short explanation in plain words with one analogy | 1 |
| **Predict → Run** | Sees code, guesses the output (multiple choice or typed), then watches it run in the visual panel | 2 |
| **Worked examples** (Learn + Trace) | Steps through an example, then types over it with ghost code | 3 examples |
| **Investigate** | Quick questions about specific lines ("Which line changes x?", "What is total after line 3?") | 3 |
| **Faded code** | Same kind of code with blanks to fill (`total = ___ + price`) | 2 |
| **Parsons** | Shuffled lines to put in order (and indent, where it matters) | 1 |
| **Fix the bug** | Code with one mistake, find and fix it, checked by running | 1 |
| **Modify** | Change given code so it does something new, checked by running | 2 |
| **Recall** | Write one of the worked examples from memory, from its tasks | 1 |
| **Make** | Write a small new program from a plain description, checked by tests | 1 |
| **Quiz** | Multiple choice, one at a time, each with a one-line "why" | 6 |
| **Common mistakes** | 2 or 3 typical beginner errors for this topic, with the real error message | 2 |
| **Links** | Verified docs.python.org (or other official) links, plus "Also in" book chapter titles | 1 |

Rules:
- All code, text and questions are **original**. Every example uses different names and values from the others.
- Every value shown in a visual comes from a real run (offline tracer or Pyodide tracer). Never typed by hand.
- A lesson may only use concepts taught in earlier lessons.
- Plain words, short sentences, no em dashes.

Unit-level extras:
- **Mini project** at the end of each unit: a slightly bigger Make task (20 to 40 lines) that combines the unit's lessons, with step-by-step hints that can be revealed.
- **Unit review**: a mixed (interleaved) set of Predict, Faded, Fix and Make items from across the unit.

---

## 4. Grading rules

| Exercise | How it is checked |
|---|---|
| Trace | Position by position against the ghost code (as now) |
| Recall | Accepted if the code means the same thing: compare Python ASTs (`ast.dump`) in Pyodide, so spaces, quote style and extra parentheses don't matter. Also accepted if output and final variables match exactly |
| Faded, Parsons | Accepted if the filled-in program parses and its output/final variables match the expected ones |
| Modify, Fix, Make | Run in Pyodide against hidden test cases (inputs plus expected output or values). Show which test failed in plain words |
| Predict, Quiz, Investigate | Exact answer |

- Unlimited retries everywhere. "Show answer" after 2 wrong tries.
- Python errors are shown with the real message plus a plain explanation (e.g. NameError: "you used a name that does not exist yet").
- All code runs in a Web Worker with a time limit, so an infinite loop can never freeze the page.

---

## 5. Review system (spaced repetition)

- Every Predict, Faded, Fix, Recall and Make item becomes a **review card** after the lesson is finished.
- Card intervals: 1, 3, 7, 14, 30, 60 days. A correct answer moves it up one step. "Show answer" moves it back to 1 day. Wrong tries before getting it right do not move it down.
- Home page shows a **Review** button with the number of cards due today. A review session mixes cards from different lessons and units (interleaving), 10 to 20 cards.
- Stored in `localStorage` (try/catch, the app works without it). Add **Export / Import progress** (download or paste JSON) so progress can move between devices without accounts.

---

## 6. Python track syllabus

Build `content/syllabus.md` first, from the *Learning Python* table of contents, **reordered for a total beginner**. The book is a deep reference and goes into a lot of detail early; the course should teach the most useful things first and add depth later.

The syllabus must:
- List every unit and lesson, in order, with the concept, the "Also in" chapter titles, and the docs.python.org links.
- Cover everything a beginner needs before Track 2 (data analysis), and then the rest of the book's main topics as later units, so the Python track never needs new lessons added later.
- Mark the deep topics as **Advanced (optional)** units at the end of the track, so the learner can move on to Track 2 after the core units.
- Include a **coverage table**: each book chapter → which lesson(s) cover it, or "skipped" with a short reason (e.g. Python 2 only, not useful for a beginner).

Show the syllabus to Adi and wait for approval before writing lessons.

---

## 7. Milestones

### Milestone 1: Engine v1 ✅ (done)
React + TS app, Learn/Trace/Recall/Quiz for lesson 1, CodeMirror editor, offline tracer, validation, link checks, GitHub Pages deploy.

### Milestone 2: Course framework v2
Goal: the full lesson system working end to end, proven on lesson 1 rebuilt in the v2 format.

- [x] Home page: 4 tracks in order, Tracks 2 to 4 "Coming soon", units and lessons inside a track, progress per lesson and unit
- [x] `tracks.json` + `language` field on every lesson (from UNIVERSAL.md "Rules to follow NOW")
- [x] Lesson format v2 schema + validator enforcing the minimums in section 3
- [x] Lesson page with a step progress bar, previous/next step, resume where you left off
- [x] Pyodide in a Web Worker: lazy load, loading indicator, time limit, plain-word errors, graceful fallback if it fails to load
- [x] Pyodide tracer that returns the same trace shape as `trace_lesson.py`
- [x] All exercise types from section 3 with the grading rules from section 4
- [x] Unit mini project + unit review pages
- [x] Review system from section 5, with a Review button on the home page
- [x] Export / Import progress
- [x] Migrate saved v1 progress if possible, otherwise reset it cleanly
- [x] Lesson 1 (variables and print) rebuilt in the full v2 format as the reference lesson
- [x] Tests: grading (AST compare, test cases, retries, show answer), review scheduling, every exercise type in the browser
- [x] Build, tests, validate, check-links pass. Commit, push, confirm the live site

**Done when:** lesson 1 has every v2 step working on the live site, and a review card from it shows up as due.

### Milestone 3: Complete Python track
Goal: the whole Python track, every lesson in the full v2 format.

- [x] Write `content/syllabus.md` (section 6). **Stop and wait for Adi to approve it.** (approved)
- [ ] Build **unit by unit**. For each unit: read the matching *Learning Python* chapters, write `content/notes/<unit>.md` in your own words, then write all lessons, the mini project and the unit review
- [ ] Run tracer + validate + check-links for every lesson
- [ ] After **each unit**: commit, push, and tell Adi the unit is live and what to try. Continue to the next unit unless he says stop (he will be learning from finished units while later ones are built)
- [ ] Final pass: check that every lesson only uses concepts from earlier lessons; fix the order if not

**Done when:** every unit in the approved syllabus is live, validated, and playable from lesson 1 to the end.

### Later milestones (roadmap)
- **M4: Track 2, Python for Data Analysis.** New visuals: array grid, DataFrame table with highlighted rows/columns, plots
- **M5: Track 3, Data Science from Scratch.** Visuals: vectors, scatter + fitted line, loss curve, gradient descent, neuron and network diagrams
- **M6: Track 4, Hands-On ML.** scikit-learn and Keras versions of what was built by hand (Keras/TensorFlow in the browser needs research first)
- Each new track uses the same lesson format v2, syllabus approval step, and unit-by-unit build
- Universal platform: see [UNIVERSAL.md](UNIVERSAL.md)

---

## 8. Content rules (every lesson)

- Books are read chapter by chapter, just in time, to understand each topic deeply. Lessons are written from Claude's own notes.
- Never copy or closely paraphrase book text, code, exercises or datasets. Never quote them.
- `bookRefs` contains chapter titles only, shown as "Also in".
- Only link URLs that were opened and confirmed to match the topic.
- If unsure how Python behaves, run it and check.
