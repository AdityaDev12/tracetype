import { describe, expect, it } from 'vitest'
import type { Knob } from '../../engine/types.ts'
import { applyKnobs, knobStart } from './knobs.ts'

const num: Knob = { line: 1, find: '7', label: 'n', kind: 'number' }
const txt: Knob = { line: 2, find: '"Lima"', label: 'city', kind: 'text' }
const code = ['n = 7 // 2', 'city = "Lima"', 'print(n, city)']

describe('knobs', () => {
  it('reads the starting value from the code', () => {
    expect(knobStart(num)).toBe('7')
    expect(knobStart(txt)).toBe('Lima')
  })

  it('puts new values into the code', () => {
    expect(applyKnobs(code, [num, txt], ['9', 'Oslo'])).toEqual(['n = 9 // 2', 'city = "Oslo"', 'print(n, city)'])
  })

  it('keeps text safe inside its quotes', () => {
    expect(applyKnobs(code, [txt], ['say "hi"'])[1]).toBe('city = "say \\"hi\\""')
  })

  it('ignores a number box that is empty or not a number', () => {
    expect(applyKnobs(code, [num], [''])[0]).toBe('n = 7 // 2')
    expect(applyKnobs(code, [num], ['abc'])[0]).toBe('n = 7 // 2')
  })
})
