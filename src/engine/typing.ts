// Pure typing engine for Trace and Recall modes. Every function returns a new
// state; nothing here touches the DOM, so it is easy to unit test.

export const INDENT = '    '
/** How far past the end of a line the learner may type (extra chars show red). */
export const MAX_OVERTYPE = 12

export type MatchMode = 'exact' | 'loose'

export interface TypingState {
  targets: string[]
  lineIndex: number
  /** What the learner has typed on the current line. */
  typed: string
  done: boolean
  /** Keystrokes that put the right character in the right place. */
  correctKeys: number
  /** Keystrokes that put a wrong character somewhere. */
  wrongKeys: number
  startedAt: number | null
  finishedAt: number | null
  /** Characters of lines already submitted (used for progress, not WPM). */
  submittedChars: number
  /** Enter presses that were checked, and how many of those were refused. */
  submits: number
  failedSubmits: number
  match: MatchMode
}

export function createTyping(targets: string[], match: MatchMode = 'exact'): TypingState {
  return {
    targets,
    lineIndex: 0,
    typed: autoIndentFor(targets, 0),
    done: targets.length === 0,
    correctKeys: 0,
    wrongKeys: 0,
    startedAt: null,
    finishedAt: null,
    submittedChars: 0,
    submits: 0,
    failedSubmits: 0,
    match,
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

/** Index of the first wrong character, or -1 if everything typed so far is right. */
export function firstWrongIndex(typed: string, target: string): number {
  for (let i = 0; i < typed.length; i++) {
    if (i >= target.length || typed[i] !== target[i]) return i
  }
  return -1
}

function start(s: TypingState, now: number): TypingState {
  return s.startedAt === null ? { ...s, startedAt: now } : s
}

export function typeChar(s: TypingState, ch: string, now: number): TypingState {
  if (s.done) return s
  const target = currentTarget(s)
  if (s.typed.length >= target.length + MAX_OVERTYPE) return s
  const next = start(s, now)
  const ok = target[s.typed.length] === ch
  return {
    ...next,
    typed: s.typed + ch,
    correctKeys: next.correctKeys + (ok ? 1 : 0),
    wrongKeys: next.wrongKeys + (ok ? 0 : 1),
  }
}

export function typeText(s: TypingState, text: string, now: number): TypingState {
  let out = s
  for (const ch of text) {
    if (ch === '\n' || ch === '\r') continue
    out = typeChar(out, ch === '\t' ? ' ' : ch, now)
  }
  return out
}

/** Tab inserts spaces up to the next multiple of 4. */
export function typeTab(s: TypingState, now: number): TypingState {
  const width = INDENT.length - (s.typed.length % INDENT.length)
  return typeText(s, ' '.repeat(width), now)
}

/** Backspace removes one char, or a whole indent level when only spaces are typed. */
export function backspace(s: TypingState): TypingState {
  if (s.done || s.typed.length === 0) return s
  const onlySpaces = /^ +$/.test(s.typed)
  if (onlySpaces) {
    const remove = s.typed.length % INDENT.length || INDENT.length
    return { ...s, typed: s.typed.slice(0, -remove) }
  }
  return { ...s, typed: s.typed.slice(0, -1) }
}

/**
 * Loose comparison for Recall mode: indentation must match, spaces outside
 * strings are ignored, and ' and " count as the same quote.
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

export type SubmitResult =
  | { ok: true; state: TypingState }
  | { ok: false; state: TypingState; message: string; wrongAt: number }

export function submit(s: TypingState, now: number): SubmitResult {
  if (s.done) return { ok: true, state: s }
  const target = currentTarget(s)
  if (lineMatches(s.typed, target, s.match)) {
    const nextIndex = s.lineIndex + 1
    const done = nextIndex >= s.targets.length
    return {
      ok: true,
      state: {
        ...start(s, now),
        lineIndex: done ? s.lineIndex : nextIndex,
        typed: done ? s.typed : autoIndentFor(s.targets, nextIndex),
        done,
        finishedAt: done ? now : s.finishedAt,
        submittedChars: s.submittedChars + target.length,
        submits: s.submits + 1,
      },
    }
  }
  const wrongAt = firstWrongIndex(s.typed, target)
  let message: string
  if (s.match === 'loose') {
    message = 'Not quite. Compare with the task and try again.'
  } else if (wrongAt === -1) {
    message = 'Not finished yet. Keep typing the rest of the line.'
  } else if (wrongAt >= target.length) {
    message = 'Too many characters. Delete the extra ones at the end.'
  } else {
    message = 'Some characters are wrong. Fix the red ones with Backspace.'
  }
  return {
    ok: false,
    state: { ...s, submits: s.submits + 1, failedSubmits: s.failedSubmits + 1 },
    message,
    wrongAt: wrongAt === -1 ? s.typed.length : wrongAt,
  }
}

/**
 * Trace (exact): percentage of keystrokes that were right.
 * Recall (loose): percentage of line checks that passed, since spacing and
 * quote style are allowed to differ from the lesson code.
 * 100 before any typing.
 */
export function accuracy(
  s: Pick<TypingState, 'correctKeys' | 'wrongKeys' | 'match' | 'submits' | 'failedSubmits'>,
): number {
  if (s.match === 'loose') {
    if (s.submits === 0) return 100
    return Math.round(((s.submits - s.failedSubmits) / s.submits) * 100)
  }
  const total = s.correctKeys + s.wrongKeys
  if (total === 0) return 100
  return Math.round((s.correctKeys / total) * 100)
}

/** Words per minute, counting 5 correct characters as one word. */
export function wpm(s: Pick<TypingState, 'correctKeys' | 'startedAt' | 'finishedAt'>, now: number): number {
  if (s.startedAt === null) return 0
  const end = s.finishedAt ?? now
  const minutes = (end - s.startedAt) / 60000
  if (minutes <= 0) return 0
  // Ignore the very first second so a single key does not show 600 WPM.
  if (end - s.startedAt < 1000) return 0
  return Math.round(s.correctKeys / 5 / minutes)
}
