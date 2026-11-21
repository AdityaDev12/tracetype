import { BOOK_TITLES, type Lesson } from './types.ts'

// Pure schema checks. No Node or browser APIs here so both the app and the
// validate script can use it. The script adds the traceHash check on top.

const EM_DASH = /[—–]/

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}

function checkVars(v: unknown, where: string, errors: string[]) {
  if (!isObj(v)) {
    errors.push(`${where} must be an object`)
    return
  }
  for (const [name, val] of Object.entries(v)) {
    if (!isObj(val) || !isStr(val.repr) || !isStr(val.type)) {
      errors.push(`${where}.${name} must be { repr: string, type: string }`)
    }
  }
}

/** Returns a list of problems. Empty list means the lesson is valid. */
export function validateLesson(data: unknown): string[] {
  const errors: string[] = []
  if (!isObj(data)) return ['lesson must be a JSON object']

  for (const key of ['id', 'track', 'title', 'summary', 'intro'] as const) {
    if (!isStr(data[key]) || (data[key] as string).trim() === '') {
      errors.push(`"${key}" must be a non-empty string`)
    }
  }
  if (isStr(data.id) && !/^[a-z0-9-]+$/.test(data.id)) {
    errors.push('"id" may only use lowercase letters, digits and dashes')
  }
  if (typeof data.order !== 'number' || !Number.isInteger(data.order) || data.order < 1) {
    errors.push('"order" must be a positive integer')
  }
  if (data.visual !== 'memory') errors.push('"visual" must be "memory"')

  if (!Array.isArray(data.bookRefs)) {
    errors.push('"bookRefs" must be an array')
  } else {
    data.bookRefs.forEach((r, i) => {
      if (!isObj(r) || !isStr(r.book) || !(r.book in BOOK_TITLES) || !isStr(r.chapter) || r.chapter === '') {
        errors.push(`bookRefs[${i}] needs a known "book" id and a "chapter" title`)
      }
    })
  }

  const lines = data.lines
  if (!Array.isArray(lines) || lines.length === 0) {
    errors.push('"lines" must be a non-empty array')
  } else {
    lines.forEach((l, i) => {
      if (!isObj(l)) {
        errors.push(`lines[${i}] must be an object`)
        return
      }
      if (!isStr(l.code)) errors.push(`lines[${i}].code must be a string`)
      if (isStr(l.code) && l.code.includes('\t')) errors.push(`lines[${i}].code must use spaces, not tabs`)
      if (isStr(l.code) && l.code !== l.code.trimEnd()) errors.push(`lines[${i}].code has trailing spaces`)
      if (!isStr(l.explain) || l.explain.trim() === '') errors.push(`lines[${i}].explain must be a non-empty string`)
      if (!isStr(l.task) || l.task.trim() === '') errors.push(`lines[${i}].task must be a non-empty string`)
    })
  }

  const quiz = data.quiz
  if (!Array.isArray(quiz) || quiz.length < 3 || quiz.length > 5) {
    errors.push('"quiz" must have 3 to 5 questions')
  } else {
    quiz.forEach((q, i) => {
      if (!isObj(q)) {
        errors.push(`quiz[${i}] must be an object`)
        return
      }
      if (!isStr(q.q) || q.q === '') errors.push(`quiz[${i}].q must be a non-empty string`)
      if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every(isStr)) {
        errors.push(`quiz[${i}].options must be 2 or more strings`)
      } else if (new Set(q.options).size !== q.options.length) {
        errors.push(`quiz[${i}].options has duplicates`)
      }
      if (
        typeof q.answer !== 'number' ||
        !Array.isArray(q.options) ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer >= q.options.length
      ) {
        errors.push(`quiz[${i}].answer must be a valid option index`)
      }
      if (!isStr(q.why) || q.why === '') errors.push(`quiz[${i}].why must be a non-empty string`)
    })
  }

  const trace = data.trace
  if (!Array.isArray(trace) || trace.length === 0) {
    errors.push('"trace" is missing or empty. Run: npm run trace -- <lesson file>')
  } else {
    const n = Array.isArray(lines) ? lines.length : 0
    trace.forEach((s, i) => {
      if (!isObj(s)) {
        errors.push(`trace[${i}] must be an object`)
        return
      }
      if (typeof s.line !== 'number' || s.line < 1 || s.line > n) {
        errors.push(`trace[${i}].line is out of range`)
      }
      checkVars(s.vars, `trace[${i}].vars`, errors)
      if (!isStr(s.stdout)) errors.push(`trace[${i}].stdout must be a string`)
      if (s.locals !== undefined) checkVars(s.locals, `trace[${i}].locals`, errors)
      if (s.func !== undefined && !isStr(s.func)) errors.push(`trace[${i}].func must be a string`)
    })
  }
  if (!isStr(data.traceHash) || !/^[0-9a-f]{64}$/.test(data.traceHash)) {
    errors.push('"traceHash" is missing. Run: npm run trace -- <lesson file>')
  }

  // Writing style: no em or en dashes anywhere in authored text.
  const authored: string[] = []
  for (const key of ['title', 'summary', 'intro'] as const) if (isStr(data[key])) authored.push(data[key] as string)
  if (Array.isArray(lines)) for (const l of lines) if (isObj(l)) authored.push(String(l.code), String(l.explain), String(l.task))
  if (Array.isArray(quiz)) for (const q of quiz) if (isObj(q)) authored.push(String(q.q), String(q.why), ...(Array.isArray(q.options) ? q.options.map(String) : []))
  if (authored.some((t) => EM_DASH.test(t))) errors.push('lesson text contains an em dash or en dash')

  return errors
}

export function isLesson(data: unknown): data is Lesson {
  return validateLesson(data).length === 0
}

/** The exact string trace_lesson.py hashes and runs. */
export function lessonSource(lines: { code: string }[]): string {
  return lines.map((l) => l.code).join('\n') + '\n'
}
