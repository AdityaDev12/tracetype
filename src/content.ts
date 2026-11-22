import tracksData from '../content/tracks.json'
import type { Lesson, Project, Track, Unit } from './engine/types.ts'
import { validateLesson, validateProject } from './engine/validate.ts'

// Course content. Tracks, units, projects and lesson metadata are bundled at
// build time; each full lesson (with its traces) is a separate file loaded when
// it is opened. Invalid lessons are skipped (and reported in the console) so one
// bad lesson cannot break the site.

const lessonMetaFiles = import.meta.glob('../content/lessons/**/*.json', { eager: true, query: '?meta', import: 'default' })
const lessonLoaders = import.meta.glob('../content/lessons/**/*.json', { import: 'default' })
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

/** A lesson's metadata: enough for lists, the course tree and review queues. */
export type LessonMeta = Pick<Lesson, 'id' | 'track' | 'unit' | 'order' | 'title' | 'summary' | 'language' | 'minutes'> & {
  items: { predict: string[]; faded: string[]; fix: string[]; make: string[] }
}

const lessons = new Map<string, LessonMeta>()
const lessonPaths = new Map<string, string>()
for (const [path, data] of Object.entries(lessonMetaFiles)) {
  const meta = data as LessonMeta
  if (typeof meta?.id !== 'string') continue
  lessons.set(meta.id, meta)
  lessonPaths.set(meta.id, path)
}

const fullLessons = new Map<string, Promise<Lesson | undefined>>()

/** Load a whole lesson (validated). Resolves to undefined if it is missing or invalid. */
export function loadLesson(id: string): Promise<Lesson | undefined> {
  const path = lessonPaths.get(id)
  if (!path) return Promise.resolve(undefined)
  if (!fullLessons.has(id)) {
    fullLessons.set(
      id,
      lessonLoaders[path]().then((data) => {
        const errors = validateLesson(data)
        if (errors.length) {
          console.error(`Skipping invalid content ${path}:\n${errors.join('\n')}`)
          return undefined
        }
        return data as Lesson
      }),
    )
  }
  return fullLessons.get(id)!
}
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
