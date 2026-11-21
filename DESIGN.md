# DESIGN.md v2: look, feel and extras

**v1 was rejected: it looked generic** (Inter + rounded cards + soft blue on navy is the default "AI SaaS dark" look). v2 gives the site a real point of view.

## 0. The idea in one line

**A terminal, marked up by a tutor.** Code lives in warm, glowing terminal panels. A friendly tutor has drawn on top of everything by hand: arrows, circles, underlines and margin notes pointing at the exact line that matters. That mix of machine and handwriting is the soul of the site.

Study these for **feel only** (never copy layouts, text or assets):
- joshwcomeau.com: small delightful details, playful interactions, warm voice
- ciechanow.ski: drag/scrub something and watch it change; explanation through interaction
- ncase.me: hand-drawn warmth, learning by playing
- press.stripe.com: book-quality typography and care

Anything marked **(propose)** needs options shown to Adi before building it everywhere.

---

## 1. Name: TraceType (decided)

Keep **TraceType**. Redo the logo options in the v2 style (see section 5).

---

## 2. Color (dark only)

Warm, not blue. Think amber terminal glow on warm black, with chalk text and colored "pens" for the tutor.

| Token | Start value | Use |
|---|---|---|
| `--bg` | `#0C0B09` | warm near-black page |
| `--grid` | `#1A1813` | faint graph-paper lines on the page |
| `--panel` | `#13110E` | terminal panels |
| `--panel-bar` | `#1C1914` | terminal title bars |
| `--line` | `#2A2620` | borders, dividers (often dashed) |
| `--chalk` | `#EDE6D6` | main text |
| `--chalk-dim` | `#9C9384` | secondary text |
| `--phosphor` | `#FFB547` | amber glow: code cursor, active line, primary buttons, logo |
| `--ghost` | `#5A5243` | ghost code to type over |
| `--ok` | `#8BE38B` | green phosphor: correct, done |
| `--pen-blue` | `#86B6FF` | tutor's notes and arrows |
| `--pen-red` | `#FF6F5E` | tutor's red pen: mistakes, wrong characters |
| `--pen-yellow` | `#F7D774` | highlighter: hints, streak |

These are starting values. Tune them, check every text color for WCAG AA contrast, and show the result on the preview page.

Syntax colors: muted, warm, terminal-like (amber, sand, sage green, soft red), not a rainbow.

---

## 3. Type

| Role | Font (Google Fonts) | Notes |
|---|---|---|
| Headings | **Fraunces** (serif, variable) | Warm, a little quirky. Big sizes on landing/lesson titles |
| Code + UI labels | **IBM Plex Mono** | Terminal feel. Turn off ligatures so `==` shows as two characters |
| Tutor notes | **Caveat** (handwriting) | Only for annotations and small asides, never for body text |
| Body text | **IBM Plex Sans** | Readable paragraphs |

No Inter anywhere.

---

## 4. Signature elements (this is the soul, build all of them)

1. **Tutor annotations.** In Learn mode, and on the landing page, hand-drawn marks point at code: an arrow to the active line, a circle around a value, a wavy underline under a mistake, a short handwritten note in the margin ("reads the old value first!"). They **draw themselves on** (stroke animation, about 400ms). Use a hand-drawn SVG library such as rough.js (check its license and size first) or hand-made SVG paths. Notes come from the lesson's `explain` field or a short `note` field.
2. **Terminal panels.** Code, memory and output live in panels with a slim title bar (`lesson_01.py`, `memory`, `output`), small square corners (2 to 4px), and a very soft amber glow on the active line. No big rounded cards.
3. **Graph-paper page.** A faint grid on the page background, like a notebook. Very low contrast.
4. **Blinking block cursor** as a motif: in the logo, after headings, in empty states, as the mascot's body.
5. **Headings that type themselves** the first time they scroll into view (fast, once, skipped with reduced motion).
6. **Box-drawing details**: dividers and small labels can use characters like `──`, `├─`, `└─`, `>`. Use them as accents, not everywhere.
7. **Optional texture**: a barely visible grain or scanline overlay, so subtle that most people only feel it. Off with reduced motion. Must not hurt readability.
8. **Voice**: copy reads like a friendly tutor talking to you, short and warm. Small system labels can sound like a terminal (`> progress saved`).

What to avoid: generic rounded cards in a centered column, gradients, glassmorphism, stock icons everywhere, emoji as decoration, anything that looks like a SaaS template.

---

## 5. Logo (propose)

Show 2 or 3 options in the v2 style, for example:
- `Trace▌Type` in Plex Mono with an amber block cursor, "Type" in ghost color
- The same with a small hand-drawn underline or circle from the tutor
- A tiny icon version: amber block cursor + `>` for the favicon

---

## 6. Mascot (propose)

The little **block cursor** with two dot eyes, now in the v2 style:
- Amber phosphor body with a soft glow, 24 to 32px.
- Can also appear **hand-drawn** in the tutor's pen when it is part of an annotation (e.g. pointing at a line).
- Idle: blinks like a cursor. Correct: tiny hop. Error: head tilt. Lesson done: small bounce. Never sad or judging.
- Hideable in settings.

Show 2 or 3 sketches.

---

## 7. Motion: subtle

- 150 to 250ms ease-out for hovers, steps and panels. Annotations draw on in about 400ms.
- Variable boxes pop in; changed values flash amber briefly and show "was X" in the tutor's handwriting with a strike-through.
- Lesson complete: annotations scribble a quick check mark and the mascot bounces. No confetti.
- Respect `prefers-reduced-motion`: everything appears instantly.

---

## 8. Landing page: boot, then type

1. **Boot line** (under 1.5s, plays once per visit, skippable with any key):
   `> tracetype --start` then 2 or 3 short lines (`loading python... ok`).
2. **Hero**: big Fraunces headline (copy to propose, e.g. "Learn Python by typing it."), and a terminal panel that **auto-types a short program on loop** with memory boxes appearing and the tutor annotating it live.
3. The moment the visitor clicks or presses a key, the demo **stops and becomes live**: they type over the ghost code themselves. A handwritten note says "go on, try it →".
4. Buttons: **Start learning** (amber) and **See the course**.
5. Below, short sections, each with a tutor annotation:
   - **How it works**: Predict, Trace, Recall, Make, each with a tiny looping demo
   - **The path**: the 4 tracks as a terminal `tree` listing, with the tutor circling Python ("start here") and marking the rest "coming soon"
   - **Why it works**: 3 plain points (predict first, practice from memory, review at the right time) with links to the research
   - Footer: GitHub link, "free and open source"
6. Performance: no Pyodide on the landing page, light typing logic only. Lighthouse 90+.

---

## 9. Streaks + XP

- **XP** for finishing steps (about 10 per step, 50 per lesson, 100 per mini project, 5 per review card; tune later).
- **Level** shown as a small badge. No leaderboards.
- **Streak**: days with at least one finished step or review. Shown as a small highlighter-yellow mark with the number, maybe hand-drawn. One free rest day a week.
- Calm wording. No guilt messages.

---

## 10. Skill map

- Styled like a terminal `tree` of tracks → units → lessons, with the tutor's hand-drawn marks on top: check marks on finished lessons, a circle around "you are here", a small dot on lessons that need review.
- Optional richer view on desktop: nodes on graph paper connected by hand-drawn lines.
- Coming soon tracks shown dimmed.
- Hover/tap a lesson: title, time estimate, progress, Start/Continue.
- A plain List view toggle for accessibility and phones.

---

## 11. Pages

| Page | Notes |
|---|---|
| Landing | Section 8 |
| Dashboard | Continue where you left off, reviews due, streak, level, skill map preview |
| Skill map | Section 10 |
| Lesson | Step progress bar, terminal panels, tutor annotations, mascot |
| Review | One card at a time, mixed topics |
| Settings | Hide mascot, texture on/off, sound off by default, export/import, reset |
| 404 | `> page not found`, the mascot shrugs, link home |

---

## 12. Process

1. Rebuild the `#style` preview page in v2: palette with contrast checks, fonts, a terminal panel with ghost code, a live annotation drawing itself onto a code line, memory boxes, buttons, toasts, progress/XP/streak, empty state, 2-3 logos, 2-3 mascots.
2. Also build a **rough landing hero** (boot + auto-typing + one annotation) so the feel can be judged in motion, not just as swatches.
3. Push, show Adi, wait for feedback. Iterate until he says it has soul. Only then apply it everywhere in Milestone 2.

## 13. Quality bar

- Looks right on a 13" laptop and a 375px phone.
- Keyboard usable, visible focus, ARIA labels on icon buttons.
- Text contrast AA. Handwriting font only for short notes, never for anything you must read to complete a task.
- No em dashes in any UI text.
