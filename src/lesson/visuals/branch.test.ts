import { describe, expect, it } from 'vitest'
import type { TraceStep } from '../../engine/types.ts'
import { ladderAt, ladderLines } from './branch.ts'

const step = (line: number, tests: [number, 'if' | 'elif' | 'case', boolean][] = []): TraceStep => ({
  line,
  vars: {},
  stdout: '',
  events: tests.map(([l, stmt, result]) => ({ kind: 'test', line: l, stmt, result })),
})

const code = [
  'temp = 20',
  'if temp > 30:',
  '    print("hot")',
  'elif temp > 15:',
  '    print("warm")',
  'else:',
  '    print("cold")',
  'print("done")',
]

describe('branch ladder', () => {
  it('finds the whole if/elif/else chain from any of its lines', () => {
    expect(ladderLines(code, 4)?.clauses.map((c) => [c.line, c.kind])).toEqual([
      [2, 'if'],
      [4, 'elif'],
      [6, 'else'],
    ])
  })

  it('marks the taken branch, the false tests and the ones never checked', () => {
    const trace = [step(1), step(2, [[2, 'if', false]]), step(4, [[4, 'elif', true]]), step(5), step(8)]
    expect(ladderAt(trace, 2, code)?.clauses.map((c) => c.state)).toEqual(['no', 'taken', 'skipped'])
  })

  it('takes the else when every test is false', () => {
    const trace = [step(1), step(2, [[2, 'if', false]]), step(4, [[4, 'elif', false]]), step(7)]
    expect(ladderAt(trace, 3, code)?.clauses.map((c) => c.state)).toEqual(['no', 'no', 'taken'])
  })

  it('works for match and case', () => {
    const m = ['cmd = "go"', 'match cmd:', '    case "stop":', '        x = 0', '    case "go":', '        x = 1', '    case _:', '        x = 2']
    const trace = [step(1), step(2), step(3, [[3, 'case', false]]), step(5, [[5, 'case', true]]), step(6)]
    const ladder = ladderAt(trace, 4, m)
    expect(ladder?.kind).toBe('match')
    expect(ladder?.clauses.map((c) => c.state)).toEqual(['no', 'taken', 'skipped'])
  })

  it('has nothing to show before the first test', () => {
    expect(ladderAt([step(1)], 0, code)).toBeNull()
  })
})
