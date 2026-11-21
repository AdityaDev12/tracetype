import { describe, expect, it } from 'vitest'
import { charKinds, tokenize } from './highlight.ts'

const kinds = (line: string) => tokenize(line).filter((t) => t.kind !== 'space').map((t) => [t.kind, t.text])

describe('tokenize', () => {
  it('colors an assignment', () => {
    expect(kinds('age = 14')).toEqual([
      ['name', 'age'],
      ['operator', '='],
      ['number', '14'],
    ])
  })

  it('handles strings, builtins and punctuation', () => {
    expect(kinds('print("hi", x)')).toEqual([
      ['builtin', 'print'],
      ['punct', '('],
      ['string', '"hi"'],
      ['punct', ','],
      ['name', 'x'],
      ['punct', ')'],
    ])
  })

  it('handles keywords and comments', () => {
    expect(kinds('if x: # check')).toEqual([
      ['keyword', 'if'],
      ['name', 'x'],
      ['punct', ':'],
      ['comment', '# check'],
    ])
  })

  it('handles f-strings and escaped quotes', () => {
    expect(kinds('f"a\\"b"')).toEqual([['string', 'f"a\\"b"']])
  })

  it('gives a kind to every character', () => {
    const line = 'x = "a b"  # c'
    expect(charKinds(line).length).toBe(line.length)
    expect(charKinds(line).every(Boolean)).toBe(true)
  })
})
