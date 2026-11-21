import { authored } from './hash.ts'
import { stepForSourceLine } from './trace.ts'
import { BOOK_TITLES, STEP_MINIMUMS, VISUAL_KINDS, type TraceStep } from './types.ts'

// Pure schema checks for lesson format v2 (no Node or browser APIs). The
// validate script adds the hash checks (is every gen field up to date?).

const DASHES = /[—–]/
const HEX64 = /^[0-9a-f]{64}$/

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const nonEmpty = (v: unknown): v is string => isStr(v) && v.trim() !== ''
const isCode = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(isStr)

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

class Checker {
  errors: string[] = []
  need(cond: unknown, msg: string) {
    if (!cond) this.errors.push(msg)
    return Boolean(cond)
  }
}

function checkCode(c: Checker, code: unknown, where: string) {
  if (!c.need(isCode(code), `${where} must be a non-empty list of code lines`)) return
  ;(code as string[]).forEach((line, i) => {
    c.need(!line.includes('\t'), `${where}[${i}] uses a tab, use spaces`)
    c.need(line === line.trimEnd(), `${where}[${i}] has trailing spaces`)
  })
}

/** visuals, knobs and focus on an item (or the lesson). */
function checkVisuals(c: Checker, item: Obj, code: string[], where: string) {
  if (item.visuals !== undefined) {
    const ok = Array.isArray(item.visuals) && item.visuals.every((v) => (VISUAL_KINDS as readonly unknown[]).includes(v))
    c.need(ok, `${where}.visuals must be a list of: ${VISUAL_KINDS.join(', ')}`)
  }
  if (item.focus !== undefined) c.need(Array.isArray(item.focus) && item.focus.every(nonEmpty), `${where}.focus must be a list of names`)
  if (item.knobs === undefined) return
  if (!c.need(Array.isArray(item.knobs), `${where}.knobs must be a list`)) return
  ;(item.knobs as unknown[]).forEach((raw, i) => {
    const w = `${where}.knobs[${i}]`
    if (!c.need(isObj(raw), `${w} must be an object`)) return
    const k = raw as Obj
    const line = code[(k.line as number) - 1]
    c.need(Number.isInteger(k.line) && line !== undefined, `${w}.line must be a line of the code`)
    c.need(nonEmpty(k.label), `${w}.label is missing`)
    c.need(k.kind === 'number' || k.kind === 'text', `${w}.kind must be "number" or "text"`)
    if (!c.need(nonEmpty(k.find) && line !== undefined && line.includes(k.find as string), `${w}.find must be part of line ${String(k.line)}`)) return
    const find = k.find as string
    if (k.kind === 'number') c.need(!Number.isNaN(Number(find)), `${w}.find must be a number for a number knob`)
    if (k.kind === 'text') c.need(/^(["']).*\1$/.test(find), `${w}.find must be a quoted string for a text knob`)
  })
}

function checkGen(c: Checker, item: Obj, where: string): Obj | null {
  const gen = item.gen
  if (!c.need(isObj(gen) && isStr(gen.hash) && HEX64.test(gen.hash), `${where}.gen is missing. Run: npm run trace -- <file>`)) {
    return null
  }
  return gen as Obj
}

/** Trace format written by runtime.py (v2: heap, stack, events, files). */
export const TRACE_VERSION = 2
/** Stored traces stay small: a lesson example should be short enough to step through. */
export const MAX_TRACE_STEPS = 400

function checkTrace(c: Checker, trace: unknown, lines: number, where: string, version?: unknown) {
  if (!c.need(Array.isArray(trace) && trace.length > 0, `${where} trace is empty`)) return
  c.need(version === TRACE_VERSION, `${where} trace is not format v${TRACE_VERSION}. Run: npm run trace -- <file>`)
  c.need((trace as unknown[]).length <= MAX_TRACE_STEPS, `${where} trace has ${(trace as unknown[]).length} steps (max ${MAX_TRACE_STEPS}). Make the example shorter`)
  ;(trace as Obj[]).forEach((s, i) => {
    c.need(typeof s.line === 'number' && s.line >= 1 && s.line <= lines, `${where} trace[${i}].line out of range`)
    c.need(isObj(s.vars) && isStr(s.stdout), `${where} trace[${i}] needs vars and stdout`)
  })
}

function checkTests(c: Checker, tests: unknown, where: string) {
  if (!c.need(Array.isArray(tests) && tests.length > 0, `${where}.tests needs at least one test`)) return
  ;(tests as Obj[]).forEach((t, i) => {
    c.need(nonEmpty(t.name), `${where}.tests[${i}] needs a name`)
    c.need(t.stdout !== undefined || t.post !== undefined, `${where}.tests[${i}] must check stdout or have a post check`)
  })
}

function checkChoice(c: Checker, q: Obj, where: string) {
  c.need(nonEmpty(q.q), `${where}.q must be a question`)
  const opts = q.options
  if (c.need(Array.isArray(opts) && opts.length >= 2 && opts.every(isStr), `${where}.options needs 2 or more strings`)) {
    c.need(new Set(opts as string[]).size === (opts as string[]).length, `${where}.options has duplicates`)
    c.need(
      typeof q.answer === 'number' && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (opts as string[]).length,
      `${where}.answer must be a valid option index`,
    )
  }
  c.need(nonEmpty(q.why), `${where}.why must explain the answer`)
}

/** Copy of a lesson or project without any generated fields. */
export function stripGen(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripGen)
  if (isObj(value)) {
    const out: Obj = {}
    for (const [k, v] of Object.entries(authored(value))) out[k] = stripGen(v)
    return out
  }
  return value
}

/** Returns a list of problems. Empty means the lesson is valid. */
export function validateLesson(data: unknown): string[] {
  const c = new Checker()
  if (!isObj(data)) return ['lesson must be a JSON object']

  for (const key of ['id', 'track', 'unit', 'title', 'summary', 'language'] as const) {
    c.need(nonEmpty(data[key]), `"${key}" must be a non-empty string`)
  }
  c.need(isStr(data.id) && /^[a-z0-9-]+$/.test(data.id), '"id" may only use lowercase letters, digits and dashes')
  c.need(Number.isInteger(data.order) && (data.order as number) >= 1, '"order" must be a positive integer')
  c.need(Number.isInteger(data.minutes) && (data.minutes as number) > 0, '"minutes" must be a positive whole number')
  c.need(data.visual === 'memory', '"visual" must be "memory"')
  checkVisuals(c, data, [], 'lesson')
  c.need(isObj(data.intro) && nonEmpty(data.intro.text) && nonEmpty(data.intro.analogy), '"intro" needs text and an analogy')

  // Minimum counts per step (docs/PLAN.md section 3).
  for (const [key, min] of Object.entries(STEP_MINIMUMS)) {
    const items = data[key]
    const n = Array.isArray(items) ? items.length : 0
    c.need(n >= min, `"${key}" needs at least ${min} (has ${n})`)
  }

  const ids = new Set<string>()
  const trackId = (item: Obj, where: string) => {
    if (c.need(nonEmpty(item.id), `${where}.id is missing`)) {
      c.need(!ids.has(item.id as string), `${where}.id "${String(item.id)}" is used twice`)
      ids.add(item.id as string)
    }
  }
  const list = (key: string) => (Array.isArray(data[key]) ? (data[key] as unknown[]) : []).filter(isObj)

  list('predict').forEach((p, i) => {
    const w = `predict[${i}]`
    trackId(p, w)
    checkCode(c, p.code, `${w}.code`)
    c.need(p.kind === 'choice' || p.kind === 'typed', `${w}.kind must be "choice" or "typed"`)
    c.need(nonEmpty(p.why), `${w}.why must explain the answer`)
    if (p.kind === 'choice') c.need(Array.isArray(p.options) && p.options.length >= 2, `${w}.options needs 2 or more`)
    checkVisuals(c, p, isCode(p.code) ? p.code : [], w)
    const gen = checkGen(c, p, w)
    if (gen) {
      checkTrace(c, gen.trace, isCode(p.code) ? p.code.length : 0, w, gen.traceVersion)
      c.need(isStr(gen.output), `${w}.gen.output missing`)
      if (p.raises) {
        const err = gen.error as Obj | undefined
        c.need(isObj(err) && isStr(gen.output) && gen.output.split('\n').pop() === err.type, `${w}: raises, so gen.output must end with the error type`)
      } else {
        c.need(gen.error === undefined, `${w}: the code raised an error. Add "raises": true if that is the point`)
      }
      if (p.kind === 'choice') c.need(typeof gen.answer === 'number', `${w}.gen.answer missing`)
    }
  })

  const examples = list('examples')
  examples.forEach((ex, i) => {
    const w = `examples[${i}]`
    trackId(ex, w)
    c.need(nonEmpty(ex.title), `${w}.title is missing`)
    const lines = Array.isArray(ex.lines) ? (ex.lines as unknown[]).filter(isObj) : []
    c.need(lines.length >= 2, `${w} needs at least 2 lines`)
    lines.forEach((l, j) => {
      checkCode(c, [l.code], `${w}.lines[${j}].code`)
      c.need(nonEmpty(l.explain), `${w}.lines[${j}].explain missing`)
      c.need(nonEmpty(l.task), `${w}.lines[${j}].task missing`)
      if (l.circle !== undefined) {
        c.need(isStr(l.circle) && isStr(l.code) && l.code.includes(l.circle), `${w}.lines[${j}].circle must be part of the code`)
      }
    })
    checkVisuals(c, ex, lines.map((l) => (isStr(l.code) ? l.code : '')), w)
    lines.forEach((l, j) => {
      if (l.expr !== undefined) c.need(typeof l.expr === 'boolean', `${w}.lines[${j}].expr must be true or false`)
    })
    const gen = checkGen(c, ex, w)
    if (gen) checkTrace(c, gen.trace, lines.length, w, gen.traceVersion)
  })

  list('investigate').forEach((q, i) => {
    const w = `investigate[${i}]`
    trackId(q, w)
    checkChoice(c, q, w)
    const ex = examples[q.example as number]
    if (!c.need(ex !== undefined, `${w}.example must point at an example`)) return
    const v = q.verify
    if (isObj(v) && isObj(ex.gen) && Array.isArray(ex.gen.trace)) {
      const trace = ex.gen.trace as TraceStep[]
      const got = trace[stepForSourceLine(trace, v.line as number)]?.vars[v.name as string]?.repr
      const shown = (q.options as string[] | undefined)?.[q.answer as number]
      c.need(
        got !== undefined && shown === got,
        `${w}: the real value of ${String(v.name)} after line ${String(v.line)} is ${got ?? 'missing'}, but the answer says ${shown}`,
      )
    }
  })

  list('faded').forEach((f, i) => {
    const w = `faded[${i}]`
    trackId(f, w)
    c.need(nonEmpty(f.prompt), `${w}.prompt missing`)
    checkCode(c, f.code, `${w}.code`)
    const blanks = isCode(f.code) ? f.code.join('\n').split('___').length - 1 : 0
    c.need(blanks > 0, `${w} has no ___ blanks`)
    c.need(Array.isArray(f.answers) && f.answers.length === blanks, `${w}: ${blanks} blanks but a different number of answers`)
    const gen = checkGen(c, f, w)
    if (gen) c.need(isObj(gen.expected), `${w}.gen.expected missing`)
  })

  list('parsons').forEach((p, i) => {
    const w = `parsons[${i}]`
    trackId(p, w)
    c.need(nonEmpty(p.prompt), `${w}.prompt missing`)
    checkCode(c, p.lines, `${w}.lines`)
    c.need(isCode(p.lines) && p.lines.length >= 3, `${w} needs at least 3 lines`)
    const gen = checkGen(c, p, w)
    if (gen) c.need(isObj(gen.expected), `${w}.gen.expected missing`)
  })

  for (const key of ['fix', 'modify'] as const) {
    list(key).forEach((x, i) => {
      const w = `${key}[${i}]`
      trackId(x, w)
      c.need(nonEmpty(x.prompt), `${w}.prompt missing`)
      checkCode(c, x.code, `${w}.code`)
      checkCode(c, x.solution, `${w}.solution`)
      checkTests(c, x.tests, w)
      checkGen(c, x, w)
    })
  }

  list('make').forEach((m, i) => {
    const w = `make[${i}]`
    trackId(m, w)
    c.need(nonEmpty(m.prompt), `${w}.prompt missing`)
    checkCode(c, m.solution, `${w}.solution`)
    checkTests(c, m.tests, w)
    checkGen(c, m, w)
  })

  list('recall').forEach((r, i) => {
    c.need(examples[r.example as number] !== undefined, `recall[${i}].example must point at an example`)
  })

  list('quiz').forEach((q, i) => checkChoice(c, q, `quiz[${i}]`))

  list('mistakes').forEach((m, i) => {
    const w = `mistakes[${i}]`
    trackId(m, w)
    c.need(nonEmpty(m.title) && nonEmpty(m.explain), `${w} needs a title and an explanation`)
    checkCode(c, m.code, `${w}.code`)
    checkCode(c, m.fix, `${w}.fix`)
    const gen = checkGen(c, m, w)
    if (gen) c.need(nonEmpty(gen.error), `${w}.gen.error missing`)
  })

  const seen = new Set<string>()
  list('links').forEach((l, i) => {
    c.need(nonEmpty(l.title) && isStr(l.url), `links[${i}] needs a title and a url`)
    if (isStr(l.url)) {
      c.need(isHttpsUrl(l.url), `links[${i}].url must be a full https:// address`)
      c.need(!seen.has(l.url), `links[${i}].url is listed twice`)
      seen.add(l.url)
    }
  })

  c.need(Array.isArray(data.bookRefs), '"bookRefs" must be a list')
  list('bookRefs').forEach((r, i) => {
    c.need(isStr(r.book) && r.book in BOOK_TITLES && nonEmpty(r.chapter), `bookRefs[${i}] needs a known book and a chapter title`)
  })

  // Writing style: no em or en dashes in anything an author wrote.
  c.need(!DASHES.test(JSON.stringify(stripGen(data))), 'lesson text contains an em dash or en dash')

  return c.errors
}

export function validateProject(data: unknown): string[] {
  const c = new Checker()
  if (!isObj(data)) return ['project must be a JSON object']
  for (const key of ['id', 'unit', 'title', 'summary', 'language', 'prompt'] as const) {
    c.need(nonEmpty(data[key]), `"${key}" must be a non-empty string`)
  }
  const steps = Array.isArray(data.steps) ? data.steps : []
  c.need(steps.length >= 2, '"steps" needs at least 2 steps')
  steps.forEach((s, i) => c.need(isObj(s) && nonEmpty(s.text) && nonEmpty(s.hint), `steps[${i}] needs text and a hint`))
  checkCode(c, data.solution, 'solution')
  c.need(isCode(data.solution) && data.solution.length >= 20, 'a mini project solution should be 20 to 40 lines')
  checkTests(c, data.tests, 'project')
  checkGen(c, data, 'project')
  c.need(!DASHES.test(JSON.stringify(stripGen(data))), 'project text contains an em dash or en dash')
  return c.errors
}
