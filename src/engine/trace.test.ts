import { describe, expect, it } from 'vitest'
import { historyAt, inputsUsed, lastRunOf, linesRun, stepForSourceLine, timelineMarks, viewAt } from './trace.ts'
import type { TraceStep } from './types.ts'

const v = (repr: string, type = 'int') => ({ repr, type })

const trace: TraceStep[] = [
  { line: 1, vars: { a: v('1') }, stdout: '' },
  { line: 2, vars: { a: v('1') }, stdout: '1\n' },
  { line: 3, vars: { a: v("'hi'", 'str') }, stdout: '' },
]

describe('viewAt', () => {
  it('shows nothing before the first step', () => {
    const view = viewAt(trace, -1)
    expect(view.vars).toEqual([])
    expect(view.output).toBe('')
  })

  it('marks new variables', () => {
    const view = viewAt(trace, 0)
    expect(view.vars[0]).toMatchObject({ name: 'a', isNew: true, changed: false })
  })

  it('collects output up to the step', () => {
    expect(viewAt(trace, 1).output).toBe('1\n')
    expect(viewAt(trace, 1).newOutput).toBe('1\n')
    expect(viewAt(trace, 2).newOutput).toBe('')
    expect(viewAt(trace, 2).output).toBe('1\n')
  })

  it('remembers the old value when a variable changes', () => {
    const a = viewAt(trace, 2).vars[0]
    expect(a.changed).toBe(true)
    expect(a.was?.repr).toBe('1')
  })
})

describe('stepForSourceLine', () => {
  it('maps source lines to execution steps', () => {
    expect(stepForSourceLine(trace, 0)).toBe(-1)
    expect(stepForSourceLine(trace, 2)).toBe(1)
  })

  it('includes every loop iteration once the loop body is done', () => {
    const loop: TraceStep[] = [1, 2, 3, 2, 3, 2, 4].map((line) => ({ line, vars: {}, stdout: '' }))
    expect(stepForSourceLine(loop, 2)).toBe(1)
    expect(stepForSourceLine(loop, 3)).toBe(5)
    expect(stepForSourceLine(loop, 4)).toBe(6)
  })
})

describe('trace v2 helpers', () => {
  const s = (line: number, vars: Record<string, string>, extra: Partial<TraceStep> = {}): TraceStep => ({
    line,
    stdout: '',
    vars: Object.fromEntries(Object.entries(vars).map(([k, r]) => [k, v(r)])),
    ...extra,
  })
  const run: TraceStep[] = [
    s(1, { x: '1' }),
    s(2, { x: '1' }, { stdout: '1\n' }),
    s(3, { x: '5' }, { events: [{ kind: 'input', prompt: '', value: '5', index: 0 }] }),
    s(2, { x: '5' }, { events: [{ kind: 'raise', type: 'E', message: 'E: m', line: 2, func: '<module>' }] }),
  ]

  it('collects every value a name has held, without repeats', () => {
    expect(historyAt(run, 3)).toEqual([{ name: 'x', values: [v('1'), v('5')] }])
    expect(historyAt(run, 1)).toEqual([{ name: 'x', values: [v('1')] }])
    expect(historyAt(run, -1)).toEqual([])
  })

  it('counts typed answers used so far', () => {
    expect(inputsUsed(run, 1)).toBe(0)
    expect(inputsUsed(run, 2)).toBe(1)
  })

  it('finds the last time a line ran', () => {
    expect(lastRunOf(run, 2)).toBe(3)
    expect(lastRunOf(run, 9)).toBe(-1)
    expect([...linesRun(run)].sort()).toEqual([1, 2, 3])
  })

  it('marks printing, input and errors on the timeline', () => {
    expect(timelineMarks(run)).toEqual([
      { printed: false, raised: false, input: false },
      { printed: true, raised: false, input: false },
      { printed: false, raised: false, input: true },
      { printed: false, raised: true, input: false },
    ])
  })

  it('passes events and heap through viewAt', () => {
    const view = viewAt(run, 2)
    expect(view.events[0].kind).toBe('input')
    expect(view.heap).toEqual({})
  })
})
