import { useSyncExternalStore } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'lesson'; id: string; step?: string }
  | { page: 'style' }
  | { page: 'hero' }
  | { page: 'notfound' }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts.length === 0) return { page: 'home' }
  if (parts[0] === 'style') return { page: 'style' }
  if (parts[0] === 'hero') return { page: 'hero' }
  if (parts[0] === 'lesson' && parts[1]) {
    return { page: 'lesson', id: decodeURIComponent(parts[1]), step: parts[2] }
  }
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
