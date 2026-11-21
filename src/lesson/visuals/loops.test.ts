import { describe, expect, it } from 'vitest'
import type { TraceEvent, TraceStep } from '../../engine/types.ts'
import { gridAt, loopRunAt, loopVar, outerLoop } from './loops.ts'

const v = (repr: string) => ({ repr, type: 'int' })
const s = (line: number, vars: Record<string, string>, events: TraceEvent[] = []): TraceStep => ({
  line,
  stdout: '',
  vars: Object.fromEntries(Object.entries(vars).map(([k, r]) => [k, v(r)])),
  events,
})
const loop = (line: number, round: number, done = false): TraceEvent => ({ kind: 'loop', line, stmt: 'for', round, ...(done ? { done } : {}) })

describe('loop runs', () => {
  const code = ['total = 0', 'for n in range(3):', '    total += n', 'print(total)']
  const trace = [
    s(1, { total: '0' }),
    s(2, { total: '0', n: '0' }, [loop(2, 1)]),
    s(3, { total: '0', n: '0' }),
    s(2, { total: '0', n: '1' }, [loop(2, 2)]),
    s(3, { total: '1', n: '1' }),
    s(2, { total: '1', n: '2' }, [loop(2, 3)]),
    s(3, { total: '3', n: '2' }),
    s(2, { total: '3', n: '2' }, [loop(2, 3, true)]),
    s(4, { total: '3', n: '2' }),
  ]

  it('reads the loop variable from the header', () => {
    expect(loopVar(code, 2)).toBe('n')
    expect(loopVar(['while x > 0:'], 1)).toBeNull()
  })

  it('collects every round so far with its value', () => {
    const run = loopRunAt(trace, 4, code)!
    expect(run.rounds.map((r) => [r.n, r.value?.repr])).toEqual([
      [1, '0'],
      [2, '1'],
    ])
    expect(run.done).toBe(false)
    expect(run.current).toBe(2)
  })

  it('knows when the loop is done', () => {
    const run = loopRunAt(trace, 8, code)!
    expect(run.rounds).toHaveLength(3)
    expect(run.done).toBe(true)
    expect(run.rounds[2].end).toBe(6)
  })

  it('has nothing before the loop starts', () => {
    expect(loopRunAt(trace, 0, code)).toBeNull()
  })

  it('marks break and continue in their round', () => {
    const t = [
      s(1, { i: '0' }, [loop(1, 1)]),
      s(3, { i: '0' }, [{ kind: 'continue', line: 3, loop: 1 }]),
      s(1, { i: '1' }, [loop(1, 2)]),
      s(5, { i: '1' }, [{ kind: 'break', line: 5, loop: 1 }]),
    ]
    const run = loopRunAt(t, 3, ['for i in range(9):', '    if i == 0:', '        continue', '    if i == 1:', '        break'])!
    expect(run.rounds.map((r) => r.jump)).toEqual(['continue', 'break'])
    expect(run.broke).toBe(true)
    expect(run.done).toBe(true)
  })
})

describe('grid for nested loops', () => {
  const code = ['for r in range(2):', '    for c in range(2):', '        x = r + c']
  const trace = [
    s(1, { r: '0' }, [loop(1, 1)]),
    s(2, { r: '0', c: '0' }, [loop(2, 1)]),
    s(3, { r: '0', c: '0' }),
    s(2, { r: '0', c: '1' }, [loop(2, 2)]),
    s(3, { r: '0', c: '1' }),
    s(2, { r: '0', c: '1' }, [loop(2, 2, true)]),
    s(1, { r: '1', c: '1' }, [loop(1, 2)]),
    s(2, { r: '1', c: '0' }, [loop(2, 1)]),
  ]

  it('finds the outer loop by indentation', () => {
    expect(outerLoop(code, 2)).toBe(1)
    expect(outerLoop(code, 1)).toBeNull()
  })

  it('lights one cell per inner round, rows per outer round', () => {
    const g = gridAt(trace, 7, code)!
    expect(g.rowLabels).toEqual(['0', '1'])
    expect(g.colLabels).toEqual(['0', '1'])
    expect(g.cells.map((c) => [c.row, c.col, c.current])).toEqual([
      [0, 0, false],
      [0, 1, false],
      [1, 0, true],
    ])
  })
})
