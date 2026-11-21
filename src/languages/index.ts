import type { Token } from '../engine/tokens.ts'
import { tokenize as pythonTokenize } from './python/highlight.ts'

// Language packs (UNIVERSAL.md). Everything language specific lives behind this
// interface: syntax coloring now, and the in-browser runner (loaded lazily).

export interface LanguagePack {
  id: string
  name: string
  /** File extension for terminal panel titles. */
  ext: string
  tokenize: (line: string) => Token[]
}

const PACKS: Record<string, LanguagePack> = {
  python: { id: 'python', name: 'Python', ext: '.py', tokenize: pythonTokenize },
}

export function languagePack(id: string): LanguagePack {
  return PACKS[id] ?? PACKS.python
}
