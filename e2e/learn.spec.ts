import { expect, test } from '@playwright/test'

test('Read more shows free doc links first and book chapters as small text', async ({ page }) => {
  await page.goto('#/lesson/py-01-variables/learn')
  const readMore = page.locator('.read-more')
  const links = readMore.locator('a')
  await expect(links).toHaveCount(3)
  for (const href of await links.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))) {
    expect(href).toMatch(/^https:\/\/docs\.python\.org\/3\//)
  }
  await expect(links.first()).toHaveAttribute('target', '_blank')
  await expect(readMore.locator('.also-in')).toContainText('Also in: Learning Python, Ch. 6: The Dynamic Typing Interlude')
})

test('Learn mode steps with arrow keys and shows the old value', async ({ page }) => {
  await page.goto('#/lesson/py-01-variables/learn')
  await expect(page.locator('.editor')).toBeVisible()
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
  await expect(page.locator('.var-was')).toHaveText('was 10')
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.var-was')).toHaveCount(0)
})

test('no console errors on the main pages', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  for (const mode of ['learn', 'trace', 'recall', 'quiz']) {
    await page.goto(`#/lesson/py-01-variables/${mode}`)
    await page.waitForLoadState('networkidle')
  }
  await page.goto('#/')
  await expect(page.locator('.lesson-item')).toHaveCount(1)
  expect(errors).toEqual([])
})
