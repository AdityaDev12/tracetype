import { useEffect, useState } from 'react'
import { loadLesson } from './content.ts'
import type { Lesson } from './engine/types.ts'

/** The whole lesson, loaded on demand. status is "loading" until it arrives. */
export function useFullLesson(id: string | undefined): { lesson?: Lesson; status: 'loading' | 'ready' | 'missing' } {
  const [state, setState] = useState<{ id?: string; lesson?: Lesson; done: boolean }>({ done: false })
  useEffect(() => {
    let live = true
    if (!id) return
    void loadLesson(id).then((lesson) => {
      if (live) setState({ id, lesson, done: true })
    })
    return () => {
      live = false
    }
  }, [id])
  if (!id) return { status: 'missing' }
  if (state.id !== id || !state.done) return { status: 'loading' }
  return state.lesson ? { lesson: state.lesson, status: 'ready' } : { status: 'missing' }
}
