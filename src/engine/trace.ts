import type { HeapObject, TraceEvent, TraceStep, VarValue } from './types.ts'

export interface VarView {
  name: string
  value: VarValue
  /** Previous value when this step changed it. */
  was?: VarValue
  isNew: boolean
  changed: boolean
}

export interface StepView {
  /** Index into trace, or -1 for "nothing has run yet". */
  index: number
  line: number | null
  vars: VarView[]
  locals: VarView[]
  func?: string
  /** All output printed up to and including this step. */
  output: string
  /** Output printed by this step only. */
  newOutput: string
  /** What happened during this step (trace v2). */
  events: TraceEvent[]
  heap: Record<string, HeapObject>
}

function diffVars(
  now: Record<string, VarValue> | undefined,
  before: Record<string, VarValue> | undefined,
): VarView[] {
  if (!now) return []
  return Object.entries(now).map(([name, value]) => {
    const prev = before?.[name]
    const changed = prev !== undefined && (prev.repr !== value.repr || prev.type !== value.type)
    return { name, value, was: changed ? prev : undefined, isNew: prev === undefined, changed }
  })
}

/** Everything the visual panel needs to draw the state after trace[index]. */
export function viewAt(trace: TraceStep[], index: number): StepView {
  if (index < 0 || trace.length === 0) {
    return { index: -1, line: null, vars: [], locals: [], output: '', newOutput: '', events: [], heap: {} }
  }
  const i = Math.min(index, trace.length - 1)
  const step = trace[i]
  const prev = i > 0 ? trace[i - 1] : undefined
  let output = ''
  for (let k = 0; k <= i; k++) output += trace[k].stdout
  const sameFunc = prev && prev.func === step.func
  return {
    index: i,
    line: step.line,
    vars: diffVars(step.vars, prev?.vars),
    locals: diffVars(step.locals, sameFunc ? prev?.locals : undefined),
    func: step.func,
    output,
    newOutput: step.stdout,
    events: step.events ?? [],
    heap: step.heap ?? {},
  }
}

/** Every value each module-level name has held up to step `index`, oldest first
 * (repeats of the same value are left out). Names in the order they appeared. */
export function historyAt(trace: TraceStep[], index: number): { name: string; values: VarValue[] }[] {
  const out = new Map<string, VarValue[]>()
  for (let i = 0; i <= Math.min(index, trace.length - 1); i++) {
    for (const [name, v] of Object.entries(trace[i].vars)) {
      if (v.type === 'function' || v.type === 'module' || v.type === 'type') continue
      const list = out.get(name) ?? []
      const prev = list[list.length - 1]
      if (!prev || prev.repr !== v.repr || prev.type !== v.type) list.push(v)
      out.set(name, list)
    }
  }
  return [...out.entries()].map(([name, values]) => ({ name, values }))
}

/** How many input() answers were used up to and including step `index`. */
export function inputsUsed(trace: TraceStep[], index: number): number {
  let n = 0
  for (let i = 0; i <= Math.min(index, trace.length - 1); i++) {
    for (const e of trace[i].events ?? []) if (e.kind === 'input') n = e.index + 1
  }
  return n
}

/** Source lines that ran at least once. */
export function linesRun(trace: TraceStep[]): Set<number> {
  return new Set(trace.map((s) => s.line))
}

/** Index of the last step that finished `line`, or -1. Used to jump the timeline to a clicked line. */
export function lastRunOf(trace: TraceStep[], line: number): number {
  for (let i = trace.length - 1; i >= 0; i--) if (trace[i].line === line) return i
  return -1
}

/** Steps worth marking on the timeline. */
export function timelineMarks(trace: TraceStep[]): { printed: boolean; raised: boolean; input: boolean }[] {
  return trace.map((s) => ({
    printed: s.stdout !== '',
    raised: (s.events ?? []).some((e) => e.kind === 'raise'),
    input: (s.events ?? []).some((e) => e.kind === 'input'),
  }))
}

/**
 * For Trace and Recall (source order): after the learner finishes source line
 * `line`, which trace step should the panel show? Walk execution order while
 * steps stay at or before that line. Returns -1 if none have run.
 */
export function stepForSourceLine(trace: TraceStep[], line: number): number {
  let found = -1
  for (let i = 0; i < trace.length; i++) {
    if (trace[i].line <= line) found = i
    else break
  }
  return found
}
