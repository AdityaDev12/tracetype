import { describe, expect, it } from 'vitest'
import type { TraceEvent, TraceStep, VarValue } from '../../engine/types.ts'
import { formatAt, indexUseAt, refsAt, usesNegatives } from './strings.ts'

const str = (text: string, id?: string): VarValue => ({ repr: `'${text}'`, type: 'str', text, ...(id ? { id } : {}) })
const s = (line: number, vars: Record<string, VarValue>, events?: TraceEvent[]): TraceStep => ({ line, vars, stdout: '', ...(events ? { events } : {}) })
const idx = (target: string, key: string, picked: number[], extra: Partial<Extract<TraceEvent, { kind: 'index' }>> = {}): TraceEvent => ({
  kind: 'index',
  line: 2,
  target,
  key,
  len: 5,
  picked,
  ...extra,
})

describe('index use in cells', () => {
  const trace = [s(1, { w: str('melon') }), s(2, { w: str('melon') }, [idx('w', '1:3', [1, 2], { slice: true, value: "'el'" })])]

  it('matches the sequence by name on the current step only', () => {
    expect(indexUseAt(trace, 1, 'w')?.picked).toEqual([1, 2])
    expect(indexUseAt(trace, 1, 'x')).toBeUndefined()
    expect(indexUseAt(trace, 0, 'w')).toBeUndefined()
  })

  it('shows negative positions only once the code uses one', () => {
    expect(usesNegatives(trace)).toBe(false)
    expect(usesNegatives([...trace, s(3, {}, [idx('w', '-1', [4], { at: -1 })])])).toBe(true)
    expect(usesNegatives([...trace, s(3, {}, [idx('w', ':-2', [0, 1, 2], { slice: true })])])).toBe(true)
  })
})

describe('f-string filler', () => {
  const ev: TraceEvent = { kind: 'format', line: 2, template: 'f"{n:>3}"', holes: [{ code: 'n', spec: '>3', conv: null, value: '7', result: '  7' }], text: '  7' }
  const trace = [s(1, {}), s(2, {}, [ev]), s(3, {})]

  it('keeps showing the last f-string, marked as old', () => {
    expect(formatAt(trace, 0)).toBeNull()
    expect(formatAt(trace, 1)).toEqual({ ev, current: true })
    expect(formatAt(trace, 2)?.current).toBe(false)
  })
})

describe('reference diagram', () => {
  const trace = [s(1, { a: str('fig', 'o1') }), s(2, { a: str('fig', 'o1'), b: str('fig', 'o1') }), s(3, { a: str('FIG', 'o2'), b: str('fig', 'o1') })]

  it('puts two names on one object', () => {
    const { objects } = refsAt(trace, 1)
    expect(objects).toHaveLength(1)
    expect(objects[0].names).toEqual(['a', 'b'])
  })

  it('moves a name to a new object and keeps the old one', () => {
    const { objects, moved } = refsAt(trace, 2)
    expect(moved).toEqual(['a'])
    expect(objects.map((o) => [o.key, o.names, o.gone])).toEqual([
      ['o1', ['b'], false],
      ['o2', ['a'], false],
    ])
  })

  it('shows an object left with no name as gone', () => {
    const t = [s(1, { a: str('fig', 'o1') }), s(2, { a: str('FIG', 'o2') })]
    expect(refsAt(t, 1).objects.map((o) => [o.key, o.gone])).toEqual([
      ['o1', true],
      ['o2', false],
    ])
  })

  it('follows focus', () => {
    expect(refsAt(trace, 2, ['b']).objects.map((o) => o.key)).toEqual(['o1'])
  })
})
