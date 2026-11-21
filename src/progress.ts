import { useSyncExternalStore } from 'react'
import type { Mode } from './engine/types.ts'

// Progress lives in localStorage. Every access is wrapped so the app still
// works in private windows or when storage is blocked (progress just is not kept).

export interface ModeProgress {
  done: boolean
  wpm?: number
  accuracy?: number
  peeks?: number
  score?: number
  total?: number
  at?: number
}

export type LessonProgress = Partial<Record<Mode, ModeProgress>>
export type Progress = Record<string, LessonProgress>

const KEY = 'tracetype:progress:v1'
const listeners = new Set<() => void>()

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Progress) : {}
  } catch {
    return {}
  }
}

let cache: Progress = read()

function write(next: Progress) {
  cache = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable: keep progress in memory for this visit only.
  }
  listeners.forEach((l) => l())
}

/** Saves a finished mode. Keeps the best numbers from earlier runs. */
export function saveModeResult(lessonId: string, mode: Mode, result: Omit<ModeProgress, 'done' | 'at'>) {
  const lesson = cache[lessonId] ?? {}
  const prev = lesson[mode]
  const merged: ModeProgress = { ...result, done: true, at: Date.now() }
  if (prev) {
    if (prev.wpm !== undefined && merged.wpm !== undefined) merged.wpm = Math.max(prev.wpm, merged.wpm)
    if (prev.accuracy !== undefined && merged.accuracy !== undefined) merged.accuracy = Math.max(prev.accuracy, merged.accuracy)
    if (prev.peeks !== undefined && merged.peeks !== undefined) merged.peeks = Math.min(prev.peeks, merged.peeks)
    if (prev.score !== undefined && merged.score !== undefined && prev.score > merged.score) {
      merged.score = prev.score
      merged.total = prev.total
    }
  }
  write({ ...cache, [lessonId]: { ...lesson, [mode]: merged } })
}

export function resetProgress() {
  write({})
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read()
      cb()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, () => cache)
}

export function isLessonComplete(p: LessonProgress | undefined): boolean {
  return Boolean(p?.learn?.done && p?.trace?.done && p?.recall?.done && p?.quiz?.done)
}
