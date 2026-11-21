// Shared lesson types. Used by the app and by scripts/validate_lessons.ts.

export type BookId =
  | 'learning-python'
  | 'python-for-data-analysis'
  | 'data-science-from-scratch'
  | 'hands-on-ml'

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

export interface LessonLine {
  code: string
  explain: string
  task: string
}

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  why: string
}

export interface VarValue {
  repr: string
  type: string
}

export interface TraceStep {
  /** 1-based source line that just finished running. */
  line: number
  /** Every user variable after this step ran. */
  vars: Record<string, VarValue>
  /** Only the new text printed by this step. */
  stdout: string
  /** Set when the step ran inside a function. */
  func?: string
  /** Local variables of that function call. */
  locals?: Record<string, VarValue>
}

export type VisualKind = 'memory'

export interface Lesson {
  id: string
  track: string
  order: number
  title: string
  summary: string
  intro: string
  bookRefs: BookRef[]
  visual: VisualKind
  lines: LessonLine[]
  quiz: QuizQuestion[]
  trace: TraceStep[]
  /** sha256 of the code the trace was generated from. Written by trace_lesson.py. */
  traceHash: string
}

export interface Track {
  id: string
  title: string
  description: string
  order: number
}

export type Mode = 'learn' | 'trace' | 'recall' | 'quiz'
export const MODES: Mode[] = ['learn', 'trace', 'recall', 'quiz']
