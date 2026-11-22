import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

/** What every page may need about a lesson without loading the whole thing. */
export function lessonMeta(data: Record<string, unknown>) {
  const ids = (key: string) => (Array.isArray(data[key]) ? (data[key] as { id?: string }[]).map((x) => x.id ?? '') : [])
  return {
    id: data.id,
    track: data.track,
    unit: data.unit,
    order: data.order,
    title: data.title,
    summary: data.summary,
    language: data.language,
    minutes: data.minutes,
    items: { predict: ids('predict'), faded: ids('faded'), fix: ids('fix'), make: ids('make') },
  }
}

/** `lesson.json?meta` imports only the lesson's metadata, so the main bundle
 * stays small. The full lesson (with its traces) is loaded when it is opened. */
export function lessonMetaPlugin(): Plugin {
  return {
    name: 'tracetype-lesson-meta',
    enforce: 'pre',
    load(id) {
      if (!id.endsWith('.json?meta')) return null
      const file = id.slice(0, -'?meta'.length)
      this.addWatchFile(file)
      const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
      return `export default ${JSON.stringify(lessonMeta(data))}`
    },
  }
}
