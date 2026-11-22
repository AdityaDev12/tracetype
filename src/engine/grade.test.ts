import { describe, expect, it } from 'vitest'
import {
  canShowAnswer,
  expectedFromTrace,
  fallbackFaded,
  fallbackParsons,
  fallbackRecall,
  giveUp,
  gradeByResult,
  gradeRecall,
  gradeTests,
  gradeTypedOutput,
  newAttempts,
  normalizeOutput,
  recordTry,
  runOptions,
  type CodeRunner,
  type RunResult,
  type TestResult,
} from './grade.ts'

const v = (repr: string, type = 'int') => ({ repr, type })

/** A fake runner: answers are set per test. Real Python is covered by browser tests. */
function fakeRunner(opts: { sameAst?: boolean; run?: RunResult; tests?: TestResult[] }): CodeRunner {
  return {
    trace: async () => ({ steps: [], stdout: '', vars: {}, error: null }),
    run: async () => opts.run ?? { stdout: '', vars: {}, error: null },
    tests: async () => opts.tests ?? [],
    sameAst: async () => opts.sameAst ?? false,
  }
}

describe('normalizeOutput', () => {
  it('ignores trailing spaces and trailing blank lines', () => {
    expect(normalizeOutput('a  \nb\n\n')).toBe('a\nb')
  })
})

describe('gradeRecall (AST compare)', () => {
  it('accepts code that means the same, whatever the spacing or quotes', async () => {
    const r = await gradeRecall(fakeRunner({ sameAst: true }), "x='a'", 'x = "a"\n', { stdout: '', vars: {} })
    expect(r).toEqual({ ok: true, how: 'same-code' })
  })

  it('also accepts different code with the same output and variables', async () => {
    const runner = fakeRunner({ sameAst: false, run: { stdout: '7\n', vars: { n: v('7') }, error: null } })
    const r = await gradeRecall(runner, 'n = 7\nprint(n)', 'n = 7\nprint(7)', { stdout: '7', vars: { n: v('7') } })
    expect(r.ok).toBe(true)
  })

  it('explains a wrong variable value', async () => {
    const runner = fakeRunner({ run: { stdout: '12\n', vars: { apples: v("'12'", 'str') }, error: null } })
    const r = await gradeByResult(runner, '', { stdout: '12', vars: { apples: v('12') } })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/apples holds '12', expected 12 \(str instead of int\)/)
  })

  it('reports a Python error', async () => {
    const error = { type: 'NameError', message: "NameError: name 'x' is not defined", line: 1 }
    const r = await gradeByResult(fakeRunner({ run: { stdout: '', vars: {}, error } }), '', { stdout: '', vars: {} })
    expect(r).toMatchObject({ ok: false, error })
  })
})

describe('gradeTests (hidden test cases)', () => {
  it('passes when every test passes', async () => {
    const r = await gradeTests(fakeRunner({ tests: [{ name: 'a', ok: true, message: '' }] }), '', [])
    expect(r.ok).toBe(true)
  })

  it('says which test failed, in plain words', async () => {
    const tests = [
      { name: 'prints the sentence', ok: true, message: '' },
      { name: 'pages holds a number', ok: false, message: 'pages should hold the number 212' },
    ]
    const r = await gradeTests(fakeRunner({ tests }), '', [])
    expect(r).toMatchObject({ ok: false, failedTest: 'pages holds a number', passed: 1, total: 2 })
  })
})

describe('typed predict', () => {
  it('compares output exactly, ignoring trailing whitespace', () => {
    expect(gradeTypedOutput('5 \n', '5').ok).toBe(true)
    expect(gradeTypedOutput('1', '5').ok).toBe(false)
  })
})

describe('fallbacks when Python cannot load', () => {
  it('faded compares blanks loosely', () => {
    expect(fallbackFaded(['drink'], ['drink']).ok).toBe(true)
    expect(fallbackFaded(["'x'"], ['"x"']).ok).toBe(true)
    expect(fallbackFaded(['12', '16'], ['12', '15']).ok).toBe(false)
  })

  it('parsons needs the original order', () => {
    expect(fallbackParsons(['a', 'b'], ['a', 'b']).ok).toBe(true)
    expect(fallbackParsons(['b', 'a'], ['a', 'b']).ok).toBe(false)
  })

  it('recall compares lines loosely and says which line is off', () => {
    expect(fallbackRecall("coins=3\nprint('Coins:',coins)", 'coins = 3\nprint("Coins:", coins)').ok).toBe(true)
    expect(fallbackRecall('# 1. make coins\ncoins = 3\n\n# 2. print it\nprint(coins)', 'coins = 3\nprint(coins)').ok).toBe(true)
    const r = fallbackRecall('coins = 3\nprint(coins)', 'coins = 3\nprint("Coins:", coins)')
    expect(r).toMatchObject({ ok: false, message: 'Line 2 does not match yet.' })
  })
})

describe('expectedFromTrace', () => {
  it('takes all output and the last variables', () => {
    const e = expectedFromTrace([
      { line: 1, vars: { a: v('1') }, stdout: '' },
      { line: 2, vars: { a: v('1') }, stdout: '1\n' },
    ])
    expect(e).toEqual({ stdout: '1', vars: { a: v('1') } })
  })
})

describe('retries and show answer', () => {
  it('wrong tries never fail the item, they unlock Show answer after 2', () => {
    let a = newAttempts()
    a = recordTry(a, false)
    expect(canShowAnswer(a)).toBe(false)
    a = recordTry(a, false)
    expect(canShowAnswer(a)).toBe(true)
    a = recordTry(a, true)
    expect(a).toMatchObject({ solved: true, gaveUp: false, wrong: 2 })
    expect(canShowAnswer(a)).toBe(false)
  })

  it('giving up solves the item but marks it weak', () => {
    const a = giveUp(recordTry(recordTry(newAttempts(), false), false))
    expect(a).toMatchObject({ solved: true, gaveUp: true })
  })
})

describe('run options', () => {
  it('collects expression lines from example lines and asks for ids for refs', () => {
    const ex = { lines: [{ code: 'a = 1' }, { code: 'b = a[0]', expr: true }], visuals: ['cells', 'refs'] }
    expect(runOptions(ex)).toEqual({ expr: [2], ids: true })
    expect(runOptions({ lines: ['x = 1'] })).toBeUndefined()
  })
})
