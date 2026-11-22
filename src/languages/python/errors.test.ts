import { describe, expect, it } from 'vitest'
import { explainPythonError } from './errors.ts'

// Messages below are the real ones from Python 3.14 (checked with python3).
describe('explainPythonError', () => {
  it('explains a NameError with a suggestion', () => {
    expect(explainPythonError("NameError: name 'scroe' is not defined. Did you mean: 'score'?")).toBe(
      'You used the name scroe, which does not exist. Did you mean score?',
    )
  })

  it('explains a NameError without a suggestion', () => {
    expect(explainPythonError("NameError: name 'blue' is not defined")).toMatch(/If it is text, it needs quotes/)
  })

  it('explains common syntax errors', () => {
    expect(explainPythonError('SyntaxError: invalid decimal literal')).toMatch(/cannot start with a digit/)
    expect(explainPythonError("SyntaxError: '(' was never closed")).toBe('A ( was opened but never closed.')
    expect(explainPythonError('SyntaxError: unterminated string literal (detected at line 1)')).toMatch(/closing quote/)
  })

  it('explains a timeout', () => {
    expect(explainPythonError('Timeout: stopped after 5000 steps')).toMatch(/loop/)
  })

  it('explains input() in the browser', () => {
    expect(explainPythonError('OSError: [Errno 29] I/O error')).toMatch(/input\(\)/)
  })

  it('explains string mistakes from Unit 4', () => {
    expect(explainPythonError("TypeError: string indices must be integers, not 'tuple'")).toMatch(/colon/)
    expect(explainPythonError('TypeError: list indices must be integers or slices, not float')).toMatch(/not a float/)
    expect(explainPythonError("TypeError: 'str' object does not support item assignment")).toMatch(/never be changed/)
    expect(explainPythonError("TypeError: 'in <string>' requires string as left operand, not int")).toMatch(/whole number. Put it in quotes/)
    expect(explainPythonError("ValueError: Unknown format code 'f' for object of type 'str'")).toMatch(/:f does not work on a str/)
  })

  it('returns null for something unknown', () => {
    expect(explainPythonError('SomethingNew: hm')).toBeNull()
  })
})
