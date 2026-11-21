import { expect, test } from '@playwright/test'

// Unit 2: the branch ladder shows which way Python went, and a knob moves the path.

test.setTimeout(180_000)

test('the branch ladder follows the knob', async ({ page }) => {
  await page.goto('#/lesson/py-10-elif/examples')
  await expect(page.locator('.tcode')).toBeVisible()
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight')
  const taken = page.locator('.viz-branch .branch-row.taken .branch-code')
  await expect(taken).toHaveText('elif hour < 18:')
  await expect(page.locator('.viz-branch .branch-row.no')).toHaveCount(1)
  await page.locator('.knob').filter({ hasText: 'hour' }).locator('input[type="number"]').fill('20')
  await expect(taken).toHaveText('else:', { timeout: 120_000 })
  await expect(page.locator('.visual-stack .toutput')).toContainText('Good evening')
})

test('match shows no match, matches and not checked', async ({ page }) => {
  await page.goto('#/lesson/py-11-match/examples')
  await expect(page.locator('.tcode')).toBeVisible()
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
  await expect(page.locator('.viz-branch .branch-row.taken .branch-code')).toHaveText('case "2":')
  await expect(page.locator('.viz-branch .branch-row.skipped')).toHaveCount(2)
  await expect(page.locator('.viz-stdin .tape-cell')).toHaveCount(1)
})
