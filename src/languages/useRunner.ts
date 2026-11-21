import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { languagePack, type LiveRunner, type RunnerStatus } from './index.ts'

const noop = () => () => {}

/**
 * The live runner for a language, plus its status. Nothing is downloaded until
 * `load()` is called (or `eager` is true).
 */
export function useRunner(language: string, eager = false): { runner: LiveRunner | null; status: RunnerStatus; failure: string; load: () => void } {
  const [runner, setRunner] = useState<LiveRunner | null>(null)
  const [want, setWant] = useState(eager)

  useEffect(() => {
    if (!want || runner) return
    const pack = languagePack(language)
    let alive = true
    pack.runner?.().then((r) => {
      if (!alive) return
      setRunner(r)
      void r.load()
    })
    return () => {
      alive = false
    }
  }, [want, runner, language])

  const status = useSyncExternalStore(runner?.subscribe ?? noop, () => runner?.status ?? (want ? 'loading' : 'idle'))
  const load = useCallback(() => setWant(true), [])
  return { runner, status, failure: runner?.failure ?? '', load }
}
