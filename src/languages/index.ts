import type { CodeRunner } from '../engine/grade.ts'
import type { Token } from '../engine/tokens.ts'
import { explainPythonError } from './python/errors.ts'
import { tokenize as pythonTokenize } from './python/highlight.ts'

// Language packs (docs/UNIVERSAL.md). Everything language specific lives behind this
// interface. The runner is loaded lazily, only when code first has to run.

export type RunnerStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface LiveRunner extends CodeRunner {
  status: RunnerStatus
  failure: string
  subscribe: (cb: () => void) => () => void
  load: () => Promise<void>
  retry: () => void
}

export interface LanguagePack {
  id: string
  name: string
  /** File extension for terminal panel titles. */
  ext: string
  tokenize: (line: string) => Token[]
  /** Plain-word explanation of an error message, if known. */
  explainError: (message: string) => string | null
  /** Loads the in-browser runner. Undefined if this language has none. */
  runner?: () => Promise<LiveRunner>
}

const PACKS: Record<string, LanguagePack> = {
  python: {
    id: 'python',
    name: 'Python',
    ext: '.py',
    tokenize: pythonTokenize,
    explainError: explainPythonError,
    runner: () => import('./python/runner.ts').then((m) => m.pythonRunner),
  },
}

export function languagePack(id: string): LanguagePack {
  return PACKS[id] ?? PACKS.python
}
