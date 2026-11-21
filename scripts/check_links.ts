// Opens every "Read more" link in every lesson and checks that the page loads
// and, if the link has a #section, that the section exists on the page.
// Needs internet, so it is not part of CI. Run with: npm run check-links

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []
  })
}

/** Fetch a page, trying again a few times: a flaky network should not fail every link to that page. */
async function fetchPage(url: string, tries = 4): Promise<{ status: number; html: string }> {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30_000) })
      return { status: r.status, html: r.ok ? await r.text() : '' }
    } catch (e) {
      if (i >= tries) throw e
      await new Promise((ok) => setTimeout(ok, 1500 * i))
    }
  }
}

const pages = new Map<string, Promise<{ status: number; html: string }>>()
function load(url: string) {
  const base = url.split('#')[0]
  if (!pages.has(base)) pages.set(base, fetchPage(base))
  return pages.get(base)!
}

let failed = 0
for (const file of walk(join(root, 'content', 'lessons')).sort()) {
  const lesson = JSON.parse(readFileSync(file, 'utf8')) as { links?: { title: string; url: string }[] }
  for (const link of lesson.links ?? []) {
    let problem = ''
    try {
      const { status, html } = await load(link.url)
      const hash = new URL(link.url).hash.slice(1)
      if (status !== 200) problem = `HTTP ${status}`
      else if (hash && !html.includes(`id="${hash}"`)) problem = `section #${hash} not found on the page`
    } catch (e) {
      problem = (e as Error).message
    }
    if (problem) {
      failed++
      console.error(`FAIL ${relative(root, file)}: ${link.url} (${problem})`)
    } else {
      console.log(`ok   ${link.url}`)
    }
  }
}
process.exit(failed ? 1 : 0)
