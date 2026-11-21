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
  /** Heap id when the value is a container or an object (trace v2). */
  ref?: string
  /** The real characters, for strings (capped). */
  text?: string
  /** How many characters or items were cut off. */
  more?: number
}

/** Objects in the heap of a trace step (trace v2), keyed by stable ids like "o1". */
export type HeapObject =
  | { kind: 'list' | 'tuple' | 'set'; type: string; items: VarValue[]; more?: number }
  | { kind: 'dict'; type: string; items: [VarValue, VarValue][]; more?: number }
  | { kind: 'range'; type: string; start: number; stop: number; step: number; len: number }
  | { kind: 'function'; type: string; name: string; params: string[] }
  | { kind: 'module'; type: string; name: string }
  | { kind: 'generator'; type: string; name: string; state: 'new' | 'running' | 'paused' | 'done'; line: number | null }
  | { kind: 'file'; type: string; name: string; mode: string; closed: boolean; pos?: number }
  | {
      kind: 'class'
      type: string
      name: string
      bases: string[]
      attrs: Record<string, VarValue>
      methods: string[]
    }
  | { kind: 'object'; type: string; cls: string; classRef: string; attrs: Record<string, VarValue> }

export interface StackFrame {
  func: string
  /** For the frame that just ran a line: that line. For callers: the calling line. */
  line: number
  locals: Record<string, VarValue>
}

export interface ExprStep {
  text: string
  /** The part that was just computed (absent when names were looked up). */
  part?: string
  /** Its value. */
  value?: string
  /** Parts never run because of short-circuit (and, or, a if b else c). */
  skipped?: string[]
}

/** What happened during a step (trace v2). */
export type TraceEvent =
  | { kind: 'call'; func: string; args: Record<string, VarValue> }
  | { kind: 'resume'; func: string }
  | { kind: 'return' | 'yield'; func: string; value: VarValue }
  | { kind: 'test'; line: number; stmt: 'if' | 'elif' | 'while' | 'case'; result: boolean }
  | { kind: 'loop'; line: number; stmt: 'for' | 'while'; round: number; done?: boolean }
  | { kind: 'break' | 'continue'; line: number; loop: number }
  | { kind: 'raise'; type: string; message: string; line: number; func: string }
  | { kind: 'unwind'; func: string; line: number }
  | { kind: 'caught'; type: string; line: number }
  | { kind: 'finally'; line: number }
  | { kind: 'input'; prompt: string; value: string; index: number }
  | { kind: 'expr'; line: number; steps: ExprStep[] }

export interface TraceStep {
  /** 1-based source line that just finished running. */
  line: number
  /** Every module-level variable after this step ran. */
  vars: Record<string, VarValue>
  /** Only the new text printed by this step. */
  stdout: string
  /** Innermost function frame, when this step ran inside a function. */
  func?: string
  locals?: Record<string, VarValue>
  /** Every active function frame, outermost first (trace v2). */
  stack?: StackFrame[]
  heap?: Record<string, HeapObject>
  events?: TraceEvent[]
  /** The virtual folder, only on steps where it changed. */
  files?: Record<string, string>
}

/** Run options shared by tracing, running and tests. */
export interface RunOptions {
  /** What input() returns, in order. */
  stdin?: string[]
  /** Seed files for the virtual folder (also turns on file recording). */
  files?: Record<string, string>
  /** Lines (1-based) that get expression steps. */
  expr?: number[]
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
  /** What input() returns, in order. */
  stdin?: string[]
  /** Seed files for the virtual folder. */
  files?: Record<string, string>
}

/** Optional run options an item can carry (see RunOptions). */
export interface WithRunOptions {
  stdin?: string[]
  files?: Record<string, string>
  expr?: number[]
}

/** "Change this value and watch": a literal in the code the learner can edit. */
export interface Knob {
  /** 1-based line the value is on. */
  line: number
  /** The exact text to replace on that line (its first occurrence). */
  find: string
  label: string
  /** number: a slider/number box. text: a text box (quotes are kept). */
  kind: 'number' | 'text'
  min?: number
  max?: number
  step?: number
}

/** What an item can say about how it is shown. */
export interface WithVisuals {
  /** Panels to show, in order. Defaults to the lesson's visuals, then memory. Output is always shown. */
  visuals?: VisualKind[]
  knobs?: Knob[]
  /** Variable names the cells and history panels focus on. */
  focus?: string[]
}

export interface Expected {
  stdout: string
  vars: Record<string, VarValue>
}

/** Fields written by scripts/trace_lesson.py. Never edited by hand. */
export interface Gen {
  hash: string
}

export interface PredictItem extends WithRunOptions, WithVisuals {
  id: string
  code: Code
  /** Defaults to "What does this print?" */
  q?: string
  kind: 'choice' | 'typed'
  options?: string[]
  why: string
  /** The program is meant to stop with an error (the answer's last line is the error type). */
  raises?: boolean
  gen: Gen & {
    trace: TraceStep[]
    traceVersion?: number
    output: string
    answer?: number
    error?: { type: string; message: string; line: number | null }
    events?: TraceEvent[]
  }
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
  /** Record expression steps for this line. */
  expr?: boolean
}

export interface Example extends WithRunOptions, WithVisuals {
  id: string
  title: string
  lines: ExampleLine[]
  /** The example stops with an error on purpose (it cannot be used for Recall). */
  raises?: boolean
  gen: Gen & { trace: TraceStep[]; traceVersion?: number; error?: { type: string; message: string; line: number | null } }
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

export interface FadedItem extends WithRunOptions {
  id: string
  prompt: string
  /** Code with ___ for each blank. */
  code: Code
  /** One answer per blank, in order. */
  answers: string[]
  gen: Gen & { expected: Expected }
}

export interface ParsonsItem extends WithRunOptions {
  id: string
  prompt: string
  /** The lines in the right order (shown shuffled). */
  lines: Code
  /** True if the learner must also set indentation. */
  indent?: boolean
  gen: Gen & { expected: Expected }
}

export interface FixItem extends WithRunOptions {
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

export interface Mistake extends WithRunOptions {
  id: string
  title: string
  code: Code
  explain: string
  fix: Code
  gen: Gen & { error: string; line: number | null }
}

/** Visual panels (docs: content/syllabus.md "Visuals"). Output is always shown. */
export const VISUAL_KINDS = ['memory', 'history', 'expr', 'halt', 'types', 'stdin', 'cells', 'branch', 'loop', 'tracetable', 'grid'] as const
export type VisualKind = (typeof VISUAL_KINDS)[number]

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
  /** Default panels for this lesson's items. */
  visuals?: VisualKind[]
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

/** The steps of a lesson page, in order (docs/PLAN.md section 3). */
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
