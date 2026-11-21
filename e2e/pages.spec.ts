import { expect, test } from '@playwright/test'

test('new visitors get the landing page, See the course leads to the track and a lesson', async ({ page }) => {
  await page.goto('#/')
  await page.keyboard.press('Escape') // skips the boot line
  await expect(page.locator('.lp-title')).toContainText('Learn Python')
  await page.getByRole('link', { name: 'See the course' }).click()
  await expect(page.locator('.course-track')).toHaveCount(4)
  await expect(page.locator('.course-track.soon')).toHaveCount(3)
  await expect(page.locator('.course-track.soon').first()).toContainText('coming soon')
  await page.getByRole('link', { name: 'Python', exact: true }).click()
  await expect(page).toHaveURL(/#\/track\/python/)
  await expect(page.locator('.anno-note')).toContainText('you are here')
  await page.getByRole('link', { name: /Variables and print/ }).first().click()
  await expect(page.locator('.lesson-head h1')).toContainText('Variables and print')
})

test('returning visitors get the dashboard, and reviews show up as due', async ({ page }) => {
  await page.goto('#/lesson/py-01-variables/intro')
  await page.getByRole('button', { name: 'Start →' }).click()
  await page.goto('#/')
  await expect(page.locator('.dashboard')).toBeVisible()
  await expect(page.locator('.dash-continue')).toContainText('resume at predict')

  // Pretend the lesson was finished yesterday: store progress with cards, then make them due.
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('tracetype:progress:v2')!)
    p.cards['py-01-variables:p1'] = { id: 'py-01-variables:p1', lessonId: 'py-01-variables', kind: 'predict', itemId: 'p1', box: 0, due: '2999-01-01', reviews: 0 }
    localStorage.setItem('tracetype:progress:v2', JSON.stringify(p))
  })
  await page.goto('#/settings')
  await page.reload()
  await page.getByRole('button', { name: 'make all review cards due now' }).click()
  await expect(page.locator('.due-badge')).toHaveText('1')
  await page.goto('#/review')
  await page.locator('.choice').filter({ hasText: /^1mango$/ }).click()
  await expect(page.locator('.reveal')).toContainText('You called it')
  await page.getByRole('button', { name: 'Continue →' }).click({ timeout: 10000 })
  await expect(page.locator('.page-title')).toContainText('Done for now')
  const card = await page.evaluate(() => JSON.parse(localStorage.getItem('tracetype:progress:v2')!).cards['py-01-variables:p1'])
  expect(card.box).toBe(1)
  expect(card.reviews).toBe(1)
})

test('progress can be exported and imported', async ({ page }) => {
  await page.goto('#/lesson/py-01-variables/intro')
  await page.getByRole('button', { name: 'Start →' }).click()
  const saved = await page.evaluate(() => localStorage.getItem('tracetype:progress:v2')!)
  await page.goto('#/settings')
  await page.getByRole('button', { name: 'reset progress' }).click()
  await page.getByRole('button', { name: 'yes, reset everything' }).click()
  await expect(page.locator('.nav-stats')).toHaveCount(0)
  await page.getByLabel('> paste progress to import').fill(saved)
  await page.getByRole('button', { name: 'import pasted progress' }).click()
  await expect(page.locator('.tt-toast.ok')).toContainText('Progress loaded')
  await expect(page.locator('.tt-level .lv')).toHaveText('lv 1')
})

test('unknown pages show a friendly 404', async ({ page }) => {
  await page.goto('#/nowhere')
  await expect(page.locator('main')).toContainText('page not found')
})
