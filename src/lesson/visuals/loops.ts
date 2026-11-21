import type { TraceEvent, TraceStep, VarValue } from '../../engine/types.ts'

// Loop facts for the loop, trace table and grid panels, worked out from the
// loop events in a trace and the code lines. Pure functions, unit tested.

type LoopEvent = Extract<TraceEvent, { kind: 'loop' }>

const indentOf = (s: string) => s.length - s.trimStart().length

/** Value of `name` after step i (function locals first, then module names). */
export function valueAt(trace: TraceStep[], i: number, name: string): VarValue | undefined {
  const s = trace[i]
  return s?.locals?.[name] ?? s?.vars[name]
}

/** The loop variable of a for header line, like "ch" in "for ch in word:". */
export function loopVar(code: string[], line: number): string | null {
  const m = /^\s*for\s+([A-Za-z_]\w*)\s+in\b/.exec(code[line - 1] ?? '')
  return m ? m[1] : null
}

export interface Round {
  n: number
  /** Step index where this round started (the header line's step). */
  start: number
  /** Step index where it ended (last step before the next round or the end). */
  end: number
  value?: VarValue
  /** break or continue ran in this round. */
  jump?: 'break' | 'continue'
}

export interface LoopRun {
  line: number
  stmt: 'for' | 'while'
  rounds: Round[]
  /** The loop has finished (its test was False or it ran out of items). */
  done: boolean
  broke: boolean
  /** The round the current step is in (0 before the first round). */
  current: number
}

/** The latest loop event at or before step `index`. */
function latestLoop(trace: TraceStep[], index: number, line?: number): { ev: LoopEvent; at: number } | null {
  for (let i = Math.min(index, trace.length - 1); i >= 0; i--) {
    const evs = (trace[i].events ?? []).filter((e): e is LoopEvent => e.kind === 'loop' && (line === undefined || e.line === line))
    if (evs.length) return { ev: evs[evs.length - 1], at: i }
  }
  return null
}

/** The run of the loop that step `index` is in (or just finished), with every round so far. */
export function loopRunAt(trace: TraceStep[], index: number, code: string[], line?: number): LoopRun | null {
  const found = latestLoop(trace, index, line)
  if (!found) return null
  const L = found.ev.line
  // Walk back to round 1 of this run.
  const starts: { at: number; ev: LoopEvent }[] = []
  for (let i = found.at; i >= 0; i--) {
    const ev = (trace[i].events ?? []).find((e): e is LoopEvent => e.kind === 'loop' && e.line === L)
    if (!ev) continue
    starts.unshift({ at: i, ev })
    if (ev.round <= 1) break
  }
  const last = Math.min(index, trace.length - 1)
  const name = found.ev.stmt === 'for' ? loopVar(code, L) : null
  const rounds: Round[] = []
  let done = false
  let broke = false
  starts.forEach((s, k) => {
    if (s.ev.done) {
      done = true
      return
    }
    const next = starts[k + 1]
    const end = next ? next.at - 1 : last
    const r: Round = { n: s.ev.round, start: s.at, end: Math.min(end, last) }
    if (name) r.value = valueAt(trace, s.at, name)
    for (let i = s.at; i <= r.end; i++) {
      for (const e of trace[i].events ?? []) {
        if ((e.kind === 'break' || e.kind === 'continue') && e.loop === L) r.jump = e.kind
      }
    }
    if (r.jump === 'break' && !next) {
      broke = true
      done = r.end < last || r.end === last
    }
    rounds.push(r)
  })
  // A break ends the loop: it is done once a later step is outside the loop.
  if (broke) done = true
  const current = rounds.length ? rounds[rounds.length - 1].n : 0
  return { line: L, stmt: found.ev.stmt, rounds, done, broke, current }
}

/** The loop header that directly contains `line` (by indentation), or null. */
export function outerLoop(code: string[], line: number): number | null {
  const ind = indentOf(code[line - 1] ?? '')
  for (let n = line - 1; n >= 1; n--) {
    const s = code[n - 1]
    if (s.trim() === '') continue
    if (indentOf(s) < ind && /^\s*(for|while)\b/.test(s)) return n
    if (indentOf(s) === 0 && n < line) break
  }
  return null
}

export interface GridCell {
  row: number
  col: number
  current: boolean
}

export interface Grid {
  rowLabels: string[]
  colLabels: string[]
  cells: GridCell[]
}

/** Nested loops as a grid: one row per outer round, one column per inner round. */
export function gridAt(trace: TraceStep[], index: number, code: string[]): Grid | null {
  const inner = latestLoop(trace, index)
  if (!inner) return null
  const innerLine = inner.ev.line
  const outerLine = outerLoop(code, innerLine)
  if (outerLine === null) return null
  const outerVar = loopVar(code, outerLine)
  const innerVar = loopVar(code, innerLine)
  const rowLabels: string[] = []
  const colLabels: string[] = []
  const cells: GridCell[] = []
  let row = -1
  const last = Math.min(index, trace.length - 1)
  for (let i = 0; i <= last; i++) {
    for (const e of trace[i].events ?? []) {
      if (e.kind !== 'loop' || e.done) continue
      if (e.line === outerLine) {
        row++
        rowLabels[row] = outerVar ? (valueAt(trace, i, outerVar)?.repr ?? String(e.round)) : String(e.round)
      } else if (e.line === innerLine && row >= 0) {
        const col = e.round - 1
        if (colLabels[col] === undefined) colLabels[col] = innerVar ? (valueAt(trace, i, innerVar)?.repr ?? String(e.round)) : String(e.round)
        cells.push({ row, col, current: false })
      }
    }
  }
  if (!cells.length) return null
  cells[cells.length - 1].current = true
  return { rowLabels, colLabels, cells }
}
