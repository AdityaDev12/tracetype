// Pure line-checking engine for Trace and Recall modes. The editor (CodeMirror)
// owns the text being typed; this module decides what is right or wrong and keeps
// score. Nothing here touches the DOM, so it is easy to unit test.

export const INDENT = '    '

export type MatchMode = 'exact' | 'loose'

export interface TypingState {
  targets: string[]
  lineIndex: number
  done: boolean
  match: MatchMode
  startedAt: number | null
  finishedAt: number | null
  /** Characters of finished lines, not counting leading indentation (used for WPM). */
  submittedChars: number
  /** Enter presses that were checked, and how many were refused. */
  submits: number
  failedSubmits: number
  /** Wrong characters that were present at each refused Enter, added up. */
  errorChars: number
}

export function createTyping(targets: string[], match: MatchMode = 'exact'): TypingState {
  return {
    targets,
    lineIndex: 0,
    done: targets.length === 0,
    match,
    startedAt: null,
    finishedAt: null,
    submittedChars: 0,
    submits: 0,
    failedSubmits: 0,
    errorChars: 0,
  }
}

export function currentTarget(s: TypingState): string {
  return s.targets[s.lineIndex] ?? ''
}

export function leadingSpaces(line: string): string {
  const m = /^ */.exec(line)
  return m ? m[0] : ''
}

/**
 * Editor style auto-indent for line i: keep the previous line's indent, and
 * add one level if the previous line ends with a colon. Blank previous lines
 * are skipped so indentation carries across them.
 */
export function autoIndentFor(targets: string[], i: number): string {
  for (let j = i - 1; j >= 0; j--) {
    const prev = targets[j]
    if (prev.trim() === '') continue
    const base = leadingSpaces(prev)
    return prev.trimEnd().endsWith(':') ? base + INDENT : base
  }
  return ''
}

/** Spaces that Tab inserts at this column: up to the next multiple of 4. */
export function tabSpaces(column: number): string {
  return ' '.repeat(INDENT.length - (column % INDENT.length))
}

export function markStarted(s: TypingState, now: number): TypingState {
  return s.startedAt === null && !s.done ? { ...s, startedAt: now } : s
}

export interface Ghost {
  /** Offset into the typed text where this faded piece is drawn. */
  at: number
  text: string
}

export interface LineCompare {
  /** One entry per character of the typed text: true if it matches the target. */
  ok: boolean[]
  wrong: number
  /** Missing parts of the target, shown faded where they belong. */
  ghosts: Ghost[]
}

/**
 * Compares typed text against the target.
 *
 * Text before the cursor is compared position by position with the start of
 * the target. Text after the cursor is usually compared the same way. The
 * exception is auto-closed brackets and quotes: typing `print("` gives
 * `print("")` with the cursor between the quotes. Those closing characters
 * belong further along the target, so they are matched in order from the end
 * of the target instead, and the missing pieces are shown as ghost text in the
 * gaps. Whichever reading has fewer wrong characters wins; ties go to plain
 * position by position.
 */
export function compareLine(text: string, cursor: number, target: string): LineCompare {
  const c = Math.max(0, Math.min(cursor, text.length))
  const left: boolean[] = []
  for (let i = 0; i < text.length; i++) left.push(i < target.length && text[i] === target[i])
  const leftWrong = left.filter((x) => !x).length
  const leftResult: LineCompare = {
    ok: left,
    wrong: leftWrong,
    ghosts: text.length < target.length ? [{ at: text.length, text: target.slice(text.length) }] : [],
  }

  const after = text.slice(c)
  if (after.length === 0 || leftWrong === 0 || text.length > target.length) return leftResult

  // Match the characters after the cursor, in order, as far right in the target as possible.
  const pos: (number | null)[] = new Array(after.length).fill(null)
  let hi = target.length - 1
  for (let j = after.length - 1; j >= 0; j--) {
    let k = hi
    while (k >= c && target[k] !== after[j]) k--
    if (k >= c) {
      pos[j] = k
      hi = k - 1
    }
  }
  const ok = left.slice(0, c)
  for (let j = 0; j < after.length; j++) ok.push(pos[j] !== null)
  const wrong = ok.filter((x) => !x).length
  if (wrong >= leftWrong) return leftResult

  const ghosts: Ghost[] = []
  let next = c // next target index not yet shown
  for (let j = 0; j < after.length; j++) {
    const p = pos[j]
    if (p === null) continue
    if (p > next) ghosts.push({ at: c + j, text: target.slice(next, p) })
    next = p + 1
  }
  if (next < target.length) ghosts.push({ at: text.length, text: target.slice(next) })
  return { ok, wrong, ghosts }
}

/**
 * Loose form for Recall mode: indentation must match, spaces outside
 * strings and comments are ignored, and ' and " count as the same quote.
 */
export function normalizeLoose(line: string): string {
  const indent = leadingSpaces(line)
  const body = line.slice(indent.length)
  let out = ''
  let quote: string | null = null
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (quote) {
      if (c === '\\' && i + 1 < body.length) {
        out += c + body[i + 1]
        i++
        continue
      }
      if (c === quote) {
        quote = null
        out += '"'
        continue
      }
      out += c
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      out += '"'
      continue
    }
    if (c === '#') break
    if (c === ' ') continue
    out += c
  }
  return indent + out
}

export function lineMatches(typed: string, target: string, match: MatchMode): boolean {
  if (match === 'loose') return normalizeLoose(typed) === normalizeLoose(target)
  return typed.trimEnd() === target.trimEnd()
}

/** Wrong characters in the typed line, as the learner sees them. */
export function wrongCount(text: string, cursor: number, target: string, match: MatchMode): number {
  if (match === 'loose') {
    const a = normalizeLoose(text)
    const b = normalizeLoose(target)
    let n = 0
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++
    return n
  }
  const t = text.trimEnd()
  return compareLine(t, Math.min(cursor, t.length), target).wrong
}

/** Length used for accuracy. */
function unitLength(line: string, match: MatchMode): number {
  return match === 'loose' ? normalizeLoose(line).length : line.length
}

export type SubmitResult =
  | { ok: true; state: TypingState }
  | { ok: false; state: TypingState; message: string; wrong: number }

/** Enter: checks the line and moves on only if it matches. */
export function submitLine(s: TypingState, text: string, cursor: number, now: number): SubmitResult {
  if (s.done) return { ok: true, state: s }
  const target = currentTarget(s)
  const started = markStarted(s, now)
  if (lineMatches(text, target, s.match)) {
    const nextIndex = s.lineIndex + 1
    const done = nextIndex >= s.targets.length
    return {
      ok: true,
      state: {
        ...started,
        lineIndex: done ? s.lineIndex : nextIndex,
        done,
        finishedAt: done ? now : s.finishedAt,
        submittedChars: s.submittedChars + target.trimStart().length,
        submits: s.submits + 1,
      },
    }
  }
  const wrong = wrongCount(text, cursor, target, s.match)
  let message: string
  if (s.match === 'loose') message = 'Not quite. Compare with the task and try again.'
  else if (wrong > 0) message = 'Some characters are wrong. Fix the red ones.'
  else message = 'Not finished yet. Type the rest of the faded code.'
  return {
    ok: false,
    state: {
      ...started,
      submits: s.submits + 1,
      failedSubmits: s.failedSubmits + 1,
      errorChars: s.errorChars + wrong,
    },
    message,
    wrong,
  }
}

/**
 * Accuracy from mistakes that were actually submitted: wrong characters
 * present when Enter was pressed, plus one for each refused Enter, compared
 * with the characters of the lines reached so far. Typing order and fixed
 * typos do not count. 100 before anything is submitted.
 */
export function accuracy(s: TypingState): number {
  const errors = s.errorChars + s.failedSubmits
  if (errors === 0) return 100
  const reached = s.done ? s.targets.length : s.lineIndex + 1
  let total = 0
  for (let i = 0; i < reached; i++) total += unitLength(s.targets[i], s.match)
  if (total === 0) return 100
  return Math.max(0, Math.round((1 - errors / total) * 100))
}

/**
 * Words per minute, counting 5 characters as one word. Uses finished lines
 * plus `liveChars` (correct characters on the current line, if known).
 */
export function wpm(s: TypingState, now: number, liveChars = 0): number {
  if (s.startedAt === null) return 0
  const end = s.finishedAt ?? now
  const ms = end - s.startedAt
  // Ignore the very first second so a single key does not show a silly number.
  if (ms < 1000) return 0
  const chars = s.submittedChars + (s.done ? 0 : liveChars)
  return Math.round(chars / 5 / (ms / 60000))
}

/** Correct characters on the current line, not counting auto-indent. */
export function liveCorrectChars(text: string, cursor: number, target: string): number {
  const cmp = compareLine(text, cursor, target)
  const indent = leadingSpaces(target).length
  let n = 0
  cmp.ok.forEach((ok, i) => {
    if (ok && i >= indent) n++
  })
  return n
}
