// Checks every lesson JSON against the schema, and checks that each trace was
// generated from the lesson's current code (so no trace value is stale or hand typed).
// Run with: npm run validate

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lessonSource, validateLesson } from '../src/engine/validate.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const lessonsDir = join(root, 'content', 'lessons')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []
  })
}

const tracks = JSON.parse(readFileSync(join(root, 'content', 'tracks.json'), 'utf8')) as { id: string }[]
const trackIds = new Set(tracks.map((t) => t.id))

const files = walk(lessonsDir).sort()
const seenIds = new Map<string, string>()
const seenOrder = new Map<string, string>()
let failed = 0

for (const file of files) {
  const rel = relative(root, file)
  const errors: string[] = []
  let data: Record<string, unknown>
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    console.error(`FAIL ${rel}\n  - not valid JSON: ${(e as Error).message}`)
    failed++
    continue
  }
  errors.push(...validateLesson(data))

  const id = String(data.id)
  if (!file.endsWith(`${id}.json`)) errors.push(`file name should be ${id}.json`)
  if (seenIds.has(id)) errors.push(`duplicate id, also used by ${seenIds.get(id)}`)
  seenIds.set(id, rel)

  const track = String(data.track)
  if (!trackIds.has(track)) errors.push(`unknown track "${track}" (add it to content/tracks.json)`)
  if (!rel.includes(`${track}/`)) errors.push(`file should live in content/lessons/${track}/`)
  const orderKey = `${track}#${String(data.order)}`
  if (seenOrder.has(orderKey)) errors.push(`order ${String(data.order)} is also used by ${seenOrder.get(orderKey)}`)
  seenOrder.set(orderKey, rel)

  if (Array.isArray(data.lines)) {
    const hash = createHash('sha256').update(lessonSource(data.lines as { code: string }[]), 'utf8').digest('hex')
    if (typeof data.traceHash === 'string' && data.traceHash !== '' && data.traceHash !== hash) {
      errors.push(`trace is out of date with the code. Run: npm run trace -- ${rel}`)
    }
  }

  if (errors.length) {
    failed++
    console.error(`FAIL ${rel}\n${errors.map((e) => `  - ${e}`).join('\n')}`)
  } else {
    console.log(`ok   ${rel}`)
  }
}

if (files.length === 0) {
  console.error('No lessons found in content/lessons')
  process.exit(1)
}
console.log(`\n${files.length - failed}/${files.length} lessons valid`)
process.exit(failed ? 1 : 0)
