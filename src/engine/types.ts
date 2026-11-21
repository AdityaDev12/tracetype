// Shared content types (lesson format v2). Used by the app and by
// scripts/validate_lessons.ts. Nothing here is specific to one language.

export type BookId = 'learning-python' | 'python-for-data-analysis' | 'data-science-from-scratch' | 'hands-on-ml'

export const BOOK_TITLES: Record<BookId, string> = {
  'learning-python': 'Learning Python',
  'python-for-data-analysis': 'Python for Data Analysis',
  'data-science-from-scratch': 'Data Science from Scratch',
  'hands-on-ml': 'Hands-On Machine Learning',
}

export interface BookRef {
  book: BookId
  chapter: string
}

export interface LessonLink {
  title: string
  url: string
}

export interface VarValue {
  repr: string
  type: string
}

export interface TraceStep {
  /** 1-based source line that just finished running. */
  line: number
  /** Every variable after this step ran. */
  vars: Record<string, VarValue>
  /** Only the new text printed by this step. */
  stdout: string
  func?: string
  locals?: Record<string, VarValue>
}

/** Lines of code. */
export type Code = string[]

/** Hidden test for Fix, Modify, Make and projects. */
export interface CodeTest {
  name: string
  /** Code run before the learner's code. */
  pre?: string
  /** Code with asserts run after. The assert message is shown to the learner. */
  post?: string
  /** Exact expected output (trailing spaces and blank lines ignored). */
  stdout?: string
}

export interface Expected {
  stdout: string
  vars: Record<string, VarValue>
}

/** Fields written by scripts/trace_lesson.py. Never edited by hand. */
export interface Gen {
  hash: string
}

export interface PredictItem {
  id: string
  code: Code
  /** Defaults to "What does this print?" */
  q?: string
  kind: 'choice' | 'typed'
  options?: string[]
  why: string
  gen: Gen & { trace: TraceStep[]; output: string; answer?: number }
}

export interface ExampleLine {
  code: string
  explain: string
  /** What to write for this line in Recall. */
  task: string
  /** Short handwritten tutor note shown next to the line in Learn. */
  note?: string
  /** Part of the line the tutor circles in Learn. */
  circle?: string
}

export interface Example {
  id: string
  title: string
  lines: ExampleLine[]
  gen: Gen & { trace: TraceStep[] }
}

export interface InvestigateItem {
  id: string
  /** Index into examples. */
  example: number
  q: string
  options: string[]
  answer: number
  why: string
  /** Line to highlight while asking. */
  line?: number
  /** If set, the validator checks the answer against the real trace. */
  verify?: { line: number; name: string }
}

export interface FadedItem {
  id: string
  prompt: string
  /** Code with ___ for each blank. */
  code: Code
  /** One answer per blank, in order. */
  answers: string[]
  gen: Gen & { expected: Expected }
}

export interface ParsonsItem {
  id: string
  prompt: string
  /** The lines in the right order (shown shuffled). */
  lines: Code
  /** True if the learner must also set indentation. */
  indent?: boolean
  gen: Gen & { expected: Expected }
}

export interface FixItem {
  id: string
  prompt: string
  code: Code
  solution: Code
  tests: CodeTest[]
  hint?: string
  gen: Gen & { error: string | null }
}

export interface ModifyItem {
  id: string
  prompt: string
  code: Code
  solution: Code
  tests: CodeTest[]
  hint?: string
  gen: Gen
}

export interface MakeItem {
  id: string
  prompt: string
  starter?: Code
  solution: Code
  tests: CodeTest[]
  hints?: string[]
  gen: Gen
}

export interface RecallItem {
  /** Index into examples. */
  example: number
}

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  why: string
}

export interface Mistake {
  id: string
  title: string
  code: Code
  explain: string
  fix: Code
  gen: Gen & { error: string; line: number | null }
}

export type VisualKind = 'memory'

export interface Lesson {
  id: string
  track: string
  unit: string
  order: number
  title: string
  summary: string
  /** Language pack used for coloring and running code. */
  language: string
  minutes: number
  visual: VisualKind
  intro: { text: string; analogy: string }
  predict: PredictItem[]
  examples: Example[]
  investigate: InvestigateItem[]
  faded: FadedItem[]
  parsons: ParsonsItem[]
  fix: FixItem[]
  modify: ModifyItem[]
  recall: RecallItem[]
  make: MakeItem[]
  quiz: QuizQuestion[]
  mistakes: Mistake[]
  links: LessonLink[]
  bookRefs: BookRef[]
}

export interface Project {
  id: string
  unit: string
  title: string
  summary: string
  language: string
  prompt: string
  /** Step by step instructions, each with a hint that can be revealed. */
  steps: { text: string; hint: string }[]
  /** Exact output the program should print, shown to the learner. */
  output?: string
  starter?: Code
  solution: Code
  tests: CodeTest[]
  gen: Gen
}

export interface Unit {
  id: string
  title: string
  summary: string
  lessons: string[]
  /** Id of the mini project, if written. */
  project?: string
}

export interface Track {
  id: string
  title: string
  description: string
  language: string
  order: number
  status: 'open' | 'soon'
  book?: BookId
}

/** The steps of a lesson page, in order (PLAN.md section 3). */
export const STEP_KINDS = [
  'intro',
  'predict',
  'examples',
  'investigate',
  'faded',
  'parsons',
  'fix',
  'modify',
  'recall',
  'make',
  'quiz',
  'mistakes',
] as const
export type StepKind = (typeof STEP_KINDS)[number]

/** Minimum items per step, enforced by the validator. */
export const STEP_MINIMUMS: Record<Exclude<StepKind, 'intro'>, number> & { links: number } = {
  predict: 2,
  examples: 3,
  investigate: 3,
  faded: 2,
  parsons: 1,
  fix: 1,
  modify: 2,
  recall: 1,
  make: 1,
  quiz: 6,
  mistakes: 2,
  links: 1,
}
