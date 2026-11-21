import { useSyncExternalStore } from 'react'
import { emptyProgress, importProgress, migrateV1, type Progress } from './model.ts'

// Saves progress in localStorage. Every access is wrapped so the app still works
// when storage is blocked (progress then lasts for this visit only).

const KEY = 'tracetype:progress:v2'
const V1_KEY = 'tracetype:progress:v1'

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Storage unavailable: keep going in memory.
  }
}

function load(): Progress {
  const raw = readStorage(KEY)
  if (raw) {
    try {
      return importProgress(raw)
    } catch {
      return emptyProgress()
    }
  }
  // First visit since v2: carry over v1 progress if there is any, then drop it.
  const v1 = readStorage(V1_KEY)
  if (v1) {
    let p = emptyProgress()
    try {
      p = migrateV1(JSON.parse(v1), new Date())
    } catch {
      // Unreadable v1 data: start clean.
    }
    writeStorage(KEY, JSON.stringify(p))
    writeStorage(V1_KEY, null)
    return p
  }
  return emptyProgress()
}

let state: Progress = load()
const listeners = new Set<() => void>()
const xpListeners = new Set<(gain: number) => void>()

function set(next: Progress) {
  const gain = next.xp - state.xp
  state = next
  writeStorage(KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
  if (gain > 0) xpListeners.forEach((l) => l(gain))
}

export function getProgress(): Progress {
  return state
}

export function updateProgress(fn: (p: Progress) => Progress) {
  const next = fn(state)
  if (next !== state) set(next)
}

export function replaceProgress(p: Progress) {
  state = p
  writeStorage(KEY, JSON.stringify(p))
  listeners.forEach((l) => l())
}

export function resetProgress() {
  replaceProgress(emptyProgress())
}

/** Called with the XP gained whenever progress earns XP. */
export function onXp(cb: (gain: number) => void) {
  xpListeners.add(cb)
  return () => {
    xpListeners.delete(cb)
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load()
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
  return useSyncExternalStore(subscribe, () => state)
}

/** True if this visitor has done anything yet (decides landing vs dashboard). */
export function hasProgress(p: Progress): boolean {
  return p.xp > 0 || Object.keys(p.lessons).length > 0
}
