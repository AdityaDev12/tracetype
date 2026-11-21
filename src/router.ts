import { useSyncExternalStore } from 'react'
import { MODES, type Mode } from './engine/types.ts'

export type Route =
  | { page: 'home' }
  | { page: 'lesson'; id: string; mode: Mode }
  | { page: 'style' }
  | { page: 'notfound' }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts.length === 0) return { page: 'home' }
  if (parts[0] === 'style') return { page: 'style' }
  if (parts[0] === 'lesson' && parts[1]) {
    const mode = MODES.includes(parts[2] as Mode) ? (parts[2] as Mode) : 'learn'
    return { page: 'lesson', id: decodeURIComponent(parts[1]), mode }
  }
  return { page: 'notfound' }
}

export function lessonHref(id: string, mode: Mode = 'learn'): string {
  return `#/lesson/${encodeURIComponent(id)}/${mode}`
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parseHash(hash)
}

export function navigate(href: string) {
  window.location.hash = href.replace(/^#/, '')
}
