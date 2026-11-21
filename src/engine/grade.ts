import type { CodeTest, Expected, RunOptions, TraceEvent, TraceStep, VarValue } from './types.ts'
import { normalizeLoose } from './typing.ts'

// Grading rules (docs/PLAN.md section 4). Language neutral: code is run through a
// CodeRunner (Pyodide for Python). When no runner is available, simpler
// fallbacks are used so the site still works.

export interface RunError {
  type: string
  message: string
  line: number | null
  stage?: string
}

export interface RunResult {
  stdout: string
  vars: Record<string, VarValue>
  error: RunError | null
  /** The virtual folder at the end, when files were used. */
  files?: Record<string, string>
}

export interface TraceResult extends RunResult {
  version?: number
  steps: TraceStep[]
  /** Events after the last step (for example the error that stopped the program). */
  events?: TraceEvent[]
  stdin?: { given: number; used: number }
}

export interface TestResult {
  name: string
  ok: boolean
  message: string
  got?: string
  expected?: string
  error?: RunError
}

export interface CodeRunner {
  trace(src: string, options?: RunOptions): Promise<TraceResult>
  run(src: string, pre?: string, post?: string, options?: RunOptions): Promise<RunResult>
  tests(src: string, tests: CodeTest[]): Promise<TestResult[]>
  sameAst(a: string, b: string): Promise<boolean>
}

export type Verdict =
  | { ok: true; how: 'same-code' | 'same-result' | 'tests' | 'exact' | 'fallback' }
  | {
      ok: false
      message: string
      error?: RunError
      got?: string
      expected?: string
      failedTest?: string
      passed?: number
      total?: number
    }

export const sourceOf = (lines: string[]) => lines.join('\n') + '\n'

/** Same as normalize_output in runtime.py: ignore trailing spaces and blank lines at the end. */
export function normalizeOutput(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd())
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}

/** Expected final state of an example, from its trace. */
export function expectedFromTrace(trace: TraceStep[]): Expected {
  return {
    stdout: normalizeOutput(trace.map((s) => s.stdout).join('')),
    vars: trace.length ? trace[trace.length - 1].vars : {},
  }
}

function varsDiff(got: Record<string, VarValue>, want: Record<string, VarValue>): string | null {
  for (const [name, v] of Object.entries(want)) {
    const g = got[name]
    if (!g) return `${name} was never made`
    if (g.repr !== v.repr) {
      const kind = g.type !== v.type ? ` (${g.type} instead of ${v.type})` : ''
      return `${name} holds ${g.repr}, expected ${v.repr}${kind}`
    }
  }
  return null
}

/** Faded and Parsons: the program must run and end with the same output and variables. */
export async function gradeByResult(
  runner: CodeRunner,
  code: string,
  expected: Expected,
  options?: RunOptions,
): Promise<Verdict> {
  const r = await runner.run(code, '', '', runOptions(options))
  if (r.error) return { ok: false, message: r.error.message, error: r.error }
  const got = normalizeOutput(r.stdout)
  if (got !== expected.stdout) {
    return { ok: false, message: 'The output is different.', got, expected: expected.stdout }
  }
  const diff = varsDiff(r.vars, expected.vars)
  if (diff) return { ok: false, message: `The output is right, but ${diff}.` }
  return { ok: true, how: 'same-result' }
}

/** Recall: accepted if the code means the same (AST), or gives the same output and variables. */
export async function gradeRecall(
  runner: CodeRunner,
  code: string,
  solution: string,
  expected: Expected,
  options?: RunOptions,
): Promise<Verdict> {
  if (await runner.sameAst(code, solution)) return { ok: true, how: 'same-code' }
  return gradeByResult(runner, code, expected, options)
}

/** Only the run options from an item (stdin, files, expr), or undefined. */
export function runOptions(item?: RunOptions): RunOptions | undefined {
  if (!item) return undefined
  const out: RunOptions = {}
  if (item.stdin) out.stdin = item.stdin
  if (item.files) out.files = item.files
  if (item.expr) out.expr = item.expr
  return Object.keys(out).length ? out : undefined
}

/** Fix, Modify, Make, projects: run against hidden tests. */
export async function gradeTests(runner: CodeRunner, code: string, tests: CodeTest[]): Promise<Verdict> {
  const results = await runner.tests(code, tests)
  const failed = results.find((r) => !r.ok)
  const passed = results.filter((r) => r.ok).length
  if (!failed) return { ok: true, how: 'tests' }
  return {
    ok: false,
    message: failed.message,
    error: failed.error,
    got: failed.got,
    expected: failed.expected,
    failedTest: failed.name,
    passed,
    total: results.length,
  }
}

/** Predict (typed): exact output, ignoring trailing spaces and blank lines. */
export function gradeTypedOutput(answer: string, output: string): Verdict {
  return normalizeOutput(answer) === normalizeOutput(output)
    ? { ok: true, how: 'exact' }
    : { ok: false, message: 'Not quite. Run it in your head line by line.' }
}

// ---------- Fallbacks when code cannot run (Python failed to load) ----------

/** Faded without a runner: each blank must match its answer (spaces and quote style ignored). */
export function fallbackFaded(values: string[], answers: string[]): Verdict {
  const ok = answers.every((a, i) => normalizeLoose(values[i] ?? '') === normalizeLoose(a))
  return ok ? { ok: true, how: 'fallback' } : { ok: false, message: 'At least one blank is not what was expected.' }
}

/** Parsons without a runner: lines must be in the original order (with the right indentation). */
export function fallbackParsons(order: string[], lines: string[]): Verdict {
  const ok = order.length === lines.length && order.every((l, i) => l === lines[i])
  return ok ? { ok: true, how: 'fallback' } : { ok: false, message: 'Not in the right order yet.' }
}

/** Recall without a runner: compare line by line, ignoring spaces and quote style. */
export function fallbackRecall(code: string, solution: string): Verdict {
  // Comments (like the task hints in Recall) and blank lines are ignored.
  const clean = (s: string) =>
    s
      .split('\n')
      .map(normalizeLoose)
      .filter((l) => l.trim() !== '')
  const a = clean(code)
  const b = clean(solution)
  const bad = b.findIndex((l, i) => a[i] !== l)
  if (bad === -1 && a.length === b.length) return { ok: true, how: 'fallback' }
  return { ok: false, message: `Line ${bad === -1 ? b.length + 1 : bad + 1} does not match yet.` }
}

// ---------- Tries and "Show answer" ----------

export interface Attempts {
  wrong: number
  solved: boolean
  /** Used "Show answer". Marks the item as weak for review. */
  gaveUp: boolean
}

export const SHOW_ANSWER_AFTER = 2

export const newAttempts = (): Attempts => ({ wrong: 0, solved: false, gaveUp: false })

/** Wrong tries never fail an item. They only unlock "Show answer". */
export function recordTry(a: Attempts, ok: boolean): Attempts {
  if (a.solved) return a
  return ok ? { ...a, solved: true } : { ...a, wrong: a.wrong + 1 }
}

export const canShowAnswer = (a: Attempts) => !a.solved && a.wrong >= SHOW_ANSWER_AFTER

export function giveUp(a: Attempts): Attempts {
  return { ...a, gaveUp: true, solved: true }
}
