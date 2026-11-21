import { describe, expect, it } from 'vitest'
import {
  accuracy,
  autoIndentFor,
  backspace,
  createTyping,
  firstWrongIndex,
  normalizeLoose,
  submit,
  typeChar,
  typeTab,
  typeText,
  wpm,
} from './typing.ts'

const T0 = 1_000_000

describe('typing chars', () => {
  it('counts correct characters', () => {
    const s = typeText(createTyping(['x = 1']), 'x = 1', T0)
    expect(s.typed).toBe('x = 1')
    expect(s.correctKeys).toBe(5)
    expect(s.wrongKeys).toBe(0)
    expect(s.startedAt).toBe(T0)
  })

  it('counts wrong characters and keeps them in typed', () => {
    const s = typeText(createTyping(['x = 1']), 'y', T0)
    expect(s.typed).toBe('y')
    expect(s.wrongKeys).toBe(1)
    expect(firstWrongIndex(s.typed, 'x = 1')).toBe(0)
  })

  it('treats chars past the end of the line as wrong', () => {
    const s = typeText(createTyping(['ab']), 'abc', T0)
    expect(s.correctKeys).toBe(2)
    expect(s.wrongKeys).toBe(1)
    expect(firstWrongIndex(s.typed, 'ab')).toBe(2)
  })

  it('stops accepting input far past the end of the line', () => {
    let s = createTyping(['a'])
    for (let i = 0; i < 50; i++) s = typeChar(s, 'z', T0)
    expect(s.typed.length).toBeLessThan(20)
  })
})

describe('backspace', () => {
  it('removes one character', () => {
    const s = backspace(typeText(createTyping(['abc']), 'ab', T0))
    expect(s.typed).toBe('a')
  })

  it('does not undo the keystroke counters', () => {
    const s = backspace(typeText(createTyping(['abc']), 'ax', T0))
    expect(s.typed).toBe('a')
    expect(s.wrongKeys).toBe(1)
  })

  it('removes a whole indent level when only spaces are typed', () => {
    const s = backspace(typeText(createTyping(['        x']), '        ', T0))
    expect(s.typed).toBe('    ')
  })

  it('does nothing on an empty line', () => {
    const s = createTyping(['abc'])
    expect(backspace(s)).toBe(s)
  })
})

describe('tab', () => {
  it('inserts spaces to the next multiple of 4', () => {
    let s = typeTab(createTyping(['    x']), T0)
    expect(s.typed).toBe('    ')
    s = typeText(createTyping(['  ']), ' ', T0)
    s = typeTab(s, T0)
    expect(s.typed).toBe('    ')
  })
})

describe('submit', () => {
  it('moves to the next line when the line matches', () => {
    const s = typeText(createTyping(['a = 1', 'print(a)']), 'a = 1', T0)
    const r = submit(s, T0 + 500)
    expect(r.ok).toBe(true)
    expect(r.state.lineIndex).toBe(1)
    expect(r.state.typed).toBe('')
    expect(r.state.done).toBe(false)
  })

  it('finishes after the last line', () => {
    const s = typeText(createTyping(['a = 1']), 'a = 1', T0)
    const r = submit(s, T0 + 2000)
    expect(r.ok).toBe(true)
    expect(r.state.done).toBe(true)
    expect(r.state.finishedAt).toBe(T0 + 2000)
  })

  it('refuses a line with wrong characters and says where', () => {
    const s = typeText(createTyping(['a = 1']), 'a = 2', T0)
    const r = submit(s, T0)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.wrongAt).toBe(4)
      expect(r.message).toMatch(/wrong/)
    }
  })

  it('refuses an unfinished line', () => {
    const r = submit(typeText(createTyping(['a = 1']), 'a =', T0), T0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/Not finished/)
  })

  it('ignores trailing spaces', () => {
    const r = submit(typeText(createTyping(['a = 1']), 'a = 1  ', T0), T0)
    expect(r.ok).toBe(true)
  })

  it('auto-indents after a line ending in a colon', () => {
    const lines = ['for i in range(3):', '    print(i)', 'print("done")']
    let s = typeText(createTyping(lines), lines[0], T0)
    s = submit(s, T0).state
    expect(s.typed).toBe('    ')
    s = typeText(s, 'print(i)', T0)
    s = submit(s, T0).state
    expect(s.typed).toBe('    ')
    s = backspace(s)
    expect(s.typed).toBe('')
  })
})

describe('auto indent', () => {
  it('keeps the previous indent and skips blank lines', () => {
    const lines = ['if x:', '    a = 1', '', '    b = 2']
    expect(autoIndentFor(lines, 0)).toBe('')
    expect(autoIndentFor(lines, 1)).toBe('    ')
    expect(autoIndentFor(lines, 3)).toBe('    ')
  })
})

describe('loose matching for recall', () => {
  it('ignores spaces outside strings and quote style', () => {
    expect(normalizeLoose('name="Adi"')).toBe(normalizeLoose("name = 'Adi'"))
  })

  it('keeps spaces inside strings', () => {
    expect(normalizeLoose('x = "a b"')).not.toBe(normalizeLoose('x = "ab"'))
  })

  it('still cares about indentation', () => {
    expect(normalizeLoose('    x = 1')).not.toBe(normalizeLoose('x = 1'))
  })

  it('accepts a loose match on submit', () => {
    const s = typeText(createTyping(['print(a, "hi")'], 'loose'), "print(a,'hi')", T0)
    expect(submit(s, T0).ok).toBe(true)
  })
})

describe('accuracy and wpm', () => {
  it('accuracy is 100 before typing', () => {
    expect(accuracy(createTyping(['x']))).toBe(100)
  })

  it('accuracy is correct over all keystrokes', () => {
    const s = typeText(createTyping(['abcd']), 'abxd', T0)
    expect(accuracy(s)).toBe(75)
  })

  it('recall accuracy counts line checks, not keystrokes', () => {
    let s = typeText(createTyping(['x = "a"', 'y = 1'], 'loose'), "x='a'", T0)
    s = submit(s, T0).state
    s = typeText(s, 'y = 2', T0)
    s = submit(s, T0).state
    expect(s.failedSubmits).toBe(1)
    expect(accuracy(s)).toBe(50)
  })

  it('wpm uses 5 chars per word', () => {
    // 50 correct chars in 1 minute = 10 wpm
    const s = typeText(createTyping(['a'.repeat(50)]), 'a'.repeat(50), T0)
    expect(wpm(s, T0 + 60_000)).toBe(10)
  })

  it('wpm uses the finish time once done', () => {
    let s = typeText(createTyping(['a'.repeat(25)]), 'a'.repeat(25), T0)
    s = submit(s, T0 + 30_000).state
    expect(wpm(s, T0 + 999_999)).toBe(10)
  })

  it('wpm is 0 before typing starts', () => {
    expect(wpm(createTyping(['x']), T0)).toBe(0)
  })
})
