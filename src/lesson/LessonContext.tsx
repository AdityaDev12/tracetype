import { createContext, useContext } from 'react'
import type { MascotMood } from '../brand/Mascot.tsx'
import type { Lesson } from '../engine/types.ts'
import type { LanguagePack, LiveRunner, RunnerStatus } from '../languages/index.ts'

export interface LessonCtx {
  lesson: Lesson
  pack: LanguagePack
  runner: LiveRunner | null
  status: RunnerStatus
  failure: string
  /** Start loading the code runner (Python) if it has not started. */
  needRunner: () => void
  retryRunner: () => void
  /** Make the mascot react. */
  react: (mood: MascotMood) => void
  /** "Show answer" was used on this item: it comes back for review sooner. */
  markWeak: (itemId: string) => void
}

export const LessonContext = createContext<LessonCtx | null>(null)

export function useLesson(): LessonCtx {
  const c = useContext(LessonContext)
  if (!c) throw new Error('useLesson outside a lesson page')
  return c
}

/** True when code can run: the runner is ready. */
export const canRun = (c: LessonCtx) => c.status === 'ready' && c.runner !== null
