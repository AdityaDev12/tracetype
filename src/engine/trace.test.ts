import { describe, expect, it } from 'vitest'
import { stepForSourceLine, viewAt } from './trace.ts'
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
