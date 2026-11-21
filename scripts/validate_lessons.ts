// Checks all course content: tracks, units, lessons (format v2), projects and
// demos. Fails if any lesson is missing a step or is under the minimum counts,
// or if any generated data is out of date with the code it came from.
// Run with: npm run validate

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authored, canonicalJson } from '../src/engine/hash.ts'
import type { Track, Unit } from '../src/engine/types.ts'
import { validateLesson, validateProject } from '../src/engine/validate.ts'
import { LANGUAGE_IDS } from '../src/languages/ids.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const content = join(root, 'content')
const sha = (obj: unknown) => createHash('sha256').update(canonicalJson(obj), 'utf8').digest('hex')
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'))

function walk(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []
  })
}

let failed = 0
let checked = 0
function report(file: string, errors: string[]) {
  checked++
  const rel = relative(root, file)
  if (errors.length) {
    failed++
    console.error(`FAIL ${rel}\n${errors.map((e) => `  - ${e}`).join('\n')}`)
  } else {
    console.log(`ok   ${rel}`)
  }
}

/** Every item with a gen.hash must match the hash of its authored fields. */
function staleItems(data: Record<string, unknown>, file: string): string[] {
  const errors: string[] = []
  const rel = relative(root, file)
  const visit = (value: unknown, where: string) => {
    if (Array.isArray(value)) value.forEach((v, i) => visit(v, `${where}[${i}]`))
    else if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>
      const gen = obj.gen as { hash?: string } | undefined
      if (gen?.hash && gen.hash !== sha(authored(obj))) {
        errors.push(`${where || 'project'} changed since its data was generated. Run: npm run trace -- ${rel}`)
      }
      for (const [k, v] of Object.entries(obj)) if (k !== 'gen') visit(v, where ? `${where}.${k}` : k)
    }
  }
  visit(data, '')
  return errors
}

// Tracks
const tracksFile = join(content, 'tracks.json')
const tracks = readJson(tracksFile) as Track[]
{
  const errors: string[] = []
  const ids = new Set<string>()
  tracks.forEach((t, i) => {
    if (!t.id || ids.has(t.id)) errors.push(`tracks[${i}] needs a unique id`)
    ids.add(t.id)
    if (!t.title || !t.description) errors.push(`${t.id}: needs a title and a description`)
    if (!LANGUAGE_IDS.includes(t.language)) errors.push(`${t.id}: unknown language "${t.language}"`)
    if (t.status !== 'open' && t.status !== 'soon') errors.push(`${t.id}: status must be open or soon`)
  })
  report(tracksFile, errors)
}

// Units, lessons and projects per track
const allLessons = new Map(walk(join(content, 'lessons')).map((f) => [readJson(f).id as string, f]))
const allProjects = new Map(walk(join(content, 'projects')).map((f) => [readJson(f).id as string, f]))
const listedLessons = new Set<string>()
const listedProjects = new Set<string>()

for (const track of tracks) {
  const unitsFile = join(content, 'units', `${track.id}.json`)
  if (!existsSync(unitsFile)) {
    if (track.status === 'open') report(unitsFile, [`open track "${track.id}" has no units file`])
    continue
  }
  const { units } = readJson(unitsFile) as { units: Unit[] }
  const errors: string[] = []
  units.forEach((u) => {
    if (!u.id || !u.title || !u.summary) errors.push(`unit ${u.id}: needs id, title and summary`)
    u.lessons.forEach((id, order) => {
      if (!allLessons.has(id)) errors.push(`unit ${u.id}: lesson "${id}" does not exist`)
      listedLessons.add(id)
      const file = allLessons.get(id)
      if (file) {
        const l = readJson(file)
        if (l.unit !== u.id) errors.push(`${id}: its "unit" is ${l.unit}, but it is listed in ${u.id}`)
        if (l.track !== track.id) errors.push(`${id}: its "track" is ${l.track}, expected ${track.id}`)
        if (l.order !== order + 1 + units.slice(0, units.indexOf(u)).reduce((n, x) => n + x.lessons.length, 0)) {
          errors.push(`${id}: "order" should match its place in the track`)
        }
      }
    })
    if (u.project) {
      if (!allProjects.has(u.project)) errors.push(`unit ${u.id}: project "${u.project}" does not exist`)
      listedProjects.add(u.project)
    }
  })
  report(unitsFile, errors)
}

for (const [id, file] of allLessons) {
  const data = readJson(file)
  const errors = [...validateLesson(data), ...staleItems(data, file)]
  if (!file.endsWith(`${id}.json`)) errors.push(`file name should be ${id}.json`)
  if (!listedLessons.has(id)) errors.push('not listed in any unit in content/units/')
  if (!LANGUAGE_IDS.includes(data.language)) errors.push(`unknown language "${data.language}"`)
  report(file, errors)
}

for (const [id, file] of allProjects) {
  const data = readJson(file)
  const errors = [...validateProject(data), ...staleItems(data, file)]
  if (!listedProjects.has(id)) errors.push('not used by any unit')
  report(file, errors)
}

// Demo programs for the landing and style pages
for (const file of walk(join(content, 'demos'))) {
  const d = readJson(file)
  const errors: string[] = []
  const code = (d.lines as { code: string }[]).map((l) => l.code)
  if (!Array.isArray(d.trace) || d.trace.length === 0) errors.push('trace is missing')
  if (d.traceHash !== sha(code)) errors.push(`trace is out of date. Run: npm run trace -- ${relative(root, file)}`)
  report(file, errors)
}

console.log(`\n${checked - failed}/${checked} content files valid`)
process.exit(failed ? 1 : 0)
