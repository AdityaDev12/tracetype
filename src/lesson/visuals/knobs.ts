import { useEffect, useMemo, useRef, useState } from 'react'
import type { RunError } from '../../engine/grade.ts'
import { runOptions } from '../../engine/grade.ts'
import type { Knob, RunOptions, TraceStep } from '../../engine/types.ts'
import { canRun, useLesson } from '../LessonContext.tsx'

/** The value a knob starts with, read from the code. */
export function knobStart(k: Knob): string {
  return k.kind === 'text' ? k.find.slice(1, -1) : k.find
}

/** The code with every knob's value put in. */
export function applyKnobs(lines: string[], knobs: Knob[], values: string[]): string[] {
  const out = [...lines]
  knobs.forEach((k, i) => {
    const v = values[i]
    let literal = v
    if (k.kind === 'text') {
      const q = k.find[0]
      literal = q + v.replaceAll('\\', '\\\\').replaceAll(q, `\\${q}`) + q
    } else if (v.trim() === '' || Number.isNaN(Number(v))) {
      literal = k.find
    }
    const line = out[k.line - 1]
    const at = line.indexOf(k.find)
    if (at >= 0) out[k.line - 1] = line.slice(0, at) + literal + line.slice(at + k.find.length)
  })
  return out
}

export interface KnobRun {
  lines: string[]
  trace: TraceStep[]
  error: RunError | null
  /** True once a value has been changed. */
  changed: boolean
  /** Waiting for Python to run the changed code. */
  busy: boolean
  values: string[]
  setValue: (i: number, v: string) => void
  reset: () => void
}

/** Knob state for one item: values, the changed code, and its live trace (run
 * in Pyodide). Before anything changes, the pre-made trace is used. */
export function useKnobs(
  lines: string[],
  knobs: Knob[] | undefined,
  base: { trace: TraceStep[]; error?: RunError | null },
  opts?: RunOptions,
): KnobRun {
  const ctx = useLesson()
  const list = useMemo(() => knobs ?? [], [knobs])
  const start = useMemo(() => list.map(knobStart), [list])
  const [values, setValues] = useState(start)
  const [live, setLive] = useState<{ trace: TraceStep[]; error: RunError | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const changed = values.some((v, i) => v !== start[i])
  const code = useMemo(() => applyKnobs(lines, list, values), [lines, list, values])
  const ticket = useRef(0)
  const options = useMemo(() => runOptions(opts), [opts])

  useEffect(() => {
    if (!changed) return
    ctx.needRunner()
    if (!canRun(ctx)) return
    const my = ++ticket.current
    const t = window.setTimeout(async () => {
      setBusy(true)
      try {
        const r = await ctx.runner!.trace(code.join('\n') + '\n', options)
        if (my === ticket.current) setLive({ trace: r.steps, error: r.error })
      } catch (e) {
        if (my === ticket.current) {
          setLive({ trace: [], error: { type: 'Timeout', message: e instanceof Error ? e.message : String(e), line: null } })
        }
      } finally {
        if (my === ticket.current) setBusy(false)
      }
    }, 250)
    return () => window.clearTimeout(t)
    // ctx changes identity on every render; status is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, changed, ctx.status, options])

  const current = changed && live ? live : { trace: base.trace, error: base.error ?? null }
  return {
    lines: code,
    trace: current.trace,
    error: current.error,
    changed,
    busy: changed && (busy || !live || ctx.status !== 'ready'),
    values,
    setValue: (i, v) => setValues((old) => old.map((x, j) => (j === i ? v : x))),
    reset: () => {
      setValues(start)
      setLive(null)
    },
  }
}

