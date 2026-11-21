# DESIGN.md: look, feel and extras

Goal: a site that feels **calm, light and polished**, like a quiet code editor at night. Never heavy, never noisy. Personality comes from small details: smooth motion, a tiny mascot, good copy.

Decisions below were made by Adi. Anything marked **(propose)** needs Claude Code to show options and wait for approval before building.

---

## 1. Name: TraceType (decided)

Keep **TraceType**. No name proposals needed. Design a simple, clean wordmark/logo around it (it can work with the mascot), and show 2 or 3 logo options together with the mascot sketches.

---

## 2. Visual style: Calm dark editor (dark only)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0E1117` | page background (deep navy) |
| `--surface` | `#161B26` | cards, panels |
| `--surface-2` | `#1C2230` | inputs, hover, inner boxes |
| `--border` | `#262D3D` | 1px borders |
| `--text` | `#E6E9F0` | main text |
| `--text-muted` | `#8B93A7` | secondary text |
| `--accent` | `#8AB4FF` | soft blue: links, focus, active step, progress |
| `--success` | `#7DD3A8` | mint: correct, completed |
| `--error` | `#F28B82` | coral: wrong characters, failed tests |
| `--warn` | `#F2C879` | soft amber: hints, streak flame |

Syntax colors should be muted to match (strings, numbers, keywords, builtins, comments), not loud.

- Fonts: **Inter** for UI, **JetBrains Mono** for code (already used).
- Radius 10 to 14px. Borders over shadows. At most one soft shadow on floating things (dialogs, toasts).
- Lots of spacing. One accent color at a time on screen, never a rainbow.
- Text contrast meets WCAG AA. Visible focus rings for keyboard users.
- Dark only. No light theme.

Before building pages, make a small **style preview page** (`#style`) showing the palette, type scale, buttons, inputs, a code block, a variable box, toasts. Adi approves it, then everything uses those tokens.

---

## 3. Motion: subtle

- 150 to 250ms ease-out transitions on hover, step changes and panels.
- Variable boxes **pop in** when created and briefly glow when changed. Output lines fade in.
- Progress bars fill smoothly. A soft mint glow when a step is completed.
- Lesson complete: a small, short celebration (a gentle burst near the progress bar, under 1 second). No full-screen confetti.
- Respect `prefers-reduced-motion`: turn all of it off except instant state changes.
- Prefer CSS animations. Only add a motion library if it is small and clearly worth it.

---

## 4. Mascot: tiny, subtle, original (propose)

A very small original character that lives quietly in the UI. Not a cartoon that takes over the page.

Idea to start from: a little **block cursor** (the blinking text cursor shape) with two dot eyes.
- Sits in a corner of the lesson page or next to the progress bar, about 24 to 32px.
- Idle: blinks like a cursor now and then.
- Correct answer: a tiny hop. Lesson complete: a small happy bounce.
- Error: tilts its head. Never sad or judging.
- Shows up on the landing page hero and in empty states ("No reviews due, nice").
- Drawn as inline SVG + CSS so it is light. Original design, not based on any existing character.
- Can be hidden in settings.

Show 2 or 3 sketches (SVG) for Adi to pick before using it everywhere.

---

## 5. Landing page: animated demo that you can take over

First screen for new visitors. Returning visitors with progress go straight to their dashboard (with a link back to the landing page).

**Hero**
- Headline + one line under it, e.g. "Learn Python by typing it. Watch every line come alive." (final copy to be proposed)
- A mini editor + variable panel that **auto-types a short program on loop** (a few lines, boxes appearing, output printing).
- The moment the visitor clicks in it or presses a key, the demo stops and **becomes live**: they type the ghost code themselves and watch their own boxes appear. A small hint says "Click to try it."
- Buttons: **Start learning** (goes to lesson 1) and **See the course**.
- The mascot sits next to the editor.

**Sections below the hero** (short, scroll-revealed with subtle fades)
1. **How it works**: Learn · Trace · Recall · Quiz (plus Predict, Modify, Make), each as a small card with a tiny looping illustration
2. **The path**: the 4 tracks in order (Python → Data Analysis → Data Science from Scratch → Hands-On ML) as a horizontal path, with Coming soon tags
3. **Why it works**: 3 short points in plain words (predict before you write, practice from memory, review at the right time), each with a link to the research
4. **Skill map teaser**: a small preview of the skill map
5. Footer: GitHub link, "Free and open source", credits

Performance: the landing page must load fast. Do not load CodeMirror's heavy parts or Pyodide on the landing page; the demo can use a lightweight version of the typing logic.

---

## 6. Streaks + XP

- **XP**: earned for finishing steps (e.g. 10 per step, 50 per lesson, 100 per mini project, 5 per review card). Exact numbers can be tuned.
- **Levels**: grow with XP, shown as a small badge with a thin progress ring. No leaderboards.
- **Streak**: counts days with at least one finished step or review session. Shown as a small amber flame with the number. One free "rest day" per week so a missed day doesn't reset it.
- Calm wording only. No guilt messages, no pop-ups begging to come back.
- Stored with the rest of progress (localStorage + Export/Import).

---

## 7. Skill map

The main way to see the course, replacing the plain lesson list (keep a simple **List view** toggle for accessibility and phones).

- The 4 tracks as regions, units as clusters, lessons as small nodes connected in order.
- Node states: locked-looking (not started, still clickable), available (accent outline), in progress (partly filled), done (mint), needs review (small amber dot).
- Coming soon tracks are shown faded with their names.
- Hover or tap a node: lesson title, time estimate, progress, Start/Continue button.
- Smooth pan and zoom on desktop, simple vertical layout on phones.
- Build with SVG. Keep it light.

---

## 8. Pages

| Page | Notes |
|---|---|
| Landing | Section 5 |
| Dashboard (returning users) | Continue where you left off, reviews due, streak, XP/level, skill map preview |
| Skill map | Section 7 |
| Lesson | Step progress bar, editor + visual panel, explain box, mascot |
| Review | One card at a time, mixed topics, count left |
| Stats | Optional later: WPM and accuracy over time, weakest topics |
| Settings | Hide mascot, sound off/on (off by default), export/import progress, reset progress |
| 404 | Friendly, with the mascot |

---

## 9. Quality bar

- Looks right on a 13" laptop and on a phone (375px wide).
- Keyboard usable everywhere. Focus visible. ARIA labels on icon buttons.
- No layout jumps while loading. Skeletons instead of spinners where possible.
- Lighthouse performance and accessibility 90+ on the landing page.
- No em dashes in any UI text.
