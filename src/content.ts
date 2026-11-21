import tracksData from '../content/tracks.json'
import type { Lesson, Project, Track, Unit } from './engine/types.ts'
import { validateLesson, validateProject } from './engine/validate.ts'

// All course content, bundled at build time. Invalid files are skipped (and
// reported in the console) so one bad lesson cannot break the site.

const lessonFiles = import.meta.glob('../content/lessons/**/*.json', { eager: true, import: 'default' })
const projectFiles = import.meta.glob('../content/projects/*.json', { eager: true, import: 'default' })
const unitFiles = import.meta.glob('../content/units/*.json', { eager: true, import: 'default' })

function load<T>(files: Record<string, unknown>, check: (d: unknown) => string[]): Map<string, T> {
  const out = new Map<string, T>()
  for (const [path, data] of Object.entries(files)) {
    const errors = check(data)
    if (errors.length) {
      console.error(`Skipping invalid content ${path}:\n${errors.join('\n')}`)
      continue
    }
    out.set((data as { id: string }).id, data as T)
  }
  return out
}

const lessons = load<Lesson>(lessonFiles, validateLesson)
const projects = load<Project>(projectFiles, validateProject)

export const tracks: Track[] = [...(tracksData as Track[])].sort((a, b) => a.order - b.order)

const unitsByTrack = new Map<string, Unit[]>()
for (const data of Object.values(unitFiles)) {
  const { track, units } = data as { track: string; units: Unit[] }
  unitsByTrack.set(
    track,
    units.map((u) => ({ ...u, lessons: u.lessons.filter((id) => lessons.has(id)) })),
  )
}

export const findTrack = (id: string) => tracks.find((t) => t.id === id)
export const findLesson = (id: string) => lessons.get(id)
export const findProject = (id: string) => projects.get(id)
export const unitsFor = (trackId: string): Unit[] => unitsByTrack.get(trackId) ?? []

export function findUnit(unitId: string): { unit: Unit; track: Track } | undefined {
  for (const t of tracks) {
    const unit = unitsFor(t.id).find((u) => u.id === unitId)
    if (unit) return { unit, track: t }
  }
  return undefined
}

/** Lesson ids of a track in recommended order. */
export function lessonOrder(trackId: string): string[] {
  return unitsFor(trackId).flatMap((u) => u.lessons)
}

export function nextLessonId(lessonId: string): string | undefined {
  const l = findLesson(lessonId)
  if (!l) return undefined
  const order = lessonOrder(l.track)
  return order[order.indexOf(lessonId) + 1]
}

export const allLessons = () => [...lessons.values()]
