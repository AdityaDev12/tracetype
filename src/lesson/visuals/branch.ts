import type { TraceEvent, TraceStep } from '../../engine/types.ts'

// Works out the if/elif/else (or match/case) ladder around a test, from the
// code lines and the test events in the trace. Pure functions, unit tested.

type TestEvent = Extract<TraceEvent, { kind: 'test' }>

export interface Clause {
  line: number
  text: string
  kind: 'if' | 'elif' | 'else' | 'case'
  /** taken: its block ran. no: tested False. skipped: never checked. */
  state: 'taken' | 'no' | 'skipped'
}

export interface Ladder {
  head: number
  kind: 'if' | 'match'
  clauses: Clause[]
}

const indentOf = (s: string) => s.length - s.trimStart().length
const starts = (s: string, word: string) => new RegExp(`^${word}\\b`).test(s.trimStart())

/** The latest if/elif/case test at or before step `index`. */
export function latestTest(trace: TraceStep[], index: number): { ev: TestEvent; at: number } | null {
  for (let i = Math.min(index, trace.length - 1); i >= 0; i--) {
    const evs = (trace[i].events ?? []).filter((e): e is TestEvent => e.kind === 'test' && e.stmt !== 'while')
    if (evs.length) return { ev: evs[evs.length - 1], at: i }
  }
  return null
}

/** The clause lines of the ladder that `line` (an if, elif or case line) belongs to. */
export function ladderLines(code: string[], line: number): Ladder | null {
  const at = code[line - 1]
  if (at === undefined) return null
  const ind = indentOf(at)
  if (starts(at, 'case')) {
    // Find the match line above, then every case at this indent below it.
    let head = line - 1
    while (head >= 1 && !(starts(code[head - 1], 'match') && indentOf(code[head - 1]) < ind)) head--
    if (head < 1) return null
    const clauses: Clause[] = []
    for (let n = head + 1; n <= code.length; n++) {
      const s = code[n - 1]
      if (s.trim() === '' || s.trimStart().startsWith('#')) continue
      if (indentOf(s) <= indentOf(code[head - 1])) break
      if (indentOf(s) === ind && starts(s, 'case')) clauses.push({ line: n, text: s.trim(), kind: 'case', state: 'skipped' })
    }
    return { head, kind: 'match', clauses }
  }
  // An elif: walk up to its if.
  let head = line
  if (starts(at, 'elif')) {
    head = line - 1
    while (head >= 1 && !(indentOf(code[head - 1]) === ind && starts(code[head - 1], 'if'))) head--
    if (head < 1) return null
  }
  const clauses: Clause[] = [{ line: head, text: code[head - 1].trim(), kind: 'if', state: 'skipped' }]
  for (let n = head + 1; n <= code.length; n++) {
    const s = code[n - 1]
    if (s.trim() === '' || s.trimStart().startsWith('#')) continue
    if (indentOf(s) < ind) break
    if (indentOf(s) > ind) continue
    if (starts(s, 'elif')) clauses.push({ line: n, text: s.trim(), kind: 'elif', state: 'skipped' })
    else if (starts(s, 'else')) {
      clauses.push({ line: n, text: s.trim(), kind: 'else', state: 'skipped' })
      break
    } else break
  }
  return { head, kind: 'if', clauses }
}

/** The ladder for the latest test at or before step `index`, with each clause's state. */
export function ladderAt(trace: TraceStep[], index: number, code: string[]): Ladder | null {
  const found = latestTest(trace, index)
  if (!found) return null
  const ladder = ladderLines(code, found.ev.line)
  if (!ladder) return null
  const lines = new Set(ladder.clauses.map((c) => c.line))
  const first = ladder.clauses[0].line
  // Results of this pass through the ladder: walk back to the first clause's test.
  const results = new Map<number, boolean>()
  outer: for (let i = found.at; i >= 0; i--) {
    const evs = (trace[i].events ?? []).filter((e): e is TestEvent => e.kind === 'test' && lines.has(e.line))
    for (let k = evs.length - 1; k >= 0; k--) {
      if (!results.has(evs[k].line)) results.set(evs[k].line, evs[k].result)
      if (evs[k].line === first) break outer
    }
  }
  let decided = false
  for (const c of ladder.clauses) {
    if (c.kind === 'else') {
      const allNo = ladder.clauses.every((o) => o.kind === 'else' || results.get(o.line) === false)
      c.state = !decided && allNo ? 'taken' : 'skipped'
      continue
    }
    const r = results.get(c.line)
    if (r === true && !decided) {
      c.state = 'taken'
      decided = true
    } else if (r === false) c.state = 'no'
    else c.state = 'skipped'
  }
  return ladder
}
