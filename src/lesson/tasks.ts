import type { CodeTest, Lesson } from '../engine/types.ts'

export interface CodeTask {
  id: string
  prompt: string
  start: string[]
  solution: string[]
  tests: CodeTest[]
  hints: string[]
}

export function tasksFor(kind: 'fix' | 'modify' | 'make', lesson: Lesson): CodeTask[] {
  if (kind === 'fix') return lesson.fix.map((x) => ({ id: x.id, prompt: x.prompt, start: x.code, solution: x.solution, tests: x.tests, hints: x.hint ? [x.hint] : [] }))
  if (kind === 'modify') return lesson.modify.map((x) => ({ id: x.id, prompt: x.prompt, start: x.code, solution: x.solution, tests: x.tests, hints: x.hint ? [x.hint] : [] }))
  return lesson.make.map((x) => ({ id: x.id, prompt: x.prompt, start: x.starter ?? [], solution: x.solution, tests: x.tests, hints: x.hints ?? [] }))
}
