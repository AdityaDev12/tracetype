import { useSyncExternalStore } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'welcome' }
  | { page: 'course' }
  | { page: 'track'; id: string }
  | { page: 'lesson'; id: string; step?: string }
  | { page: 'project'; id: string }
  | { page: 'unit-review'; id: string }
  | { page: 'review' }
  | { page: 'settings' }
  | { page: 'style' }
  | { page: 'notfound' }

export function parseHash(hash: string): Route {
  const parts = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((p) => decodeURIComponent(p))
  const [a, b, c] = parts
  if (!a) return { page: 'home' }
  if (a === 'welcome' || a === 'hero') return { page: 'welcome' }
  if (a === 'course' && !b) return { page: 'course' }
  if (a === 'track' && b) return { page: 'track', id: b }
  if (a === 'lesson' && b) return { page: 'lesson', id: b, step: c }
  if (a === 'project' && b) return { page: 'project', id: b }
  if (a === 'unit-review' && b) return { page: 'unit-review', id: b }
  if (a === 'review') return { page: 'review' }
  if (a === 'settings') return { page: 'settings' }
  if (a === 'style') return { page: 'style' }
  return { page: 'notfound' }
}

export function lessonHref(id: string, step?: string): string {
  return `#/lesson/${encodeURIComponent(id)}${step ? `/${step}` : ''}`
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
