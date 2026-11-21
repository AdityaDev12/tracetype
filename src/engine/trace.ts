import type { TraceStep, VarValue } from './types.ts'

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
    return { index: -1, line: null, vars: [], locals: [], output: '', newOutput: '' }
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
  }
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
