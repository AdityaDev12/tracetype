// Renders the PNG icons from the brand SVGs with headless Chrome.
// Dev tool: npx tsx scripts/brand/render_icons.ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('../..', import.meta.url))
const pub = join(root, 'public')

const jobs = [
  { src: 'favicon.svg', out: 'favicon-32.png', size: 32 },
  { src: 'brand/apple-touch-icon.svg', out: 'apple-touch-icon.png', size: 180 },
]

const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome' })
for (const job of jobs) {
  const svg = readFileSync(join(pub, job.src), 'utf8')
  const page = await browser.newPage({ viewport: { width: job.size, height: job.size }, deviceScaleFactor: 1 })
  await page.setContent(
    `<html><body style="margin:0;background:transparent">` +
      svg.replace('<svg ', `<svg width="${job.size}" height="${job.size}" `) +
      `</body></html>`,
  )
  await page.screenshot({ path: join(pub, job.out), omitBackground: true, clip: { x: 0, y: 0, width: job.size, height: job.size } })
  await page.close()
  console.log(`wrote public/${job.out}`)
}
await browser.close()
