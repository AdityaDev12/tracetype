import tracksData from '../content/tracks.json'
import type { Lesson, Track } from './engine/types.ts'
import { validateLesson } from './engine/validate.ts'

// Every lesson JSON is bundled at build time.
const modules = import.meta.glob('../content/lessons/**/*.json', { eager: true, import: 'default' })

function load(): Lesson[] {
  const out: Lesson[] = []
  for (const [path, data] of Object.entries(modules)) {
    const errors = validateLesson(data)
    if (errors.length) {
      console.error(`Skipping invalid lesson ${path}:\n${errors.join('\n')}`)
      continue
    }
    out.push(data as Lesson)
  }
  return out
}

export const lessons: Lesson[] = load()

export const tracks: Track[] = [...(tracksData as Track[])].sort((a, b) => a.order - b.order)

export function lessonsForTrack(trackId: string): Lesson[] {
  return lessons.filter((l) => l.track === trackId).sort((a, b) => a.order - b.order)
}

export function findLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id)
}
