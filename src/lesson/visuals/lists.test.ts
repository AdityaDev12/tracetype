import { describe, expect, it } from 'vitest'
import type { TraceStep } from '../../engine/types.ts'
import { listChange, listItemsAt } from './lists.ts'

describe('list changes in cells', () => {
  it('marks nothing on the first step', () => {
    expect(listChange(null, ['1', '2'])).toEqual({ marks: ['same', 'same'], was: [undefined, undefined], removed: [] })
  })

  it('an insert is one new cell, the rest slide right', () => {
    const c = listChange(['4', '7', '9'], ['4', '5', '7', '9'])
    expect(c.marks).toEqual(['same', 'new', 'same', 'same'])
    expect(c.removed).toEqual([])
  })

  it('append adds a new cell at the end', () => {
    expect(listChange(['4'], ['4', '8']).marks).toEqual(['same', 'new'])
    expect(listChange([], ["'a'"]).marks).toEqual(['new'])
  })

  it('a removal lists the item and where it was', () => {
    const c = listChange(["'a'", "'b'", "'c'"], ["'a'", "'c'"])
    expect(c.marks).toEqual(['same', 'same'])
    expect(c.removed).toEqual([{ at: 1, repr: "'b'" }])
  })

  it('assigning to a position is one changed cell with its old value', () => {
    const c = listChange(['1', '2', '3'], ['1', '20', '3'])
    expect(c.marks).toEqual(['same', 'changed', 'same'])
    expect(c.was[1]).toBe('2')
    expect(c.removed).toEqual([])
  })

  it('the same items in a new order is a reorder, not removals', () => {
    const c = listChange(['3', '1', '2'], ['1', '2', '3'])
    expect(c.reordered).toBe(true)
    expect(c.marks).toEqual(['same', 'same', 'same'])
    expect(c.removed).toEqual([])
    expect(listChange(['1', '2'], ['1', '2']).reordered).toBeUndefined()
  })

  it('reads list items from the heap of a step', () => {
    const trace: TraceStep[] = [
      {
        line: 1,
        stdout: '',
        vars: { xs: { repr: '[1]', type: 'list', ref: 'o1' }, n: { repr: '3', type: 'int' } },
        heap: { o1: { kind: 'list', type: 'list', items: [{ repr: '1', type: 'int' }] } },
      },
    ]
    expect(listItemsAt(trace, 0, 'xs')).toEqual(['1'])
    expect(listItemsAt(trace, 0, 'n')).toBeNull()
    expect(listItemsAt(trace, -1, 'xs')).toBeNull()
  })
})
