import type { TraceEvent, TraceStep, VarValue } from '../../engine/types.ts'

// Logic for the Unit 4 panels: index and slice highlights in cells, the
// f-string filler and the reference diagram. Every value comes from the trace.

export type IndexEvent = Extract<TraceEvent, { kind: 'index' }>
export type FormatEvent = Extract<TraceEvent, { kind: 'format' }>

/** The index and slice uses of the current step, for one sequence (matched by
 * its name). A use that failed (past the end) comes last. */
export function indexUsesAt(trace: TraceStep[], index: number, name: string): IndexEvent[] {
  return (trace[index]?.events ?? []).filter((e): e is IndexEvent => e.kind === 'index' && e.target === name)
}

/** Show the negative index row once the code uses a negative position. */
export function usesNegatives(trace: TraceStep[]): boolean {
  return trace.some((s) => (s.events ?? []).some((e) => e.kind === 'index' && ((e.at ?? 0) < 0 || /-/.test(e.key))))
}

/** The latest f-string event at or before step `index`, and whether it belongs to that step. */
export function formatAt(trace: TraceStep[], index: number): { ev: FormatEvent; current: boolean } | null {
  for (let i = Math.min(index, trace.length - 1); i >= 0; i--) {
    const evs = (trace[i].events ?? []).filter((e): e is FormatEvent => e.kind === 'format')
    if (evs.length) return { ev: evs[evs.length - 1], current: i === index }
  }
  return null
}

export interface RefObject {
  /** Object id from the trace ("o3"). */
  key: string
  repr: string
  type: string
  /** Names pointing at it now, in the order they were made. */
  names: string[]
  /** No name points at it any more (it was there earlier). */
  gone: boolean
}

const keyOf = (v: VarValue) => v.ref ?? v.id

/** Names and the objects they point at, plus objects left behind earlier in the run. */
export function refsAt(trace: TraceStep[], index: number, focus?: string[]): { objects: RefObject[]; moved: string[] } {
  const at = Math.min(index, trace.length - 1)
  const keep = (name: string) => !focus?.length || focus.includes(name)
  const seen = new Map<string, RefObject>()
  for (let i = 0; i <= at; i++) {
    for (const [name, v] of Object.entries(trace[i].vars)) {
      const key = keyOf(v)
      if (!key || !keep(name)) continue
      seen.set(key, { key, repr: v.repr, type: v.type, names: [], gone: true })
    }
  }
  const now = at >= 0 ? trace[at].vars : {}
  for (const [name, v] of Object.entries(now)) {
    const key = keyOf(v)
    if (!key || !keep(name)) continue
    const o = seen.get(key) ?? { key, repr: v.repr, type: v.type, names: [], gone: false }
    o.repr = v.repr
    o.gone = false
    o.names.push(name)
    seen.set(key, o)
  }
  const prev = at > 0 ? trace[at - 1].vars : {}
  const moved = Object.entries(now)
    .filter(([name, v]) => keep(name) && prev[name] && keyOf(prev[name]) !== keyOf(v))
    .map(([name]) => name)
  return { objects: [...seen.values()], moved }
}
