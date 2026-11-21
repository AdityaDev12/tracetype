import { describe, expect, it } from 'vitest'
import {
  accuracy,
  autoIndentFor,
  compareLine,
  createTyping,
  liveCorrectChars,
  normalizeLoose,
  submitLine,
  tabSpaces,
  wpm,
  type TypingState,
} from './typing.ts'

const T0 = 1_000_000

/** Shorthand: submit text with the cursor at the end. */
function enter(s: TypingState, text: string, now = T0) {
  return submitLine(s, text, text.length, now)
}

describe('compareLine', () => {
  it('marks matching and wrong characters by position', () => {
    const r = compareLine('x = 2', 5, 'x = 1')
    expect(r.ok).toEqual([true, true, true, true, false])
    expect(r.wrong).toBe(1)
  })

  it('shows the rest of the target as ghost text at the end', () => {
    const r = compareLine('pri', 3, 'print(x)')
    expect(r.wrong).toBe(0)
    expect(r.ghosts).toEqual([{ at: 3, text: 'nt(x)' }])
  })

  it('does not care about the order things were typed in', () => {
    // Same text, any history: only the final characters matter.
    expect(compareLine('print(x)', 8, 'print(x)')).toEqual({ ok: Array(8).fill(true), wrong: 0, ghosts: [] })
  })

  it('treats an auto-closed bracket after the cursor as right', () => {
    // Typed "print(" and the editor added ")" with the cursor inside.
    const r = compareLine('print()', 6, 'print(player)')
    expect(r.wrong).toBe(0)
    expect(r.ghosts).toEqual([{ at: 6, text: 'player' }])
  })

  it('handles filling in inside the brackets', () => {
    const r = compareLine('print(pla)', 9, 'print(player)')
    expect(r.wrong).toBe(0)
    expect(r.ghosts).toEqual([{ at: 9, text: 'yer' }])
  })

  it('handles an auto-closed quote inside brackets', () => {
    // Typed print(" which gave print("") with the cursor between the quotes.
    const r = compareLine('print("")', 7, 'print("Winner:", winner)')
    expect(r.wrong).toBe(0)
    expect(r.ghosts).toEqual([
      { at: 7, text: 'Winner:' },
      { at: 8, text: ', winner' },
    ])
  })

  it('keeps position by position when the cursor moved back over correct text', () => {
    const r = compareLine('player = "Ma', 10, 'player = "Maya"')
    expect(r.wrong).toBe(0)
    expect(r.ghosts).toEqual([{ at: 12, text: 'ya"' }])
  })

  it('marks a wrong character after the cursor', () => {
    const r = compareLine('x = 2', 2, 'x = 1')
    expect(r.wrong).toBe(1)
    expect(r.ok[4]).toBe(false)
  })

  it('marks extra characters past the end as wrong', () => {
    expect(compareLine('abc', 3, 'ab').ok).toEqual([true, true, false])
  })
})

describe('submitLine', () => {
  it('moves to the next line when the line matches', () => {
    const r = enter(createTyping(['a = 1', 'print(a)']), 'a = 1')
    expect(r.ok).toBe(true)
    expect(r.state.lineIndex).toBe(1)
    expect(r.state.done).toBe(false)
  })

  it('finishes after the last line', () => {
    const r = enter(createTyping(['a = 1']), 'a = 1', T0 + 2000)
    expect(r.ok).toBe(true)
    expect(r.state.done).toBe(true)
    expect(r.state.finishedAt).toBe(T0 + 2000)
  })

  it('refuses a line with wrong characters and counts them', () => {
    const r = enter(createTyping(['a = 1']), 'b = 2')
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.wrong).toBe(2)
      expect(r.message).toMatch(/wrong/)
      expect(r.state.errorChars).toBe(2)
      expect(r.state.failedSubmits).toBe(1)
      expect(r.state.lineIndex).toBe(0)
    }
  })

  it('refuses an unfinished line', () => {
    const r = enter(createTyping(['a = 1']), 'a =')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/Not finished/)
  })

  it('ignores trailing spaces', () => {
    expect(enter(createTyping(['a = 1']), 'a = 1  ').ok).toBe(true)
  })

  it('accepts a line finished with the cursor anywhere', () => {
    expect(submitLine(createTyping(['print(x)']), 'print(x)', 7, T0).ok).toBe(true)
  })

  it('accepts a loose match in recall', () => {
    expect(enter(createTyping(['print(a, "hi")'], 'loose'), "print(a,'hi')").ok).toBe(true)
  })
})

describe('auto indent and tab', () => {
  it('keeps the previous indent, adds one after a colon, skips blank lines', () => {
    const lines = ['if x:', '    a = 1', '', '    b = 2']
    expect(autoIndentFor(lines, 0)).toBe('')
    expect(autoIndentFor(lines, 1)).toBe('    ')
    expect(autoIndentFor(lines, 3)).toBe('    ')
  })

  it('tab goes to the next multiple of 4', () => {
    expect(tabSpaces(0)).toBe('    ')
    expect(tabSpaces(2)).toBe('  ')
    expect(tabSpaces(4)).toBe('    ')
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
})

describe('accuracy', () => {
  it('is 100 before anything is submitted', () => {
    expect(accuracy(createTyping(['x']))).toBe(100)
  })

  it('ignores typos fixed before Enter', () => {
    // Whatever was typed and deleted along the way, a clean Enter is 100%.
    const r = enter(createTyping(['abcd', 'x']), 'abcd')
    expect(accuracy(r.state)).toBe(100)
  })

  it('counts wrong chars at Enter plus the refused Enter itself', () => {
    let s = createTyping(['abcdefghij'])
    s = enter(s, 'abcdefghiX').state // 1 wrong char + 1 refused Enter = 2 errors
    expect(accuracy(s)).toBe(80)
    s = enter(s, 'abcdefghij').state
    expect(accuracy(s)).toBe(80)
  })

  it('counts an unfinished Enter as one error', () => {
    const s = enter(createTyping(['abcdefghij']), 'abc').state
    expect(accuracy(s)).toBe(90)
  })
})

describe('wpm', () => {
  it('is 0 before typing starts', () => {
    expect(wpm(createTyping(['x']), T0)).toBe(0)
  })

  it('uses 5 chars per word and the finish time once done', () => {
    let s: TypingState = { ...createTyping(['a'.repeat(25)]), startedAt: T0 }
    s = enter(s, 'a'.repeat(25), T0 + 30_000).state
    expect(wpm(s, T0 + 999_999)).toBe(10)
  })

  it('adds live correct characters on the current line', () => {
    const s = { ...createTyping(['a'.repeat(50)]), startedAt: T0 }
    expect(wpm(s, T0 + 60_000, 50)).toBe(10)
  })

  it('does not count auto-indent as typed characters', () => {
    expect(liveCorrectChars('    x = 1', 9, '    x = 1')).toBe(5)
  })
})
